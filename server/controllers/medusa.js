const axios = require("axios");
const {v4} = require('uuid');
const {getService} = require("@strapi/admin/server/utils");

const configValidation = () => {
  const config = strapi.config.get('plugin.strapi-plugin-sso')
  if (config['MEDUSA_SERVER'] && config['MEDUSA_ADMIN']) {
    return config
  }
  throw new Error('GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET are required')
}

/**
 * Common constants
 */

/**
 * Verify the token and if there is no account, create one and then log in
 * @param ctx
 * @return {Promise<*>}
 */
async function medusaSingIn(ctx) {
  const config = configValidation()
  const httpClient = axios.create()
  const tokenService = getService('token')
  const userService = getService('user')
  const oauthService = strapi.plugin('strapi-plugin-sso').service('oauth')
  const roleService = strapi.plugin('strapi-plugin-sso').service('role')

  

  const params = new URLSearchParams();
  params.append('')
  
    /** 
     * The request is sent via the admin of medusa, so the user would have been logged in. 
     * We are merely refreshing the keys
     * 
    */

    const userInfoEndpoint = `${config['MEDUSA_SERVER']}/auth/login`
    let userResponse;
    try {
    userResponse = await httpClient.get(userInfoEndpoint)
    }
    catch (e)
    {
      ctx.redirect(`${config['MEDUSA_ADMIN']}`)
    }
    const email = userResponse.data.email;
       
    const dbUser = await userService.findOneByEmail(email)
    let activateUser;
    let jwtToken;

    if (dbUser) {
      // Already registered
      activateUser = dbUser;
      jwtToken = await tokenService.createJwtToken(dbUser)
    } else {
      // Register a new account
      const medusaRoles = await roleService.medusaRoles()
      const roles = medusaRoles && medusaRoles['roles'] ? medusaRoles['roles'].map(role => ({
        id: role
      })) : []

      const defaultLocale = oauthService.localeFindByHeader(ctx.request.headers)
      activateUser = await oauthService.createUser(
        email,
        userResponse.data.last_name,
        userResponse.data.first_name,
        defaultLocale,
        roles
      )
      jwtToken = await tokenService.createJwtToken(activateUser)

      // Trigger webhook
      await oauthService.triggerWebHook(activateUser)
    }
    // Login Event Call
    oauthService.triggerSignInSuccess(activateUser)

    // Client-side authentication persistence and redirection
    const nonce = v4()
    const html = oauthService.renderSignUpSuccess(jwtToken, activateUser, nonce)
    ctx.set('Content-Security-Policy', `script-src 'nonce-${nonce}'`)
    ctx.send(html);
}

module.exports = {
  medusaSingIn
}

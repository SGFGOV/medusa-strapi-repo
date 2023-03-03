const axios = require("axios");
const { v4 } = require("uuid");
const jwt = require("jsonwebtoken");
const { getService } = require("@strapi/admin/server/utils");

const configValidation = () => {
  // eslint-disable-next-line no-undef
  const config = strapi.config.get("plugin.strapi-plugin-sso");
  if (
    config["MEDUSA_SERVER"] &&
    config["MEDUSA_ADMIN"] &&
    config["MEDUSA_STRAPI_SECRET"]
  ) {
    return config;
  }
  throw new Error("MEDUSA_SERVER and MEDUSA_ADMIN");
};

/**
 * Common constants
 */

/**
 * Verify the token and if there is no account, create one and then log in
 // eslint-disable-next-line valid-jsdoc
 * @param ctx
 * @return {Promise<*>}
 */
async function medusaSingIn(ctx) {
  const config = configValidation();
  const tokenService = getService("token");
  const userService = getService("user");
  // eslint-disable-next-line no-undef
  const oauthService = strapi.plugin("strapi-plugin-sso").service("oauth");
  // eslint-disable-next-line no-undef
  const roleService = strapi.plugin("strapi-plugin-sso").service("role");

  // const params = new URLSearchParams();
  // params.append('')

  /**
   * The request is sent via the admin of medusa, so the user would have been logged in.
   * We are merely refreshing the keys
   *
   */

  let userResponse;
  const readCookie = ctx.cookies.get("__medusa_session");
  const decodedToken = jwt.verify(readCookie, config["MEDUSA_STRAPI_SECRET"]);

  if (!decodedToken) {
    ctx.notAuthorized();
    return;
  }
  /* userResponse = await httpClient.get(userInfoEndpoint, {
      headers: {
        Authorization: decodedToken,
      },
    });
  } catch (e) {
    ctx.redirect(`${config["MEDUSA_ADMIN"]}`);
    return;
  }*/
  const email = decodedToken.email;

  const dbUser = await userService.findOneByEmail(email);
  let activateUser;
  let jwtToken;

  if (dbUser) {
    // Already registered
    activateUser = dbUser;
    jwtToken = await tokenService.createJwtToken(dbUser);
  } else {
    // Register a new account
    const medusaRoles = await roleService.medusaRoles();
    const roles =
      medusaRoles && medusaRoles["roles"]
        ? medusaRoles["roles"].map((role) => ({
            id: role,
          }))
        : [];

    const defaultLocale = oauthService.localeFindByHeader(ctx.request.headers);
    activateUser = await oauthService.createUser(
      email,
      userResponse.data.last_name,
      userResponse.data.first_name,
      defaultLocale,
      roles
    );
    jwtToken = await tokenService.createJwtToken(activateUser);

    // Trigger webhook
    await oauthService.triggerWebHook(activateUser);
  }
  // Login Event Call
  oauthService.triggerSignInSuccess(activateUser);

  // Client-side authentication persistence and redirection
  const nonce = v4();
  const html = oauthService.renderSignUpSuccess(jwtToken, activateUser, nonce);
  ctx.set("Content-Security-Policy", `script-src 'nonce-${nonce}'`);
  ctx.send(html);
}

module.exports = {
  medusaSingIn,
};

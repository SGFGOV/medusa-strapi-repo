"use strict";

module.exports = ({ strapi }) => ({
  SSO_TYPE_GOOGLE: "1",
  SSO_TYPE_COGNITO: "2",
  SSO_TYPE_MEDUSA: "2",
  ssoRoles() {
    return [
      {
        "oauth-type": this.SSO_TYPE_GOOGLE,
        name: "Google",
      },
      {
        "oauth-type": this.SSO_TYPE_COGNITO,
        name: "Cognito",
      },
      {
        "oauth-type": this.SSO_TYPE_MEDUSA,
        name: "Medusa",
      },
    ];
  },
  async googleRoles() {
    return await strapi.query("plugin::strapi-plugin-sso.roles").findOne({
      "oauth-type": this.SSO_TYPE_GOOGLE,
    });
  },
  async cognitoRoles() {
    return await strapi.query("plugin::strapi-plugin-sso.roles").findOne({
      "oauth-type": this.SSO_TYPE_COGNITO,
    });
  },
  async medusaRoles() {
    return await strapi.query("plugin::strapi-plugin-sso.roles").findOne({
      "oauth-type": this.SSO_TYPE_MEDUSA,
    });
  },
  async find() {
    return await strapi.query("plugin::strapi-plugin-sso.roles").findMany();
  },
  async update(roles) {
    const query = strapi.query("plugin::strapi-plugin-sso.roles");
    await Promise.all(
      roles.map((role) => {
        return query
          .findOne({ "oauth-type": role["oauth-type"] })
          .then((ssoRole) => {
            if (ssoRole) {
              query.update({
                where: { "oauth-type": role["oauth-type"] },
                data: { roles: role.role },
              });
            } else {
              query.create({
                data: {
                  "oauth-type": role["oauth-type"],
                  roles: role.role,
                },
              });
            }
          });
      })
    );
  },
});

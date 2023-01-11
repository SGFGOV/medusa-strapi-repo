async function hasSuperUser(strapi) {
  strapi.log.debug(`Checking if Superuser exists`);
  const superAdminRole = await strapi.service("admin::user").exists();
  return superAdminRole ? true : false;
}

async function createSuperUser(strapi) {
  strapi.log.warn("No SuperUser found. Creating Superuser now....");

  try {
    const params = {
      username: process.env.SUPERUSER_USERNAME || "SuperUser",
      password: process.env.SUPERUSER_PASSWORD || "MedusaStrapi1",
      firstname: process.env.SUPERUSER_FIRSTNAME || "Medusa",
      lastname: process.env.SUPERUSER_LASTNAME || "Commerce",
      email: process.env.SUPERUSER_EMAIL || "support@medusa-commerce.com",
      blocked: false,
      isActive: true,
    };

    const hasAdmin = await strapi.service("admin::user").exists();

    if (hasAdmin) {
      return;
    }

    const superAdminRole = await strapi.service("admin::role").getSuperAdmin();

    if (!superAdminRole) {
      strapi.log.info("Superuser account exists");
      return;
    }

    await strapi.service("admin::user").create({
      email: params.email,
      firstname: params.firstname,
      username: params.username,
      lastname: params.lastname,
      password: params.password,
      registrationToken: null,
      isActive: true,
      roles: superAdminRole ? [superAdminRole.id] : [],
    });

    strapi.log.info("Superuser account created");
  } catch (error) {
    console.error(error);
  }
}

function getFields(filename, dirName) {
  const fileNameParts = filename.split("/");
  const fileNameWithExtension = fileNameParts[fileNameParts.length - 1];
  const folderName = fileNameWithExtension.split(".")[0];
  const schema = require(`${dirName}/../content-types/${folderName}/schema.json`);
  const keys = Object.keys(schema.attributes);
  const requiredAttributes =
    process.env.NODE_ENV == "test"
      ? ["id"]
      : keys.filter((k) => !schema.attributes[k].via);
  return requiredAttributes;
}

function handleError(strapi, e) {
  const details = JSON.stringify(e.details);
  strapi.log.error(`Error Occurred ${e.name} ${e.message}`);
  strapi.log.error(`Error Details ${details}`);
  strapi.log.error(`stack trace ${e.stack}`);
}

module.exports = {
  hasSuperUser,
  createSuperUser,
  handleError,
  getFields,
};

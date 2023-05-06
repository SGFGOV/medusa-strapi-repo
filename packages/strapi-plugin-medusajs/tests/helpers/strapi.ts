const fs = require('fs');
let instance: any;

const strapi = require('@strapi/strapi')();

export async function setupStrapi(): Promise<any> {
	if (!instance) {
		console.log('loading strapi');
		await strapi.load();
		instance = strapi;

		await instance.server.mount();
	}
	return instance;
}

export async function cleanupStrapi() {
	const dbSettings = strapi.config.get('database.connection');

	// close server to release the db-file
	await strapi.server.httpServer.close();

	// close the connection to the database before deletion
	// await strapi.db.lif.destroy()

	// delete test database after all tests have completed
	if (dbSettings && dbSettings.connection && dbSettings.connection.filename) {
		const tmpDbFile = dbSettings.connection.filename;
		if (fs.existsSync(tmpDbFile)) {
			fs.unlinkSync(tmpDbFile);
		}
	}
}
/*
module.exports = {
  setupStrapi,
  cleanupStrapi
}*/

'use strict';

const { hasSuperUser, createSuperUser } = require('./utils/utils');
const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');
const { categories, authors, articles, global, about } = require('../data/data.json');

async function isFirstRun() {
	// eslint-disable-next-line no-undef
	const pluginStore = strapi.store({
		// eslint-disable-next-line no-undef
		environment: strapi.config.environment,
		type: 'type',
		name: 'setup',
	});
	const initHasRun = await pluginStore.get({ key: 'initHasRun' });
	await pluginStore.set({ key: 'initHasRun', value: true });
	return !initHasRun;
}

async function setPublicPermissions(newPermissions) {
	// Find the ID of the public role
	// eslint-disable-next-line no-undef
	const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
		where: {
			type: 'public',
		},
	});

	// Create the new permissions and link them to the public role
	const allPermissionsToCreate = [];
	Object.keys(newPermissions).map((controller) => {
		const actions = newPermissions[controller];
		const permissionsToCreate = actions.map((action) => {
			// eslint-disable-next-line no-undef
			return strapi.query('plugin::users-permissions.permission').create({
				data: {
					action: `api::${controller}.${controller}.${action}`,
					role: publicRole.id,
				},
			});
		});
		allPermissionsToCreate.push(...permissionsToCreate);
	});
	await Promise.all(allPermissionsToCreate);
}

function getFileSizeInBytes(filePath) {
	const stats = fs.statSync(filePath);
	const fileSizeInBytes = stats['size'];
	return fileSizeInBytes;
}

function getFileData(fileName) {
	const filePath = path.join('data', 'uploads', fileName);
	// Parse the file metadata
	const size = getFileSizeInBytes(filePath);
	const ext = fileName.split('.').pop();
	const mimeType = mime.lookup(ext);

	return {
		path: filePath,
		name: fileName,
		size,
		type: mimeType,
	};
}

async function uploadFile(file, name) {
	// eslint-disable-next-line no-undef
	return strapi
		.plugin('upload')
		.service('upload')
		.upload({
			files: file,
			data: {
				fileInfo: {
					alternativeText: `An image uploaded to Strapi called ${name}`,
					caption: name,
					name,
				},
			},
		});
}

// Create an entry and attach files if there are any
async function createEntry({ model, entry }) {
	try {
		// Actually create the entry in Strapi
		// eslint-disable-next-line no-undef
		await strapi.entityService.create(`api::${model}.${model}`, {
			data: entry,
		});
	} catch (error) {
		console.error({ model, entry, error });
	}
}

async function checkFileExistsBeforeUpload(files) {
	const existingFiles = [];
	const uploadedFiles = [];
	const filesCopy = [...files];

	for (const fileName of filesCopy) {
		// Check if the file already exists in Strapi
		// eslint-disable-next-line no-undef
		const fileWhereName = await strapi.query('plugin::upload.file').findOne({
			where: {
				name: fileName,
			},
		});

		if (fileWhereName) {
			// File exists, don't upload it
			existingFiles.push(fileWhereName);
		} else {
			// File doesn't exist, upload it
			const fileData = getFileData(fileName);
			const fileNameNoExtension = fileName.split('.').shift();
			const [file] = await uploadFile(fileData, fileNameNoExtension);
			uploadedFiles.push(file);
		}
	}
	const allFiles = [...existingFiles, ...uploadedFiles];
	// If only one file then return only that file
	return allFiles.length === 1 ? allFiles[0] : allFiles;
}

async function updateBlocks(blocks) {
	const updatedBlocks = [];
	for (const block of blocks) {
		if (block.__component === 'shared.media') {
			const uploadedFiles = await checkFileExistsBeforeUpload([block.file]);
			// Copy the block to not mutate directly
			const blockCopy = { ...block };
			// Replace the file name on the block with the actual file
			blockCopy.file = uploadedFiles;
			updatedBlocks.push(blockCopy);
		} else if (block.__component === 'shared.slider') {
			// Get files already uploaded to Strapi or upload new files
			const existingAndUploadedFiles = await checkFileExistsBeforeUpload(block.files);
			// Copy the block to not mutate directly
			const blockCopy = { ...block };
			// Replace the file names on the block with the actual files
			blockCopy.files = existingAndUploadedFiles;
			// Push the updated block
			updatedBlocks.push(blockCopy);
		} else {
			// Just push the block as is
			updatedBlocks.push(block);
		}
	}

	return updatedBlocks;
}

async function importArticles() {
	for (const article of articles) {
		const cover = await checkFileExistsBeforeUpload([`${article.slug}.jpg`]);
		const updatedBlocks = await updateBlocks(article.blocks);

		await createEntry({
			model: 'article',
			entry: {
				...article,
				cover,
				blocks: updatedBlocks,
				// Make sure it's not a draft
				publishedAt: Date.now(),
			},
		});
	}
}

async function importGlobal() {
	const favicon = await checkFileExistsBeforeUpload(['favicon.png']);
	const shareImage = await checkFileExistsBeforeUpload(['default-image.png']);
	return createEntry({
		model: 'global',
		entry: {
			...global,
			favicon,
			// Make sure it's not a draft
			publishedAt: Date.now(),
			defaultSeo: {
				...global.defaultSeo,
				shareImage,
			},
		},
	});
}

async function importAbout() {
	const updatedBlocks = await updateBlocks(about.blocks);

	await createEntry({
		model: 'about',
		entry: {
			...about,
			blocks: updatedBlocks,
			// Make sure it's not a draft
			publishedAt: Date.now(),
		},
	});
}

async function importCategories() {
	for (const category of categories) {
		await createEntry({ model: 'category', entry: category });
	}
}

async function importAuthors() {
	for (const author of authors) {
		const avatar = await checkFileExistsBeforeUpload([author.avatar]);

		await createEntry({
			model: 'author',
			entry: {
				...author,
				avatar,
			},
		});
	}
}

async function importSeedData() {
	// Allow read of application content types
	await setPublicPermissions({
		article: ['find', 'findOne'],
		category: ['find', 'findOne'],
		author: ['find', 'findOne'],
		global: ['find', 'findOne'],
		about: ['find', 'findOne'],
	});

	// Create all entries
	await importCategories();
	await importAuthors();
	await importArticles();
	await importGlobal();
	await importAbout();
}

// const setup = require("./dist/server/services/setup")
/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#bootstrap
 */

module.exports = async (strapi) => {
	try {
		if (process.env.ENABLE_SUPER_USER == 'true') {
			if (!(await hasSuperUser(strapi))) {
				await createSuperUser(strapi);
			} else {
				strapi.log.info('Found a Superuser account.');
			}
		}
	} catch (e) {
		/* if(await isFirstRun()){
    let medusaRoleId = await setup.hasMedusaRole(strapi)
    if (!medusaRoleId) {
      const plugins = await strapi.plugins[
        "users-permissions"
      ].services["users-permissions"].initialize();

      const permissions = await strapi.plugins[
        "users-permissions"
      ].services["users-permissions"].getActions(plugins)

      // eslint-disable-next-line guard-for-in
      for (const permission in permissions)
    {
      if(permissions[permission].controllers){
      setup.enabledCrudOnModels(permissions[permission].controllers)}
      
    }
    medusaRoleId = await setup.createMedusaRole(strapi,permissions)
    }
    /*
    let medusaUserId = await hasMedusaUser(strapi)
    if (!medusaUserId) {
      medusaUserId = await createMedusaUser(strapi,medusaRoleId)
    }*/

		console.error(e);
	}
	const shouldImportSeedData = await isFirstRun();

	if (shouldImportSeedData) {
		try {
			console.log('Setting up the template...');
			await importSeedData();
			console.log('Ready to go');
		} catch (error) {
			console.log('Could not import seed data');
			console.error(error);
		}
	}
};

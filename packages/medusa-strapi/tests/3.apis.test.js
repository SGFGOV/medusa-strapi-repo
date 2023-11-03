/* eslint-disable no-undef */
/* eslint-disable no-undef */
const request = require('supertest');
const specificTests = require('./platform-tests/medusa-tests');
const _ = require('lodash');
const {
	setupStrapi,
	clearStrapiDb,
	createTestDataObjects,
	sanitizeData,
	userTestCreds,
	executeLoginAsStrapiAdmin,
	cleanupStrapi,
	containsMediaType,
	namesAttributeOfType,
} = require('./helpers/strapi');
const fs = require('fs');
const { grantPrivilege } = require('./helpers/strapi');
const { hasMedusaRole } = require('strapi-plugin-medusajs/dist/server/services/setup');

const readdirSync = fs.readdirSync;
// const describe = require("jest").describe;
clearStrapiDb();
const includeUniqueFields = true;
let registeredUser = undefined;

const sanityCheckResult = {};
const postResults = {};
const getResult = {};
const putResult = {};
const deleteResult = {};
const adminEmail = process.env.SUPERUSER_EMAIL;
const adminPassword = process.env.SUPERUSER_PASSWORD;

const getDirectories = (source) =>
	readdirSync(source, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);

const PATH = `${__dirname}/../src/api`;
let apisGlobalVar = getDirectories(PATH);
const apisCount = apisGlobalVar.length;

const authCreds = {
	identifier: userTestCreds.email,
	password: userTestCreds.password,
	provider: 'local',
};
delete authCreds.firstname;
const processing = [];
async function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testPost(testInfo) {
	const isMedia = containsMediaType(testInfo.schema);
	const schema = _.cloneDeep(testInfo.schema);
	const isSingleType = testInfo.schema.kind == 'singleType';
	const apiEndpoint = isSingleType ? testInfo.schema.info.singularName : testInfo.schema.info.pluralName;
	const mediaFields = namesAttributeOfType(schema, 'media');
	const testData = _.cloneDeep(testInfo);
	const data = sanitizeData(testData);

	await delay(100);
	const creds = await request(strapi.server.httpServer).post(`/api/auth/local`).send(authCreds);
	expect(creds.status).toBe(200);
	console.log(`posting  ${apiEndpoint}`);
	let postResult;
	try{
	if (!isMedia) {
		if (!isSingleType) {
			postResult = await request(strapi.server.httpServer)
				.post(`/api/${apiEndpoint}`)
				.send({ data: data })
				.set('Authorization', `Bearer ${creds.body.jwt}`);
		} else {
			postResult = await request(strapi.server.httpServer)
				.put(`/api/${apiEndpoint}`)
				.send({ data: data })
				.set('Authorization', `Bearer ${creds.body.jwt}`);
		}
	} else {
		if (!isSingleType) {
			postResult = await request(strapi.server.httpServer)
				.post(`/api/${apiEndpoint}`)
				.attach(`files.${mediaFields[0]}`, `${__dirname}/./fixtures/coffee-art.jpg`)
				.field('data', '{ "medusa_id": "1", "filename": "coffee-art.jpg","name":"test","title":"test" }', {
					contentType: 'application/json',
				})
				.set('Authorization', `Bearer ${creds.body.jwt}`);
		} else {
			postResult = await request(strapi.server.httpServer)
				.put(`/api/${apiEndpoint}`)
				.attach(`files.${mediaFields[0]}`, `${__dirname}/./fixtures/coffee-art.jpg`)
				.field(
					'data',
					'{ "medusa_id": "1", "filename": "coffee-art.jpg","name":"test","title":"test","siteName": "test.com","siteDescription": "test.com" }',
					{
						contentType: 'application/json',
					}
				)
				.set('Authorization', `Bearer ${creds.body.jwt}`);
		}
	}
	const status = postResult.status == 200;
	if (!status) {
		console.error(apiEndpoint);
		console.error(apiEndpoint, JSON.stringify(postResult.body.error));
	}
	expect(status).toBeTruthy();
	/** @todo make this template generic */
	if (isMedia) {
		postResults[apiEndpoint] = {
			data: {
				medusa_id: '1',
				filename: 'coffee-art.jpg',
				name: 'test',
				title: 'test',
				siteName: 'test.com',
				siteDescription: 'test.com',
				...postResult.body.data,
			},
		};
	} else {
		postResults[apiEndpoint] = postResult.body;
	}
}catch(e)
{
	console.log(e.message)
	expect(0).toBe(1)
}
	const id =
		postResults[apiEndpoint]?.id || postResults[apiEndpoint]?.data?.id || postResults[apiEndpoint]?.data?.slug 
	expect(id).toBeDefined();
	return postResults[apiEndpoint];
}

async function testGet(apiName, id, isSingleType) {
	let getResult;
	if (!id) {
		try {
			getResult = await request(strapi.server.httpServer).get(`/api/${apiName}`);
			expect(getResult.status).toBe(200);
		} catch (e) {
			console.log(`${apiName} no data `);
			expect(getResult.status).toBe(404);
		}
	} else {
		const creds = await request(strapi.server.httpServer).post(`/api/auth/local`).send(authCreds);
		expect(creds.status).toBe(200);
		const url = isSingleType ? `/api/${apiName}` : `/api/${apiName}/${id}`;
		getResult = await request(strapi.server.httpServer).get(url).set('Authorization', `Bearer ${creds.body.jwt}`);
		const status = getResult.status == 200;

		expect(status).toBeTruthy();
	}
	return getResult;
}

async function testPut(apiName, id, data, isSingleType) {
	const creds = await request(strapi.server.httpServer).post(`/api/auth/local`).send(authCreds);
	expect(creds.status).toBe(200);
	const url = isSingleType ? `/api/${apiName}` : `/api/${apiName}/${id}`;
	const s = await request(strapi.server.httpServer)
		.put(url)
		.send({ data: data })
		.set('Authorization', `Bearer ${creds.body.jwt}`);

	// Expect response http code 200
	const status = s.status == 200;
	expect(status).toBeTruthy();
	return s;
}

async function testDelete(apiName, id, isSingleType) {
	const url = isSingleType ? `/api/${apiName}` : `/api/${apiName}/${id}`;
	const creds = await request(strapi.server.httpServer).post(`/api/auth/local`).send(authCreds);
	expect(creds.status).toBe(200);
	const s = await request(strapi.server.httpServer).delete(url).set('Authorization', `Bearer ${creds.body.jwt}`);
	expect(s.status).toBeDefined(); // Expect response http code 200
	const status = s.status == 200;
	expect(status).toBeTruthy();
	return s;
}

async function executeProcessTest(apiSingular, testInfo) {
	await testPost(testInfo);
}

async function scheduleTestPost(apiSingular, unchangingUnique) {
	const schemaFilePath = `${PATH}/${apiSingular}/content-types/${apiSingular}/schema.json`;

	if (apisGlobalVar.includes(apiSingular)) {
		apisGlobalVar.splice(apisGlobalVar.indexOf(apiSingular), 1);
	}

	const testInfo = createTestDataObjects(schemaFilePath, includeUniqueFields, [], unchangingUnique);
	for (const dep of testInfo.deps) {
		if (apisGlobalVar.includes(dep)) {
			processing.push(dep);

			await scheduleTestPost(dep, unchangingUnique);

			processing.pop();
		}
	}
	await executeProcessTest(apiSingular, testInfo);
}

function sanityCheckTest() {
	for (const apiSingular of apisGlobalVar) {
		it(`sanity check /get ${apiSingular}`, async () => {
			const schemaFilePath = `${PATH}/${apiSingular}/content-types/${apiSingular}/schema.json`;
			const testInfo = createTestDataObjects(schemaFilePath, includeUniqueFields);

			const isSingleType = testInfo.schema.kind == 'singleType';
			if (isSingleType) {
				return;
			}
			const apiEndPoint = isSingleType ? testInfo.schema.info.singularName : testInfo.schema.info.pluralName;
			if (!isSingleType) {
				sanityCheckResult[apiEndPoint] = await testGet(apiEndPoint, undefined, isSingleType);
			} else {
				return;
			}
			expect(
				sanityCheckResult[apiEndPoint]?.status == 200 || sanityCheckResult[apiEndPoint]?.status == 404
			).toBeTruthy();
		});
	}
}

function clearRequireCache() {
	Object.keys(require.cache).forEach(function (key) {
		delete require.cache[key];
	});
}
jest.setTimeout(3e6);

describe('Testing strapi ', () => {
	console.log(`found ${apisCount} apis to test in src/api`);
	beforeAll(async () => {
		clearRequireCache();
		await setupStrapi();
		const roleId = await hasMedusaRole();

		for (const api of apisGlobalVar) {
			try {
				await grantPrivilege(roleId, `permissions.application.controllers.${api}.index`);
			} catch (e) {
				// console.log(`role doesn't exist:${roleId}, ${e.message}`);
			}
		}
		const response = await executeLoginAsStrapiAdmin(adminEmail, adminPassword, strapi);
		expect(response.status).toBe(200);
		const token = response.body?.data?.token;
		registeredUser = await request(strapi.server.httpServer)
			.post(`/strapi-plugin-medusajs/create-medusa-user`)
			.send(userTestCreds)
			.set('Authorization', `Bearer ${token}`);
		expect(registeredUser.status).toBe(200);
	});

	afterAll(async () => {
		await cleanupStrapi();
	});

	sanityCheckTest();
	describe(`sanity testing testing get/`, () => {
		apisGlobalVar = getDirectories(PATH);
		const apiTestList = getDirectories(PATH);
		count = 0;

		for (const apiSingular of apiTestList) {
			// console.log(`processing ${apiSingular}`);
			it(`testing  ${apiSingular}`, async () => {
				while (apisGlobalVar.length > 0) {
					await scheduleTestPost(apisGlobalVar[0], false);
				}
				expect(Object.keys(postResults).length).toBe(apiTestList.length);
				const schemaFilePath = `${PATH}/${apiSingular}/content-types/${apiSingular}/schema.json`;
				const testInfo = createTestDataObjects(schemaFilePath);
				const isSingleType = testInfo.schema.kind == 'singleType';
				const apiEndpoint = isSingleType ? testInfo.schema.info.singularName : testInfo.schema.info.pluralName;
				const id =
					postResults[apiEndpoint].slug ??
					postResults[apiEndpoint].medusa_id ??
					postResults[apiEndpoint].id ??
					postResults[apiEndpoint].data.id;
				if (postResults[apiEndpoint]) {
					getResult[apiEndpoint] = await testGet(apiEndpoint, id, isSingleType);
					expect(getResult[apiEndpoint]?.status).toBe(200);
					putResult[apiEndpoint] = await testPut(apiEndpoint, id, sanitizeData(testInfo), isSingleType);
					expect(putResult[apiEndpoint]?.status).toBe(200);
					deleteResult[apiEndpoint] = await testDelete(apiEndpoint, id, isSingleType);

					expect(deleteResult[apiEndpoint]?.status).toBe(200);
				} else {
					console.log(`skipped ${apiEndpoint}`);
				}
			}, 60e3);
		}
	});

	describe('specific tests', () => {
		it(`testing sync`, async () => {
			while (apisGlobalVar.length > 0) {
				await scheduleTestPost(apisGlobalVar[0], false);
			}
			expect(apisGlobalVar.length).toBe(0);
		});

		specificTests();
	});

	//* * preparing for test with dummy data */
	/** medusa-specific test */

	// testApis();
});
// await request(strapi.server.httpServer).get("/api/countries").expect(200); // Expect response http code 200

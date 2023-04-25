const { HttpRequest } = require('@aws-sdk/protocol-http');
const { SignatureV4 } = require('@aws-sdk/signature-v4');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');
const { Hash } = require('@aws-sdk/hash-node');
const { formatUrl } = require('@aws-sdk/util-format-url');

function getCertificate() {
	const certificateURL = 'https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem';
	const downloadFileSync = require('download-file-sync');
	return downloadFileSync(process.env.AWS_CERTIFICATE_URL || certificateURL);
}

/* getCertificate =(async()=>
{


const request = await https.get(certificateURL || process.env.AWS_CERTIFICATE_URL)
  return  await stream2buffer(request.response?.Body)
})()*/

const getIamAuthToken = async () => {
	try {
		/* const credentials = {
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    };*/
		// I don't want to use the older v2 SDK (which had the signer for RDS)
		// The code below is inspired by comments from: https://github.com/aws/aws-sdk-js-v3/issues/1823
		const signer = new SignatureV4({
			service: 'rds-db',
			region: process.env.AWS_REGION ?? 'ap-south-1',
			credentials: defaultProvider(),
			sha256: Hash.bind(null, 'sha256'),
		});

		const request = new HttpRequest({
			method: 'GET',
			protocol: 'https',
			hostname: process.env.RDS_HOSTNAME,
			port: process.env.RDS_PORT,
			query: {
				Action: 'connect',
				DBUser: process.env.RDS_USERNAME,
			},
			headers: {
				host: `${process.env.RDS_HOSTNAME}:${process.env.RDS_PORT}`,
			},
		});

		const result = signer
			.presign(request, {
				expiresIn: 900,
			})
			.then(
				(presignedValue) => {
					return formatUrl(presignedValue).replace(`https://`, '');
				},
				(error) => {
					console.log(error);
				}
			);

		return result;
	} catch (err) {
		console.log(err);
	}
};

async function iamTokenWrapper() {
	try {
		const token = await getIamAuthToken();
		//   let result = await updateConnection(connection,token)
		// now process r2
		return token; // this will be the resolved value of the returned promise
	} catch (e) {
		console.log(e);
		throw e; // let caller know the promise was rejected with this reason
	}
}

function DatabaseConfiguration({ env }) {
	const getToken = async () => {
		if (process.env.AWS_ENABLED) {
			const a = await iamTokenWrapper();
			return a;
		}
		return undefined;
	};

	const awsConnection = {
		connection: {
			client: `${process.env.RDS_DATABASE_TYPE || 'postgres'}`,
			connection: {
				host: env('DATABASE_HOST', process.env.RDS_HOSTNAME || '127.0.0.1'),
				port: env.int('DATABASE_PORT', parseInt(process.env.RDS_PORT, 10) || 5432),
				database: env('DATABASE_NAME', process.env.RDS_DATABASE || 'postgres_strapi'),
				user: env('DATABASE_USERNAME', process.env.RDS_USERNAME || 'postgres'),
				password: getToken || env('DATABASE_PASSWORD', 'postgres'),
				ssl: env.bool('DATABASE_SSL', {
					rejectUnauthorized: false,
					ca: getCertificate(),
				}),
			},
		},
	};

	const noAwsConnection = {
		connection: {
			client: 'postgres',
			connection: {
				host: env('DATABASE_HOST', '127.0.0.1'),
				port: env.int('DATABASE_PORT', '5432'),
				database: env('DATABASE_NAME', 'postgres_strapi'),
				user: env('DATABASE_USERNAME', 'postgres'),
				password: env('DATABASE_PASSWORD', 'postgres'),
			},
		},
	};

	const connection = process.env.AWS_ENABLED == 'true' ? awsConnection : noAwsConnection;

	// console.log(connection);

	// console.log(connection.connection.password);

	return connection;
}

module.exports = DatabaseConfiguration;

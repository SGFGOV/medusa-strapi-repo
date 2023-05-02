<div align="center">
 <img src="https://github.com/yasudacloud/strapi-plugin-sso/blob/main/docs/strapi-plugin-sso.png?raw=true" width="180"/>
</div>
### 🏠 [Homepage](../../README.md)
# Strapi plugin strapi-plugin-sso-medusa


## Introduction
This plugin can provide single sign-on. This document is still a little work in progress as the new admin requires you to make some changes to the admin and admin-ui to parameterise the strapi url and csp frame url !

You will be able to log in to the administration screen using your medusa credentials

This plugin was based on strapi-plugin-sso which supports google and cognito logins. However as we want medusa to be the true source of account information all those routes have been disabled. 

This plugin is designed exclusively for medusa 

Please read the [documents](#user-content-documentationenglish) for some precautions.

**This plugin is developed by one engineer.**

## Preview
[image](https://user-images.githubusercontent.com/97059996/235581081-55c04342-b9d9-4f1d-ae9b-6cfa096434ad.png)


## Easy to install
```shell
yarn add strapi-plugin-sso-medusa
```
or
```shell
npm i strapi-plugin-sso-medusa
```

## Requirements
- Strapi Version4
- **strapi-plugin-sso-medusa**
- a properly configured medusa server

## Example Configuration
```javascript
// config/plugins.js
module.exports = ({env}) => ({

  ...
  'strapi-plugin-sso-medusa': {
    enabled: true,
    config: {
			MEDUSA_SERVER: env('MEDUSA_BACKEND_URL', 'http://localhost:9000'),
			MEDUSA_ADMIN: env('MEDUSA_BACKEND_ADMIN', 'http://localhost:7000'),
			MEDUSA_STRAPI_SECRET: env('MEDUSA_STRAPI_SECRET', 'no_secret'),
		},
}

...
}
)
```

## Support
- ✅ NodeJS >=16.x
- Strapi 4.9.2 or higher

## Configuring the medusa admin to support sso with strapi

In your medusa admin-ui/ui/src/services/api.js

add the following
```
strapi: {
    login() {
      const path = `/strapi/admin/login`
      return medusaRequest("GET", path)
    },

    logout() {
      const path = `/strapi/admin/login`
      return medusaRequest("DELETE", path)
    },
  },
```

in your medusa admin-ui/ui/src/domain
add files index.tsx and strapi-cms.tsxt

domain
  |--cms
  |   |-- index.tsx
  |    |--strapi-cms.tsxt
  |---other domains

create folder called cms


add the following contents to index.tsx

```
import StrapiCms from "./strapi-cms"
import { Route, Routes } from "react-router-dom"
const Cms = () => {
  return (
    <Routes>
      <Route path="/" element={<StrapiCms reload={false} />} />
    </Routes>
  )
}

export default Cms
```

add the following contents to strapi-cms.tsx
```

import { useState } from 'react';
import api from '../../services/api';
import { strapiUrl } from '../../services/config';
const authenticatedStrapiUrl = `${strapiUrl}/strapi-plugin-sso/medusa`;

const StrapiCms = ({ reload }) => {
	const [strapiFrameState, setStrapiFrameState] = useState<string>(reload ? 'true' : 'false');
	// setStrapiFrameState("")
	api.auth.session().then(async (session) => {
		if (session) {
			await api.strapi.login();
			setStrapiFrameState(session.data.user.id);
		}
	});
	return (
		<iframe
			src={authenticatedStrapiUrl}
			key={strapiFrameState?.toString()}
			width="100%"
			height="100%"
			sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-scripts"
		></iframe>
	);
};
export default StrapiCms;


```

then in a.tsx in SGF-MedusaAdmin/src/pages/a.jsx
add the following

```
 import Cms from "../domain/cms"
```

add the route in a.jsx
```
 <Route path="cms/*" element={<Cms />} />

```

## Show your support

I love developing software and building products that are useful. 
I sincerely hope you this project helps you. I'm happy to help if you need support setting this up. 
Give a ⭐️ if this project helped you! Catch me on discord @govdiw

As you might have guessed by now that considerable time and effort has gone into make this product useful to the community at large, and I'd love to keep maintaining and upgrading this. However, As much as we love FOSS software, nothing in this world is truly free. Please help by [sponsoring or supporting the project]. (https://github.com/sponsors/SGFGOV)

***

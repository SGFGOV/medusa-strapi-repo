import { factories } from "@strapi/strapi";
import pluginId from "../../../admin/src/pluginId";
import { defaultContentTypes } from "../../lib/default-content-types";

const coreControllerContentTypesMap = defaultContentTypes.reduce((acc, curr) => {
	acc[curr] = factories.createCoreController(`plugin::${pluginId}.${curr}`);
	return acc;
}, {} as Record<typeof defaultContentTypes[number], any>);

export default {
	...coreControllerContentTypesMap,
};

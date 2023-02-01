import { describe, expect, it } from "@jest/globals";
import {
    mockedRegionBootStrapData,
    mockedRegionBootStrapTranslatedData
} from "../__fixtures__/region.fixture";
import { translateIdsToMedusaIds } from "../../api/controllers/hooks/seed";
import * as _ from "lodash";
describe("translating ids to medusa-ids", () => {
    it("check translation region", () => {
        const dataToTranslate = _.cloneDeep(mockedRegionBootStrapData);
        const translatedId = translateIdsToMedusaIds({
            regions: dataToTranslate as any
        });
        expect(translatedId).toMatchObject({
            regions: mockedRegionBootStrapTranslatedData
        });
    });
});

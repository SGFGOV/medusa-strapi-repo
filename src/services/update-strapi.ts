import { BaseService } from "medusa-interfaces";
import axios, { AxiosResponse, Method } from "axios";
import crypto = require("crypto");
import { Logger } from "@medusajs/medusa/dist/types/global";
import { EventBusService, ProductService,
  ProductVariantService, RegionService } from "@medusajs/medusa";
import role from
  "@strapi/plugin-users-permissions/server/content-types/role/index";

const IGNORE_THRESHOLD = 3; // seconds

export interface StrapiMedusaPluginOptions
{
  encryption_algorithm:string
  strapi_protocol:string;
  strapi_host:string;
  strapi_default_user:MedusaUserType;
  strapi_admin:AdminUserType;
  strapi_port:string
  strapi_secret?:string;
  strapi_public_key?:string;
  strapi_ignore_threshold:number;
}

/* export interface MedusaUserId{
  username: string;
  password: string,
  email: string,
  confirmed: boolean,
  blocked: boolean,
  provider?: string,
}*/

export type AdminUserType ={
  email:string;
  username: string;
  password: string;
  firstname?:string;
  name?:string;
  lastname?:string;
}
export type MedusaUserType = {
    username: string;
    password: string,
    email: string,
    confirmed: boolean,
    blocked: boolean,
    provider?: string,
};

class UpdateStrapiService extends BaseService {
  productService_: ProductService;
  productVariantService_: ProductVariantService;
  regionService_: RegionService;
  eventBus_: EventBusService;
  algorithm: string;
  options_: StrapiMedusaPluginOptions;
  protocol: string;
  strapi_url: string;
  encryption_key: any;
  strapiDefaultMedusaUserAuthToken: string;
  redis_: any;
  strapiDefaultUserProfile: any;
  key: WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>;
  iv: any;
  strapiAdminAuthToken: string;

  userAdminProfile: any;
  logger: Logger;
  isHealthy: boolean;
  strapiDefaultUserId: any;
  constructor(
      {
        regionService,
        productService,
        redisClient,
        productVariantService,
        eventBusService,
        logger,
      },
      options:StrapiMedusaPluginOptions,
  ) {
    super();

    this.logger = logger;
    this.productService_ = productService;
    this.productVariantService_ = productVariantService;
    this.regionService_ = regionService;
    this.eventBus_ = eventBusService;
    this.options_ = options;
    this.algorithm = this.options_.
        encryption_algorithm||"aes-256-cbc"; // Using AES encryption
    this.iv = crypto.randomBytes(16);
    this.protocol = this.options_.strapi_protocol;

    this.strapi_url=`${this.protocol??"https"}://${this.options_.strapi_host??"localhost"}:${this.options_.strapi_port??1337}`;

    this.encryption_key = this.options_.strapi_secret||
    this.options_.strapi_public_key;
    this.strapiDefaultMedusaUserAuthToken = "";
    this.isHealthy = false;
    this.checkStrapiHealth().then((res) => {
      if (res) {
        logger.info("Strapi Health Check Ok");
        this.isHealthy = res;
      }
    });

    // attaching the default user
    this.redis_ = redisClient;
  }

  async startInterface():Promise<void|Error> {
    try {
      await this.intializeServer();
      this.logger.info("Successfully Bootstrapped the strapi server");
    } catch (e) {
      this.logger.error(`Unable to  bootstrap the strapi server, 
        please check configuration , ${e}`);
      return e;
    }
  }


  async addIgnore_(id, side):Promise<any> {
    const key = `${id}_ignore_${side}`;
    return await this.redis_.set(
        key,
        1,
        "EX",
        this.options_.strapi_ignore_threshold || IGNORE_THRESHOLD,
    );
  }

  async shouldIgnore_(id, side):Promise<any> {
    const key = `${id}_ignore_${side}`;
    return await this.redis_.get(key);
  }

  async getVariantEntries_(variants):Promise<any> {
    // eslint-disable-next-line no-useless-catch
    try {
      const allVariants = variants.map(async (variant) => {
        // update product variant in strapi
        const result = await this.updateProductVariantInStrapi(variant);
        return result.productVariant;
      });
      return Promise.all(allVariants);
    } catch (error) {
      throw error;
    }
  }

  async createImageAssets(product):Promise<any> {
    const assets = await Promise.all(
        product.images
            ?.filter((image) => image.url !== product.thumbnail)
            .map(async (image, i) => {
              const result = await this.
                  createEntryInStrapi("images", product.id, {
                    image_id: image.id,
                    url: image.url,
                    metadata: image.metadata || {},
                  });
              return result?.data?.image??undefined;
            }),
    );
    return assets || [];
  }

  getCustomField(field, type):string {
    const customOptions = this.options_[`custom_${type}_fields`];

    if (customOptions) {
      return customOptions[field] || field;
    } else {
      return field;
    }
  }


  async createProductInStrapi(productId):Promise<any> {
    const hasType = await this.getType("products")?true:false;
    if (!hasType) {
      return Promise.resolve();
    }

    // eslint-disable-next-line no-useless-catch
    try {
      const product = await this.productService_.retrieve(productId, {
        relations: [
          "options",
          "variants",
          "variants.prices",
          "variants.options",
          "type",
          "collection",
          "tags",
          "images",
        ],
        select: [
          "id",
          "title",
          "subtitle",
          "description",
          "handle",
          "is_giftcard",
          "discountable",
          "thumbnail",
          "weight",
          "length",
          "height",
          "width",
          "hs_code",
          "origin_country",
          "mid_code",
          "material",
          "metadata",
        ],
      });

      if (product) {
        return await this.createEntryInStrapi("products", productId, product);
      }
    } catch (error) {
      throw error;
    }
  }


  async createProductVariantInStrapi(variantId):Promise<any> {
    const hasType = await this.getType("product-variants")
        .then(() => true)
        .catch((e) => false);

    if (!hasType) {
      return Promise.resolve();
    }

    // eslint-disable-next-line no-useless-catch
    try {
      const variant = await this.productVariantService_.retrieve(variantId, {
        relations: ["prices", "options", "product"],
      });

      // this.logger.info(variant)
      if (variant) {
        return await this.createEntryInStrapi(
            "product-variants",
            variantId,
            variant,
        );
      }
    } catch (error) {
      throw error;
    }
  }

  async createRegionInStrapi(regionId):Promise<any> {
    const hasType = await this.getType("regions")
        .then(() => true)
        .catch(() => false);
    if (!hasType) {
      this.logger.info('Type "Regions" doesnt exist in Strapi');
      return Promise.resolve();
    }

    // eslint-disable-next-line no-useless-catch
    try {
      const region = await this.regionService_.retrieve(regionId, {
        relations: [
          "countries",
          "payment_providers",
          "fulfillment_providers",
          "currency",
        ],
        select: ["id", "name", "tax_rate", "tax_code", "metadata"],
      });

      // this.logger.info(region)

      return await this.createEntryInStrapi("regions", regionId, region);
    } catch (error) {
      throw error;
    }
  }

  async updateRegionInStrapi(data): Promise<any> {
    const hasType = await this.getType("regions")
        .then((res) => {
        // this.logger.info(res.data)
          return true;
        })
        .catch((error) => {
        // this.logger.info(error.response.status)
          return false;
        });
    if (!hasType) {
      return Promise.resolve();
    }

    const updateFields = [
      "name",
      "currency_code",
      "countries",
      "payment_providers",
      "fulfillment_providers",
    ];

    // check if update contains any fields in Strapi to minimize runs
    const found = data.fields.find((f) => updateFields.includes(f));
    if (!found) {
      return;
    }

    // eslint-disable-next-line no-useless-catch
    try {
      const ignore = await this.shouldIgnore_(data.id, "strapi");
      if (ignore) {
        return;
      }

      const region = await this.regionService_.retrieve(data.id, {
        relations: [
          "countries",
          "payment_providers",
          "fulfillment_providers",
          "currency",
        ],
        select: ["id", "name", "tax_rate", "tax_code", "metadata"],
      });
      // this.logger.info(region)

      if (region) {
        // Update entry in Strapi
        const response = await this.updateEntryInStrapi(
            "regions",
            region.id,
            region,
        );
        this.logger.info("Region Strapi Id - ", response);
      }

      return region;
    } catch (error) {
      throw error;
    }
  }

  async updateProductInStrapi(data):Promise<any> {
    const hasType = await this.getType("products")
        .then((res) => {
        // this.logger.info(res.data)
          return true;
        })
        .catch((error) => {
        // this.logger.info(error.response.status)
          return false;
        });
    if (!hasType) {
      return Promise.resolve();
    }

    // this.logger.info(data)
    const updateFields = [
      "variants",
      "options",
      "tags",
      "title",
      "subtitle",
      "tags",
      "type",
      "type_id",
      "collection",
      "collection_id",
      "thumbnail",
    ];

    // check if update contains any fields in Strapi to minimize runs
    const found = data.fields.find((f) => updateFields.includes(f));
    if (!found) {
      return Promise.resolve();
    }

    // eslint-disable-next-line no-useless-catch
    try {
      const ignore = await this.shouldIgnore_(data.id, "strapi");
      if (ignore) {
        this.logger.info(
            "Strapi has just updated this product"+
            " which triggered this function. IGNORING... ",
        );
        return Promise.resolve();
      }
      const product = await this.productService_.retrieve(data.id, {
        relations: [
          "options",
          "variants",
          "variants.prices",
          "variants.options",
          "type",
          "collection",
          "tags",
          "images",
        ],
        select: [
          "id",
          "title",
          "subtitle",
          "description",
          "handle",
          "is_giftcard",
          "discountable",
          "thumbnail",
          "weight",
          "length",
          "height",
          "width",
          "hs_code",
          "origin_country",
          "mid_code",
          "material",
          "metadata",
        ],
      });

      if (product) {
        await this.updateEntryInStrapi("products", product.id, product);
      }

      return product;
    } catch (error) {
      throw error;
    }
  }


  async updateProductVariantInStrapi(data):Promise<any> {
    let hasType:boolean;
    try {
      const result = await this.getType("product-variants");
      hasType=result?true:false;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
    if (!hasType) {
      return Promise.resolve();
    }

    const updateFields = [
      "title",
      "prices",
      "sku",
      "material",
      "weight",
      "length",
      "height",
      "origin_country",
      "options",
    ];

    // Update came directly from product variant service so only act on a couple
    // of fields. When the update comes from the product we want to ensure
    // references are set up correctly so we run through everything.
    if (data.fields) {
      const found = data.fields.find((f) => updateFields.includes(f));
      if (!found) {
        return Promise.resolve();
      }
    }

    try {
      const ignore = await this.shouldIgnore_(data.id, "strapi");
      if (ignore) {
        return Promise.resolve();
      }

      const variant = await this.productVariantService_.retrieve(data.id, {
        relations: ["prices", "options"],
      });
      this.logger.info(variant);

      if (variant) {
        // Update entry in Strapi
        const response = await this.updateEntryInStrapi(
            "product-variants",
            variant.id,
            variant,
        );
        this.logger.info("Variant Strapi Id - ", response);
      }

      return variant;
    } catch (error) {
      this.logger.info("Failed to update product variant", data.id);
      throw error;
    }
  }

  async deleteProductInStrapi(data):Promise<any> {
    const hasType = await this.getType("products")
        .then(() => true)
        .catch((err) => {
          this.logger.info(err);
          return false;
        });
    if (!hasType) {
      return Promise.resolve();
    }

    const ignore = await this.shouldIgnore_(data.id, "strapi");
    if (ignore) {
      return Promise.resolve();
    }

    return await this.deleteEntryInStrapi("products", data.id);
  }

  async deleteProductVariantInStrapi(data) :Promise<any> {
    const hasType = await this.getType("product-variants")
        .then(() => true)
        .catch((err) => {
        // this.logger.info(err)
          return false;
        });
    if (!hasType) {
      return Promise.resolve();
    }

    const ignore = await this.shouldIgnore_(data.id, "strapi");
    if (ignore) {
      return Promise.resolve();
    }

    return await this.deleteEntryInStrapi("product-variants", data.id);
  }

  // Blocker - Delete Region API
  async deleteRegionInStrapi(data):Promise<any> {
    return;
  }

  async getType(type:string, username?: string, email?:string,
      password?: string) :Promise<AxiosResponse> {
    const loginRespone = await this.
        loginToStrapi(email, password) as AxiosResponse;
    // console.log(loginRespone);
    this.strapiDefaultMedusaUserAuthToken =
    loginRespone.data.jwt;

    const config = {
      url: `${this.strapi_url}/api/${type}`,
      method: "get",
      headers: {
        Authorization: `Bearer ${this.strapiDefaultMedusaUserAuthToken}`,
      },
    };

    const result = await axios.get(config.url, {
      headers: config.headers,
    });
    return result;
  }

  async checkStrapiHealth():Promise<boolean> {
    const config = {
      url: `${this.strapi_url}/_health`,
    };
    this.logger.info("Checking strapi Health");
    const response = await axios.head(config.url);
    this.isHealthy = response.status == 204 ? true:false;
    if (this.isHealthy) {
      this.logger.info("Strapi is healthy");
    } else {
      this.logger.info("Strapi is unhealth");
    }
    return this.isHealthy;
  }

  encrypt(text:string):any {
    return text;
    const cipher = crypto.createCipheriv("aes-256-cbc",
        Buffer.from(this.key), this.iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: this.iv.toString("hex"),
      encryptedData: encrypted.toString("hex") };
  }

  // Decrypting text
  decrypt(text):string {
    return text;
    const iv = Buffer.from(text.iv, "hex");
    const encryptedText = Buffer.from(text.encryptedData, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc",
        Buffer.from(this.key), this.iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  async registerDefaultMedusaUser() :Promise<AxiosResponse> {
    try {
      const authParams = {
        ...this.options_.strapi_default_user,
      };
      const response = await this.registerMedusaUser(authParams);
      // console.log(response);
      this.strapiDefaultMedusaUserAuthToken = response.data.jwt;
      this.strapiDefaultUserProfile = response.data.user;
      this.strapiDefaultUserId = response.data.user.id;
      return response;
    } catch (error) {
      this.logger.error("unable to register default user",
          (error as Error).message);
    }
  }

  async deleteDefaultMedusaUser() :Promise<AxiosResponse> {
    try {
      const response = await this.
          deleteMedusaUserFromStrapi(this.strapiDefaultUserId);
      this.strapiDefaultMedusaUserAuthToken = undefined;
      this.strapiDefaultUserProfile = undefined;
      return response;
    } catch (error) {
      this.logger.error("unable to delete default user",
          (error as Error).message);
    }
  }

  async deleteMedusaUserFromStrapi(id:string):Promise<AxiosResponse> {
    const result = await this.strapiSend("delete",
        "users", id);
    console.log(result);
    return result;
  }

  /** Todo Create API based access
  async fetchMedusaUserApiKey(emailAddress) {

    return await this.strapiAdminSend("get")
  }

  */


  async configureStrapiMedusa(): Promise<any> {
    try {
      const result= await axios.post(`${
        this.strapi_url}/api/synchronise-medusa-tables`, {});
      this.logger.info("successfully configured two way sync<-->medusa");
      return result;
    } catch (error) {
      // Handle error.
      this.logger.info("An error occurred:", error);
    }
  }

  async loginToStrapi(email:string,
      password:string):Promise<AxiosResponse|boolean> {
    if (!await this.checkStrapiHealth()) {
      return false;
    }
    const authData = {
      identifier: email?? this.options_.strapi_default_user.email,
      password: password??
          this.options_.strapi_default_user.password,
    };
    try {
      const res = await axios.post(`${this.strapi_url}/api/auth/local`,
          authData);
      // console.log("login result"+res);
      if (res.data.jwt) {
        this.logger.info(`\n  ${authData.
            identifier} successfully logged in to Strapi \n`);
        return res;
      }
      return false;
    } catch (error) {
      throw new Error(`\n Error  ${authData.
          identifier} while trying to login to strapi\n`+
      (error as Error).message);
    }

    return;
  }
  async getAuthorRoleId():Promise<number> {
    const response = await this.
        strapiAdminSend("get", "roles");
    // console.log("role:", response);
    const availableRoles = (response.data.data) as role[];
    for (const role of availableRoles) {
      console.log(role);
      if (role.name == "Author") {
        return role.id;
      }
    }
    return -1;
  }

  async doesEntryExistInStrapi(type, id):Promise<AxiosResponse> {
    return await this.strapiSend("get", type, id);
  }

  async createEntryInStrapi(type, id, data):Promise<AxiosResponse> {
    return await this.strapiSend("post", type, id, data);
  }

  async updateEntryInStrapi(type, id, data) :Promise<AxiosResponse> {
    return await this.strapiSend("put", type, id, data);
  }

  async deleteEntryInStrapi(type, id) :Promise<AxiosResponse> {
    return await this.strapiSend("delete", type, id);
  }

  async strapiSend(method:Method, type:string,
      id:string, data?:any, username?:
      string, password?:string, email?:string): Promise<AxiosResponse> {
    const result = await this.loginToStrapi(email||username, password);
    if (!result) {
      this.logger.error("No user Bearer token");
      return;
    }
    if (!await this.checkStrapiHealth()) {
      return;
    }

    const resp = result as AxiosResponse;
    const endPoint = `${this.strapi_url}/api/${type}/${id}`;
    this.logger.info(endPoint);
    const basicConfig = { method: method,
      url: endPoint,
      headers: {
        Authorization: `Bearer ${resp.data.jwt}`,
      },
    };
    this.logger.info(JSON.stringify(basicConfig));
    const config = data?{
      ...basicConfig,
      data,
    }:{
      ...basicConfig,
    };
    try {
      const result = await axios({ ...config });
      if (result.status >= 200 && result.status<300) {
        this.logger.info(
            `Strapi Ok : ${method}, ${id}, ${type}, ${data}, :status:${result
                .status}`);
      }

      return result;
    } catch (error) {
      this.logger.info((error as Error).message);
      throw new Error(`Error while trying to ${method},
       ${id}, ${type}, ${data}  entry in strapi `);
    }
  }


  async strapiAdminSend(method:Method, type:string,
      id?:string, action?:string, data?:any,
  ): Promise<AxiosResponse> {
    const result = await this.loginAsStrapiAdmin();
    if (!result) {
      this.logger.error("No user Bearer token, check axios request");
      return;
    }
    if (!await this.checkStrapiHealth()) {
      return;
    }
    let headers = undefined;
    if (this.strapiAdminAuthToken) {
      headers={
        "Authorization": `Bearer ${this.strapiAdminAuthToken}`,
        "Content-type": "application/json",
      };
    }
    const path = [];
    const items = [type, action, id];
    for (const item of items) {
      if (item) {
        path.push(item);
      }
    }
    const basicConfig = { method: method,
      url: `${this.strapi_url}/admin/${path.join("/")}`,
      headers,
    };
    this.logger.info("Admin Endpoint fired:", basicConfig.url);
    const config = data?{
      ...basicConfig,
      data,
    }:{
      ...basicConfig,
    };
    try {
      const result = await axios({ ...config });
      if (result.status >= 200 && result.status<300) {
        this.logger.info(
            `Strapi Ok : ${method}, ${id}, ${
              type}, ${data}, ${action} :status:${result
                .status}`);
        this.logger.info(
            `Strapi Data : ${result.data}`);
      } else {
        this.logger.info("Admin endpoint error recieved", result);
      }

      return result;
    } catch (error) {
      this.logger.info((error as Error).message);
      throw new Error(`Error while admin ${
        method}, ${id}, ${type}, ${JSON.
          stringify(data)}, ${action} in strapi`);
    }
  }

  /* async registerMedusaUser(auth:UserType):Promise<AxiosResponse> {
    return await this.strapiAdminSend("post",
        "user", undefined, undefined, auth);
  }*/

  async registerMedusaUser(auth:MedusaUserType):Promise<AxiosResponse> {
    let response:AxiosResponse;
    try {
      response = await axios.
          post(`${this.strapi_url}/strapi-plugin-medusajs/create-medusa-user`,
              auth,
          );
    } catch (e) {
      this.logger.error("unable to register user "+JSON.stringify(e));
    }
    try {
      const roleId = await this.getAuthorRoleId();
      await this. strapiAdminSend("post", "user", undefined, undefined, {
        ...auth, role: roleId });
    } catch (e) {
      this.logger.error("unable to register user as Author"+JSON.stringify(e));
    }
    return response;
  }


  async registerAdminUserInStrapi():Promise<AxiosResponse> {
    const auth:AdminUserType = {
      ...this.options_.strapi_admin,
    };

    return await this.strapiAdminSend("post", "register-admin",
        undefined, undefined, auth);

    try {
      const response = await axios.post(`${
        this.strapi_url}/admin/register-admin`, auth);
      this.logger.info("Registered Admin " + auth.email + " with strapi");
      this.logger.info("Admin profile", response.data.user);
      this.logger.info("Admin token", response.data.token);
      // console.log(response);
      this.strapiAdminAuthToken = response.data.token;
      this.userAdminProfile = response.data.user;
      return response;
    } catch (error) {
      // Handle error.
      this.logger.info("An error occurred:", error);
      throw error;
    }
  }

  async loginAsStrapiAdmin():Promise<AxiosResponse> {
    const auth = {
      email: this.options_.strapi_admin.email,
      password: this.options_.strapi_admin.password,
    };

    try {
      let response = await axios
          .post(`${this.strapi_url}/admin/login`, auth, {
            headers: {
              "Content-Type": "application/json",
            },
          });
      response = response.data;
      this.logger.info("Logged In   Admin " + auth.email + " with strapi");
      this.logger.info("Admin profile", response.data.user);
      this.logger.info("Admin token", response.data.token);

      this.strapiAdminAuthToken = response.data.token;
      this.userAdminProfile = response.data.user;
      return response;
    } catch (error) {
      // Handle error.
      this.logger.info("An error occurred"+
       "while logging into admin:", error.message);
      throw error;
    }
  }
  async intializeServer(): Promise<AxiosResponse> {
    await this.registerOrLoginAdmin();
    if (this.strapiAdminAuthToken) {
      const user = await this.registerDefaultMedusaUser();
      if (user) {
        const response = await this.configureStrapiMedusa();
        if (response.status < 300) {
          this.logger.info("medusa-strapi-successfully-bootstrapped");
          return response;
        }
      }
    }
  }
  async registerOrLoginAdmin():Promise<void> {
    try {
      await this.registerAdminUserInStrapi();
    } catch (e) {
      this.logger.info("super admin already registered", JSON.stringify(e));
    }
    await this.loginAsStrapiAdmin();
  }

  async loginAsDefaultMedusaUser():Promise<AxiosResponse> {
    try {
      const authParams = {
        email: this.options_.strapi_default_user.email,
        password: this.options_.strapi_default_user.password,
      };
      const response = await this.loginToStrapi(authParams.email,
          authParams.password);
      if (response) {
        const axiosResp = response as AxiosResponse;
        this.strapiDefaultMedusaUserAuthToken = axiosResp.data.jwt;
        this.strapiDefaultUserProfile = axiosResp.data.user;
        this.strapiDefaultUserId = axiosResp.data.user.id;
        this.logger.info("Default Medusa User Logged In");
        return axiosResp;
      }
    } catch (error) {
      this.logger.error("Unable to register default medusa user",
          (error as Error).message);
      this.strapiDefaultMedusaUserAuthToken="";
      this.strapiDefaultUserProfile=undefined;
      this.strapiDefaultUserId="";
      throw error;
    }
  }


  async registerOrLoginDefaultMedusaUser():Promise<void> {
    try {
      await this.registerDefaultMedusaUser();
    } catch (e) {
      this.logger.info("default user already registered", JSON.stringify(e));
    }
    await this.loginAsDefaultMedusaUser();
  }
}


export default UpdateStrapiService;

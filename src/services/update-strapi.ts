import { BaseService } from "medusa-interfaces"
import axios, { Method } from "axios"
import Response from "express"
const crypto = require('crypto');

const IGNORE_THRESHOLD = 3 // seconds


export interface MedusaUserId{
  username: string;
  password: string,
  email: string,
  confirmed: boolean,
  blocked: boolean,
  provider: string,
}

class UpdateStrapiService extends BaseService {
  productService_: any;
  productVariantService_: any;
  regionService_: any;
  loggedInUser:any;
  eventBus_: any;
  algorithm: any;
  options_: any;
  protocol: any;
  strapi_URL_STRING: string;
  encryption_key: any;
  strapiAuthToken: string;
  redis_: any;
  userProfile: any;
  key: WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>;
  iv: any;
  authorised_user: any;
  default_password: any;
  constructor(
    {
      regionService,
      productService,
      redisClient,
      productVariantService,
      eventBusService,
    },
    options
  ) {
    super()

    this.productService_ = productService

    this.productVariantService_ = productVariantService

    this.regionService_ = regionService

    this.eventBus_ = eventBusService

    this.options_ = options

    this.algorithm = this.options_.encryptionAlgorithm||'aes-256-cbc'; //Using AES encryption

    this.iv = crypto.randomBytes(16);

    this.protocol = this.options_.strapi_protocol;

    this.authorised_user = this.options_.strapi_username||this.options_.strapi_default_username

    this.strapi_URL_STRING=`${this.protocol??"https"}://${this.options_.strapi_url??"localhost"}:${this.options_.strapi_port??1337}`

    this.default_password = this.options_.strapi_default_password;

    this.encryption_key = this.options_.strapi_secret||this.options_.public_certificate;

    this.strapiAuthToken = "";

    this.checkStrapiHealth().then((res) => {
      if (res) {
      //  this.loginToStrapi()
      }
    })

    //attaching the default user
    this.registerMedusaUserInStrapi(this.authorised_user,this.default_password).then((res:any)=>
    {
      const username = this.authorised_user;
      if(res.status == 200){
        console.log(username," registered with strapi ");
      }
      else
      {
        console.error("unable to register default user");
      }
      
    }).catch((e:Error)=>
    {
      console.error("unable to register default user",e.message);
    })

    this.configureStrapiMedusa().then((res:any)=>
    {
      if(res.status == 200)
      {
        console.log("medusa-strapi-successfully-bootstrapped")
      }
    }).catch((e:Error)=>
    {
      console.error("unable to bootstrap",e.message);
    });

    this.redis_ = redisClient
  }




  async addIgnore_(id, side) {
    const key = `${id}_ignore_${side}`
    return await this.redis_.set(
      key,
      1,
      "EX",
      this.options_.ignore_threshold || IGNORE_THRESHOLD
    )
  }

  async shouldIgnore_(id, side) {
    const key = `${id}_ignore_${side}`
    return await this.redis_.get(key)
  }

  async getVariantEntries_(variants) {
    // eslint-disable-next-line no-useless-catch
    try {
      const allVariants = variants.map(async (variant) => {
        // update product variant in strapi
        const result = await this.updateProductVariantInStrapi(variant)
        return result.productVariant
      })
      return Promise.all(allVariants)
    } catch (error) {
      throw error
    }
  }

  async createImageAssets(product) {
    const assets = await Promise.all(
      product.images
        ?.filter((image) => image.url !== product.thumbnail)
        .map(async (image, i) => {
          const result = await this.createEntryInStrapi("images", product.id, {
            image_id: image.id,
            url: image.url,
            metadata: image.metadata || {},
          })
          return result?.data?.image??undefined
        })
    )
    return assets || []
  }

  getCustomField(field, type) {
    const customOptions = this.options_[`custom_${type}_fields`]

    if (customOptions) {
      return customOptions[field] || field
    } else {
      return field
    }
  }

  async createProductInStrapi(productId) {
    const hasType = await this.getType("products")
      .then((resolved) => resolved)
      .catch((err) => {
        console.error(err)
        return false
      })
    if (!hasType) {
      return Promise.resolve()
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
      })

      if (product) {
        return await this.createEntryInStrapi("products", productId, product)
      }
    } catch (error) {
      throw error
    }
  }

  async createProductVariantInStrapi(variantId) {
    const hasType = await this.getType("product-variants")
      .then(() => true)
      .catch((e) => false)

    if (!hasType) {
      return Promise.resolve()
    }

    // eslint-disable-next-line no-useless-catch
    try {
      const variant = await this.productVariantService_.retrieve(variantId, {
        relations: ["prices", "options", "product"],
      })

      // console.log(variant)
      if (variant) {
        return await this.createEntryInStrapi(
          "product-variants",
          variantId,
          variant
        )
      }
    } catch (error) {
      throw error
    }
  }

  async createRegionInStrapi(regionId) {
    const hasType = await this.getType("regions")
      .then(() => true)
      .catch(() => false)
    if (!hasType) {
      console.log('Type "Regions" doesnt exist in Strapi')
      return Promise.resolve()
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
      })

      // console.log(region)

      return await this.createEntryInStrapi("regions", regionId, region)
    } catch (error) {
      throw error
    }
  }

  async updateRegionInStrapi(data) {
    const hasType = await this.getType("regions")
      .then((res) => {
        // console.log(res.data)
        return true
      })
      .catch((error) => {
        // console.log(error.response.status)
        return false
      })
    if (!hasType) {
      return Promise.resolve()
    }

    const updateFields = [
      "name",
      "currency_code",
      "countries",
      "payment_providers",
      "fulfillment_providers",
    ]

    // check if update contains any fields in Strapi to minimize runs
    const found = data.fields.find((f) => updateFields.includes(f))
    if (!found) {
      return
    }

    // eslint-disable-next-line no-useless-catch
    try {
      const ignore = await this.shouldIgnore_(data.id, "strapi")
      if (ignore) {
        return
      }

      const region = await this.regionService_.retrieve(data.id, {
        relations: [
          "countries",
          "payment_providers",
          "fulfillment_providers",
          "currency",
        ],
        select: ["id", "name", "tax_rate", "tax_code", "metadata"],
      })
      // console.log(region)

      if (region) {
        // Update entry in Strapi
        const response = await this.updateEntryInStrapi(
          "regions",
          region.id,
          region
        )
        console.log("Region Strapi Id - ", response)
      }

      return region
    } catch (error) {
      throw error
    }
  }

  async updateProductInStrapi(data) {
    const hasType = await this.getType("products")
      .then((res) => {
        // console.log(res.data)
        return true
      })
      .catch((error) => {
        // console.log(error.response.status)
        return false
      })
    if (!hasType) {
      return Promise.resolve()
    }

    // console.log(data)
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
    ]

    // check if update contains any fields in Strapi to minimize runs
    const found = data.fields.find((f) => updateFields.includes(f))
    if (!found) {
      return Promise.resolve()
    }

    // eslint-disable-next-line no-useless-catch
    try {
      const ignore = await this.shouldIgnore_(data.id, "strapi")
      if (ignore) {
        console.log(
          "Strapi has just updated this product which triggered this function. IGNORING... "
        )
        return Promise.resolve()
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
      })

      if (product) {
        await this.updateEntryInStrapi("products", product.id, product)
      }

      return product
    } catch (error) {
      throw error
    }
  }

  async updateProductVariantInStrapi(data) {
    const hasType = await this.getType("product-variants")
      .then((res) => {
        // console.log(res.data)
        return true
      })
      .catch((error) => {
        // console.log(error.response.status)
        return false
      })
    if (!hasType) {
      return Promise.resolve()
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
    ]

    // Update came directly from product variant service so only act on a couple
    // of fields. When the update comes from the product we want to ensure
    // references are set up correctly so we run through everything.
    if (data.fields) {
      const found = data.fields.find((f) => updateFields.includes(f))
      if (!found) {
        return Promise.resolve()
      }
    }

    try {
      const ignore = await this.shouldIgnore_(data.id, "strapi")
      if (ignore) {
        return Promise.resolve()
      }

      const variant = await this.productVariantService_.retrieve(data.id, {
        relations: ["prices", "options"],
      })
      console.log(variant)

      if (variant) {
        // Update entry in Strapi
        const response = await this.updateEntryInStrapi(
          "product-variants",
          variant.id,
          variant
        )
        console.log("Variant Strapi Id - ", response)
      }

      return variant
    } catch (error) {
      console.log("Failed to update product variant", data.id)
      throw error
    }
  }

  async createMedusaUser(data){


  }

  async deleteProductInStrapi(data) {
    const hasType = await this.getType("products")
      .then(() => true)
      .catch((err) => {
        // console.log(err)
        return false
      })
    if (!hasType) {
      return Promise.resolve()
    }

    const ignore = await this.shouldIgnore_(data.id, "strapi")
    if (ignore) {
      return Promise.resolve()
    }

    return await this.deleteEntryInStrapi("products", data.id)
  }

  async deleteProductVariantInStrapi(data) {
    const hasType = await this.getType("product-variants")
      .then(() => true)
      .catch((err) => {
        // console.log(err)
        return false
      })
    if (!hasType) {
      return Promise.resolve()
    }

    const ignore = await this.shouldIgnore_(data.id, "strapi")
    if (ignore) {
      return Promise.resolve()
    }

    return await this.deleteEntryInStrapi("product-variants", data.id)
  }

  // Blocker - Delete Region API
  async deleteRegionInStrapi(data) {}

  async getType(type) {
    if (!this.strapiAuthToken) {
      await this.loginToStrapi()
    }
    const config = {
      url: `${this.strapi_URL_STRING}/api/${type}`,
      method: "get",
      headers: {
        Authorization: `Bearer ${this.strapiAuthToken}`,
      },
    }

    const result = await axios.get(config.url,{
      headers:config.headers
    })
    return result;
  }

  async checkStrapiHealth() {
    const config = {
      url: `${this.strapi_URL_STRING}/_health`,
    }
    console.log("Checking strapi Health")
    return axios.head(config.url)
      .then((res) => {
        if (res.status === 204) {
          console.log("\n Strapi Health Check OK \n")
        }
        return true
      })
      .catch((error) => {
        if (error.code === "ECONNREFUSED") {
          console.error(
            "\nCould not connect to strapi. Please make sure strapi is running.\n"
          )
        }
        return false
      })
  }

 encrypt(text:string) {
  return text;
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.key), this.iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: this.iv.toString('hex'), encryptedData: encrypted.toString('hex') };
 }
 
 // Decrypting text
 decrypt(text) {
  return text;
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.key), this.iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
 }


 
  async registerMedusaUserInStrapi(username:string,password:string):Promise<any>
  {

  
   try{
   const  response = await axios
  .post(`${ this.strapi_URL_STRING|| "http://localhost:1337 "}/api/auth/local/register`, {
    username: username,
    email: username,
    password: this.encrypt(password)
  })
 
  console.log('Registered '+username+' with strapi');
    console.log('User profile', response.data.user);
    console.log('User token', response.data.jwt);
    this.strapiAuthToken = response.data.jwt
    this.userProfile = response.data.user;
    return response
}catch (error) {
    // Handle error.
    console.log('An error occurred:', (error as Error).message);
   
  } 
  return
  };
 
  


  async configureStrapiMedusa(): Promise<any>
  {
    try{
    const result=  await axios.post(`${ this.strapi_URL_STRING|| "http://localhost:1337 "}/synchronise-medusa-tables`, {})
    console.log("successfully configured two way sync<-->medusa")  
    return result;
      
  }catch(error)  {
      // Handle error.
      console.log('An error occurred:', error);
   
  }
  }

  async loginToStrapi(username?:string,password?:string) {
    const iv = crypto.randomBytes(16);
    const authData = {
      identifier: username??this.options_.strapi_username,
      password: password?this.encrypt(password):this.options_.strapi_password,
    }
    const config = {
      method: "post",
      url: `${this.strapi_URL_STRING}/api/auth/local`,
      data: authData,
    }
    try{
    const res = await axios.post(`${this.strapi_URL_STRING}/api/auth/local`,authData)
     if (res.data.jwt) {
          this.strapiAuthToken = res.data.jwt
          this.userProfile = res.data.user;
          console.log(`\n  ${username} successfully logged in to Strapi \n`)
          return true
        }
        return false
      }
      catch(error){
        
          throw new Error(`\n Error  ${username} while trying to login to strapi\n`+error)
        }
      
    return 
  }

  async doesEntryExistInStrapi(type, id) {
    return await this.sendStrapi("get",type,id)
  }
  sendStrapi(arg0: string, type: any, id: any) {
    throw new Error("Method not implemented.");
  }

  async createEntryInStrapi(type, id, data) {
    return await this.strapiSend("post",type,id,data)
  }

  async updateEntryInStrapi(type, id, data) {
    return await this.strapiSend("put",type,id,data)
  }
  
  async deleteEntryInStrapi(type, id) {
    return await this.strapiSend("delete",type,id)
  }

  async strapiSend(method:Method,type:string,id:string,data?:any)
  {
    if (!this.strapiAuthToken) {
      await this.loginToStrapi()
    }
    const basicConfig = { method: method,
    url: `${this.strapi_URL_STRING}/api/${type}/${id}`,
    headers: {
      Authorization: `Bearer ${this.strapiAuthToken}`,
    },
  }
    const config = data?{
      ...basicConfig,
      data,
    }:{
      ...basicConfig,
    }
  try{
    const result = await axios({...config})
    if(result.status >= 200 && result.status<300)
    {
      console.info(`Strapi Ok : ${method}, ${id}, ${type}, ${data}, :status:${result.status}`)
    }
  
    return result;
  }
      catch(error){
          console.log((error as Error).message)
          throw new Error(`Error while trying to ${method}  entry in strapi `)
        }
      }
    
  }




export default UpdateStrapiService

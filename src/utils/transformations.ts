import { Product } from "@medusajs/medusa";
import * as _ from "lodash";
export async function transformMedusaToStrapiProduct(
    product: Product
): Promise<Product> {
    const productToSend = _.cloneDeep(product);
    productToSend["product-type"] = _.cloneDeep(productToSend.type);
    delete productToSend.type;
    productToSend["product-tags"] = _.cloneDeep(productToSend.tags);
    delete productToSend.tags;
    productToSend["product-options"] = _.cloneDeep(productToSend.options);
    delete productToSend.options;
    productToSend["product-variants"] = _.cloneDeep(productToSend.variants);
    delete productToSend.variants;

    if (productToSend.collection) {
        productToSend["product-collections"] = _.cloneDeep(
            productToSend.collection
        );
    }
    if (productToSend.profile) {
        productToSend["shipping-profiles"] = _.cloneDeep(productToSend.profile);
    }
    delete productToSend.collection;
    return productToSend;
}

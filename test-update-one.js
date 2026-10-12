'use strict';

require('dotenv').config();

const {
    getSyntechUpdateProducts
} = require('./syntech/products');

const { mapSyntechProduct } = require('./syntech/mapper');

const { ShopifyClient } = require('./shopify/client');

const {
    findProductBySKU,
    updateProduct
} = require('./shopify/products');

const {
    getLocations,
    enableInventoryTracking,
    setInventory
} = require('./shopify/inventory');

async function main() {
    const testSku = 'AHHSBK-10';

    console.log('');
    console.log('======================================');
    console.log(' SYNTECH UPDATE TEST');
    console.log('======================================');
    console.log('');
    console.log('Test SKU:', testSku);
    console.log('');

    console.log('Downloading Syntech UPDATE feed...');

    const result = await getSyntechUpdateProducts();

    console.log('');
    console.log('Products in UPDATE feed:', result.products.length);
    console.log('');

    const rawProduct = result.products.find(
        product =>
            String(product.sku || '').trim().toUpperCase() ===
            testSku.toUpperCase()
    );

    if (!rawProduct) {
        throw new Error(`SKU ${testSku} was not found in the UPDATE feed.`);
    }

    const product = mapSyntechProduct(rawProduct);

    console.log('Syntech product found.');
    console.log('');
    console.log('SKU:', product.sku);
    console.log('Price:', `R ${product.price}`);
    console.log('Stock:', product.stock);
    console.log('');

    const shopify = new ShopifyClient();

    console.log('Searching Shopify for SKU...');

    const existing = await findProductBySKU(shopify, product.sku);

    if (!existing) {
        throw new Error(
            `SKU ${product.sku} was not found in Shopify.`
        );
    }

    console.log('');
    console.log('Shopify product found.');
    console.log('Product ID:', existing.product.id);
    console.log('Variant ID:', existing.variant.id);
    console.log('Current Shopify price:', existing.variant.price);
    console.log('');

    console.log('Updating Shopify price...');

    await shopify.request(
        'PUT',
        `/variants/${existing.variant.id}.json`,
        {
            data: {
                variant: {
                    id: existing.variant.id,
                    price: product.price
                }
            }
        }
    );

    console.log('Price updated successfully.');
    console.log(`New price: R ${product.price}`);
    console.log('');

    const locations = await getLocations(shopify);

    if (!locations.length) {
        throw new Error('No Shopify locations found.');
    }

    const location = locations[0];

    console.log('Shopify location:', location.name);
    console.log('');

    let inventoryItemId = existing.variant.inventory_item_id;

    if (!inventoryItemId) {
        const productData = await shopify.request(
            'GET',
            `/products/${existing.product.id}.json`
        );

        const variant = productData.product.variants.find(
            item => item.id === existing.variant.id
        );

        if (variant) {
            inventoryItemId = variant.inventory_item_id;
        }
    }

    if (!inventoryItemId) {
        throw new Error('Could not find Shopify inventory item.');
    }

    console.log('Updating Shopify stock...');
    console.log('New stock:', product.stock);
    console.log('');

    await enableInventoryTracking(
        shopify,
        inventoryItemId
    );

    await setInventory(
        shopify,
        inventoryItemId,
        location.id,
        product.stock
    );

    console.log('Stock updated successfully.');
    console.log('');

    console.log('======================================');
    console.log(' UPDATE TEST SUCCESSFUL');
    console.log('======================================');
    console.log('');
    console.log('SKU:', product.sku);
    console.log('Shopify price:', `R ${product.price}`);
    console.log('Shopify stock:', product.stock);
    console.log('');
}

main().catch(error => {
    console.error('');
    console.error('======================================');
    console.error(' UPDATE TEST FAILED');
    console.error('======================================');
    console.error('');

    if (error.response) {
        console.error('HTTP:', error.response.status);
        console.error(
            JSON.stringify(error.response.data, null, 2)
        );
    } else {
        console.error(error.message);
    }

    process.exit(1);
});
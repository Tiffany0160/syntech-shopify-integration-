'use strict';

require('dotenv').config();

const {
    ShopifyClient
} = require('./shopify/client');

const {
    findProductBySKU
} = require('./shopify/products');

const {
    getLocations,
    enableInventoryTracking,
    setInventory
} = require('./shopify/inventory');


async function main() {

    console.log('');
    console.log(
        '======================================'
    );

    console.log(
        ' INTEGRATION STOCK TEST'
    );

    console.log(
        '======================================'
    );

    console.log('');


    const sku =
        'SEL-0944';

    const testStock =
        30;


    const shopify =
        new ShopifyClient();


    console.log(
        'SKU:',
        sku
    );

    console.log(
        'Test stock:',
        testStock
    );

    console.log('');


    /*
     * Find existing Shopify product.
     */
    console.log(
        'Finding Shopify product...'
    );


    const existing =
        await findProductBySKU(
            shopify,
            sku
        );


    if (!existing) {

        throw new Error(
            `Shopify product with SKU ${sku} was not found.`
        );
    }


    console.log(
        'Product found:',
        existing.product.title
    );


    /*
     * Get fresh variant data.
     */
    const data =
        await shopify.request(
            'GET',
            `/products/${existing.product.id}.json`
        );


    const variant =
        data.product.variants.find(
            item =>
                item.id ===
                existing.variant.id
        );


    if (!variant) {

        throw new Error(
            'Variant could not be found.'
        );
    }


    const inventoryItemId =
        variant.inventory_item_id;


    console.log(
        'Inventory Item ID:',
        inventoryItemId
    );


    /*
     * Get location.
     */
    const locations =
        await getLocations(
            shopify
        );


    if (!locations.length) {

        throw new Error(
            'No Shopify locations found.'
        );
    }


    const location =
        locations[0];


    console.log(
        'Location:',
        location.name
    );

    console.log(
        'Location ID:',
        location.id
    );

    console.log('');


    /*
     * Enable tracking.
     */
    await enableInventoryTracking(
        shopify,
        inventoryItemId
    );


    /*
     * Set stock.
     */
    await setInventory(
        shopify,
        inventoryItemId,
        location.id,
        testStock
    );


    console.log('');
    console.log(
        '======================================'
    );

    console.log(
        ' INTEGRATION STOCK TEST SUCCESSFUL'
    );

    console.log(
        '======================================'
    );

    console.log('');

}


main()
    .catch(error => {

        console.log('');
        console.log(
            '======================================'
        );

        console.log(
            ' INTEGRATION STOCK TEST FAILED'
        );

        console.log(
            '======================================'
        );

        console.log('');

        console.error(
            error.message
        );

        console.log('');
    });
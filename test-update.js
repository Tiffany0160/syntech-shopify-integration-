'use strict';

require('dotenv').config();

const {
    ShopifyClient
} = require('./shopify/client');

const {
    findProductBySKU,
    updateProduct
} = require('./shopify/products');

const {
    getLocations,
    enableInventoryTracking,
    setInventory
} = require('./shopify/inventory');

const {
    addMissingImages
} = require('./shopify/media');

const {
    mapSyntechProduct
} = require('./syntech/mapper');


async function main() {

    console.log('');

    console.log('======================================');
    console.log(' SHOPIFY UPDATE TEST');
    console.log('======================================');

    console.log('');


    /*
     * EXISTING SHOPIFY PRODUCT
     *
     * This SKU already exists in the store.
     *
     * This test will change:
     *
     * Title  -> Test Wireless Keyboard UPDATED
     * Price  -> R750
     * Stock  -> 30
     *
     * The SKU remains SEL-0944.
     */
    const testProduct = {

        sku:
            'SEL-0944',

        name:
            'Test Wireless Keyboard UPDATED',

        price:
            550,

        rrp_incl:
            750,

        cptstock:
            10,

        jhbstock:
            15,

        dbnstock:
            5,

        description:
            'Updated test wireless keyboard for the Syntech Shopify integration.',

        shortdesc:
            'Updated test wireless keyboard.',

        /*
         * This is only a test image URL.
         *
         * example.com is not a real product image,
         * so Shopify may reject it.
         */
        featured_image:
            'https://example.com/test-keyboard.jpg',

        additional_images:
            '',

        categories:
            'Computer Peripherals, Keyboards',

        attributes: {

            brand:
                'Test Brand',

            colour:
                'Black',

            warranty:
                '24 Months'
        }
    };


    /*
     * Convert the Syntech-style product
     * into our standard product format.
     */
    const product =
        mapSyntechProduct(
            testProduct
        );


    console.log(
        'SKU:',
        product.sku
    );

    console.log(
        'New title:',
        product.title
    );

    console.log(
        'Supplier cost:',
        `R ${product.supplierPrice}`
    );

    console.log(
        'New RRP:',
        `R ${product.price}`
    );

    console.log(
        'New stock:',
        product.stock
    );

    console.log('');


    /*
     * Connect to Shopify.
     */
    const shopify =
        new ShopifyClient();


    console.log(
        'Searching Shopify for SKU...'
    );


    /*
     * Find the existing product.
     */
    const existing =
        await findProductBySKU(
            shopify,
            product.sku
        );


    if (!existing) {

        throw new Error(
            `SKU ${product.sku} was not found in Shopify.`
        );
    }


    /*
     * Show the existing product information
     * before updating it.
     */
    console.log('');

    console.log(
        'EXISTING PRODUCT FOUND'
    );

    console.log(
        'Product ID:',
        existing.product.id
    );

    console.log(
        'Current title:',
        existing.product.title
    );

    console.log(
        'Current price:',
        existing.variant.price
    );

    console.log(
        'Current SKU:',
        existing.variant.sku
    );

    console.log('');


    /*
     * Update product information.
     */
    console.log(
        'Updating product...'
    );


    const result =
        await updateProduct(
            shopify,
            existing,
            product
        );


    console.log(
        'Product updated successfully.'
    );

    console.log('');


    /*
     * Get Shopify locations.
     */
    console.log(
        'Getting Shopify locations...'
    );


    const locations =
        await getLocations(
            shopify
        );


    if (!locations.length) {

        throw new Error(
            'No Shopify locations found.'
        );
    }


    /*
     * Use the first active Shopify location.
     */
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
     * Get the updated product again.
     *
     * This gives us the latest variant
     * and inventory item information.
     */
    console.log(
        'Refreshing product information...'
    );


    const refreshed =
        await shopify.request(
            'GET',
            `/products/${result.product.id}.json`
        );


    if (
        !refreshed ||
        !refreshed.product
    ) {

        throw new Error(
            'Shopify did not return the updated product.'
        );
    }


    /*
     * Find the variant that was updated.
     */
    const variant =
        refreshed
            .product
            .variants
            .find(
                item =>
                    item.id ===
                    result.variantId
            );


    if (!variant) {

        throw new Error(
            'Updated variant could not be found.'
        );
    }


    console.log(
        'Variant ID:',
        variant.id
    );

    console.log(
        'Inventory item ID:',
        variant.inventory_item_id
    );

    console.log('');


    /*
     * ENABLE INVENTORY TRACKING
     *
     * Shopify will not allow inventory
     * quantities to be changed unless
     * inventory tracking is enabled.
     */
    if (
        variant.inventory_item_id
    ) {

        await enableInventoryTracking(
            shopify,
            variant.id
        );


        console.log('');

        console.log(
            `Setting stock to ${product.stock}...`
        );


        /*
         * Set the stock quantity.
         */
        await setInventory(
            shopify,
            variant.inventory_item_id,
            location.id,
            product.stock
        );


        console.log(
            'Stock updated successfully.'
        );

    } else {

        console.log(
            'No inventory item ID found.'
        );
    }


    console.log('');


    /*
     * Check product images.
     */
    console.log(
        'Checking images...'
    );


    if (
        product.images &&
        product.images.length
    ) {

        const imageCount =
            await addMissingImages(
                shopify,
                result.product.id,
                product.images
            );


        console.log(
            `Images added: ${imageCount}`
        );

    } else {

        console.log(
            'No images to add.'
        );
    }


    console.log('');


    /*
     * Final result.
     */
    console.log(
        '======================================'
    );

    console.log(
        ' UPDATE TEST COMPLETE'
    );

    console.log(
        '======================================'
    );

    console.log('');

    console.log(
        'SKU:',
        product.sku
    );

    console.log(
        'New title:',
        product.title
    );

    console.log(
        'New price:',
        `R ${product.price}`
    );

    console.log(
        'New stock:',
        product.stock
    );

    console.log('');

    console.log(
        'Shopify product update completed successfully.'
    );

    console.log('');

}


/*
 * Run the test.
 */
main().catch(error => {

    console.log('');

    console.log(
        '======================================'
    );

    console.log(
        ' UPDATE TEST FAILED'
    );

    console.log(
        '======================================'
    );

    console.log('');

    if (error.response) {

        console.log(
            'HTTP Status:',
            error.response.status
        );

        console.log(
            JSON.stringify(
                error.response.data,
                null,
                2
            )
        );

    } else {

        console.log(
            'Error:',
            error.message
        );
    }

    console.log('');
});


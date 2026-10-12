'use strict';

require('dotenv').config();

const express =
    require('express');

const {
    ShopifyClient
} = require('./shopify/client');

const {
    createProduct,
    findProductBySKU
} = require('./shopify/products');

const {
    getLocations,
    enableInventoryTracking,
    getAvailableQuantity,
    setInventory
} = require('./shopify/inventory');

const {
    addProductImage
} = require('./shopify/media');

const {
    mapSyntechProduct
} = require('./syntech/mapper');

const {
    runFullSync,
    runUpdateSync
} = require('./sync');


const app =
    express();

app.use(
    express.json()
);


/* ======================================
   HELPERS
====================================== */

function printHeader(title) {
    console.log('');

    console.log(
        '======================================'
    );

    console.log(
        ` ${title}`
    );

    console.log(
        '======================================'
    );

    console.log('');
}


function showError(error) {
    console.error('');

    console.error(
        'ERROR'
    );

    console.error('');

    if (error.response) {

        console.error(
            'HTTP Status:',
            error.response.status
        );

        console.error(
            'Response:',
            JSON.stringify(
                error.response.data,
                null,
                2
            )
        );

    } else {

        console.error(
            error.message
        );
    }

    console.error('');
}


/* ======================================
   TEST SHOPIFY
====================================== */

async function testShopify() {

    const shopify =
        new ShopifyClient();

    const data =
        await shopify.request(
            'GET',
            '/shop.json'
        );

    printHeader(
        'SHOPIFY CONNECTION SUCCESSFUL'
    );

    console.log(
        'Shop name:',
        data.shop.name
    );

    console.log(
        'Shop domain:',
        data.shop.domain
    );

    console.log('');
}


/* ======================================
   TEST PRODUCT
====================================== */

async function testProduct() {

    printHeader(
        'TEST PRODUCT'
    );

    const syntechProduct = {

        sku:
            'TEST-SYNTECH-001',

        name:
            'Test Wireless Keyboard',

        price:
            500,

        rrp_incl:
            699,

        cptstock:
            5,

        jhbstock:
            12,

        dbnstock:
            3,

        description:
            'Test wireless keyboard for the Syntech Shopify integration.',

        shortdesc:
            'Test wireless keyboard.',

        featured_image:
            'https://example.com/test-keyboard.jpg',

        additional_images:
            [],

        categories:
            'Computer Peripherals, Keyboards',

        attributes: {

            brand:
                'Test Brand',

            colour:
                'Black',

            warranty:
                '12 Months'
        }
    };


    const product =
        mapSyntechProduct(
            syntechProduct
        );


    console.log(
        'Product:',
        product.title
    );

    console.log(
        'SKU:',
        product.sku
    );

    console.log(
        'Supplier cost: R',
        product.supplierPrice
    );

    console.log(
        'RRP: R',
        product.rrp
    );

    console.log(
        'Shopify price: R',
        product.price
    );

    console.log(
        'Stock:',
        product.stock
    );

    console.log(
        'Images:',
        product.images.length
    );

    console.log('');


    const shopify =
        new ShopifyClient();


    console.log(
        'Checking Shopify for SKU...'
    );


    const existing =
        await findProductBySKU(
            shopify,
            product.sku
        );


    if (existing) {

        console.log('');

        console.log(
            'TEST PRODUCT ALREADY EXISTS'
        );

        console.log(
            'Shopify Product ID:',
            existing.product.id
        );

        console.log(
            'Inventory Item ID:',
            existing.variant.inventory_item_id
        );

        console.log(
            'SKU:',
            existing.variant.sku
        );

        console.log(
            'Title:',
            existing.product.title
        );

        console.log(
            'Price:',
            existing.variant.price
        );

        console.log('');

        return;
    }


    console.log(
        'Creating product in Shopify...'
    );


    const created =
        await createProduct(
            shopify,
            product
        );


    console.log('');

    console.log(
        'PRODUCT CREATED'
    );

    console.log(
        'Shopify Product ID:',
        created.id
    );

    console.log(
        'Title:',
        created.title
    );

    console.log(
        'Status:',
        created.status
    );

    console.log(
        'Price:',
        created.variants[0].price
    );

    console.log(
        'SKU:',
        created.variants[0].sku
    );


    console.log('');

    console.log(
        'Getting Shopify locations...'
    );


    const locations =
        await getLocations(
            shopify
        );


    if (!locations.length) {

        throw new Error(
            'No Shopify locations were found.'
        );
    }


    const location =
        locations[0];


    console.log(
        'Using location:',
        location.name
    );

    console.log(
        'Location ID:',
        location.id
    );


    const variant =
        created.variants[0];


    if (
        variant.inventory_item_id
    ) {

        console.log('');

        console.log(
            `Setting stock to ${product.stock}...`
        );


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
            'No inventory item ID returned.'
        );
    }


    console.log('');


    for (
        let i = 0;
        i < product.images.length;
        i++
    ) {

        const imageUrl =
            product.images[i];

        console.log(
            `Adding image ${i + 1}/${product.images.length}...`
        );


        await addProductImage(
            shopify,
            created.id,
            imageUrl
        );
    }


    console.log('');

    console.log(
        '======================================'
    );

    console.log(
        ' TEST PRODUCT COMPLETE'
    );

    console.log(
        '======================================'
    );

    console.log('');

    console.log(
        'Product:',
        created.title
    );

    console.log(
        'SKU:',
        product.sku
    );

    console.log(
        'Price: R',
        product.price
    );

    console.log(
        'Stock:',
        product.stock
    );

    console.log(
        'Images attempted:',
        product.images.length
    );

    console.log('');
}


/* ======================================
   TEST INVENTORY
====================================== */

async function testInventory() {

    printHeader(
        'TEST INVENTORY'
    );


    const shopify =
        new ShopifyClient();


    const sku =
        'TEST-SYNTECH-001';


    const targetStock =
        20;


    console.log(
        'Test SKU:',
        sku
    );

    console.log(
        'Target stock:',
        targetStock
    );

    console.log('');


    console.log(
        'Finding product in Shopify...'
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


    console.log('');

    console.log(
        'Product found.'
    );

    console.log(
        'Product ID:',
        existing.product.id
    );

    console.log(
        'Variant ID:',
        existing.variant.id
    );

    console.log(
        'Inventory Item ID:',
        existing.variant.inventory_item_id
    );


    const inventoryItemId =
        existing.variant.inventory_item_id;


    if (!inventoryItemId) {

        throw new Error(
            'The Shopify variant does not have an inventory item ID.'
        );
    }


    console.log('');

    console.log(
        'Getting Shopify locations...'
    );


    const locations =
        await getLocations(
            shopify
        );


    if (!locations.length) {

        throw new Error(
            'No Shopify locations were found.'
        );
    }


    console.log('');

    console.log(
        'Available Shopify locations:'
    );


    for (
        const location of locations
    ) {

        console.log(
            `- ${location.name} | ID: ${location.id}`
        );
    }


    const location =
        locations[0];


    console.log('');

    console.log(
        'Using location:',
        location.name
    );

    console.log(
        'Location ID:',
        location.id
    );


    console.log('');

    console.log(
        'Enabling inventory tracking...'
    );


    await enableInventoryTracking(
        shopify,
        inventoryItemId
    );


    console.log('');

    console.log(
        'Reading current inventory...'
    );


    const currentStock =
        await getAvailableQuantity(
            shopify,
            inventoryItemId,
            location.id
        );


    console.log('');

    console.log(
        'Current Shopify stock:',
        currentStock
    );


    console.log('');

    console.log(
        `Setting Shopify stock to ${targetStock}...`
    );


    await setInventory(
        shopify,
        inventoryItemId,
        location.id,
        targetStock
    );


    console.log('');

    console.log(
        'Reading inventory after update...'
    );


    const verifiedStock =
        await getAvailableQuantity(
            shopify,
            inventoryItemId,
            location.id
        );


    console.log('');

    console.log(
        'Verified Shopify stock:',
        verifiedStock
    );


    console.log('');


    if (
        Number(verifiedStock) ===
        Number(targetStock)
    ) {

        console.log(
            '======================================'
        );

        console.log(
            ' INVENTORY TEST SUCCESSFUL'
        );

        console.log(
            '======================================'
        );

        console.log('');

        console.log(
            `Shopify inventory is correctly set to ${targetStock}.`
        );

    } else {

        console.log(
            '======================================'
        );

        console.log(
            ' INVENTORY TEST FAILED'
        );

        console.log(
            '======================================'
        );

        console.log('');

        console.log(
            'Expected:',
            targetStock
        );

        console.log(
            'Actual:',
            verifiedStock
        );
    }


    console.log('');
}


/* ======================================
   HOME ROUTE
====================================== */

app.get(
    '/',
    (req, res) => {

        res.json({

            status:
                'Syntech Shopify Integration is running',

            commands: [

                'test-shopify',

                'test-product',

                'test-inventory',

                'sync-full',

                'sync-update'
            ]
        });
    }
);


/* ======================================
   SERVER
====================================== */

const PORT =
    process.env.PORT || 4000;


app.listen(
    PORT,
    () => {

        console.log(
            `Server running on http://localhost:${PORT}`
        );
    }
);


/* ======================================
   COMMAND LINE MODE
====================================== */

const mode =
    process.argv[2];


async function main() {

    try {

        if (
            mode ===
            'test-shopify'
        ) {

            await testShopify();


        } else if (
            mode ===
            'test-product'
        ) {

            await testProduct();


        } else if (
            mode ===
            'test-inventory'
        ) {

            await testInventory();


        } else if (
            mode ===
            'sync-full'
        ) {

            printHeader(
                'FULL SYNTECH SYNCHRONISATION'
            );

            await runFullSync();


        } else if (
            mode ===
            'sync-update'
        ) {

            printHeader(
                'SYNTECH UPDATE SYNCHRONISATION'
            );

            await runUpdateSync();


        } else {

            console.log('');

            console.log(
                'Available commands:'
            );

            console.log('');

            console.log(
                '1. Test Shopify connection:'
            );

            console.log(
                'node .\\src\\server.js test-shopify'
            );

            console.log('');

            console.log(
                '2. Test Shopify product:'
            );

            console.log(
                'node .\\src\\server.js test-product'
            );

            console.log('');

            console.log(
                '3. Test Shopify inventory:'
            );

            console.log(
                'node .\\src\\server.js test-inventory'
            );

            console.log('');

            console.log(
                '4. Run FULL Syntech sync:'
            );

            console.log(
                'node .\\src\\server.js sync-full'
            );

            console.log('');

            console.log(
                '5. Run UPDATE Syntech sync:'
            );

            console.log(
                'node .\\src\\server.js sync-update'
            );

            console.log('');
        }

    } catch (error) {

        showError(error);
    }
}


main();
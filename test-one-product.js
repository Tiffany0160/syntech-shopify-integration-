
'use strict';

require('dotenv').config();

const fs = require('fs');

const {
    XMLParser
} = require('fast-xml-parser');

const {
    mapSyntechProduct
} = require('./syntech/mapper');

const {
    ShopifyClient
} = require('./shopify/client');

const {
    buildShopifySKUMap
} = require('./shopify/products');


const TEST_SKU = 'BHR5274GL';


async function main() {

    console.log('');
    console.log('======================================');
    console.log(' SYNTECH → SHOPIFY SINGLE PRODUCT TEST');
    console.log('======================================');
    console.log('');

    /*
    ============================================
    LOAD SYNTECH CACHE
    ============================================
    */

    console.log('Loading Syntech cached feed...');

    const xml = fs.readFileSync(
        './data/syntech-full-cache.xml',
        'utf8'
    );

    const parser = new XMLParser({
        ignoreAttributes: false,
        trimValues: true
    });

    const data = parser.parse(xml);

    const products =
        data.syntechstock.stock.product;

    if (!Array.isArray(products)) {

        throw new Error(
            'Could not find Syntech products in cached XML.'
        );
    }

    console.log(
        `Syntech products loaded: ${products.length}`
    );

    console.log('');

    /*
    ============================================
    FIND TEST PRODUCT
    ============================================
    */

    const rawProduct =
        products.find(
            product =>
                String(product.sku).trim() === TEST_SKU
        );

    if (!rawProduct) {

        throw new Error(
            `Syntech product not found: ${TEST_SKU}`
        );
    }

    /*
    ============================================
    MAP PRODUCT
    ============================================
    */

    const product =
        mapSyntechProduct(rawProduct);

    console.log('Syntech product found.');
    console.log('');

    console.log(
        'SKU:',
        product.sku
    );

    console.log(
        'Name:',
        product.title
    );

    console.log(
        'RRP:',
        `R ${product.price}`
    );

    console.log(
        'Stock:',
        product.stock
    );

    console.log('');

    /*
    ============================================
    RAW STOCK
    ============================================
    */

    console.log('Raw branch stock:');

    console.log(
        'Cape Town:',
        rawProduct.cptstock
    );

    console.log(
        'Johannesburg:',
        rawProduct.jhbstock
    );

    console.log(
        'Durban:',
        rawProduct.dbnstock
    );

    console.log('');

    /*
    ============================================
    VERIFY STOCK
    ============================================
    */

    const expectedStock =
        Number(rawProduct.cptstock || 0) +
        Number(rawProduct.jhbstock || 0) +
        Number(rawProduct.dbnstock || 0);

    console.log(
        'Expected total stock:',
        expectedStock
    );

    console.log(
        'Mapped total stock:',
        product.stock
    );

    console.log('');

    if (product.stock !== expectedStock) {

        throw new Error(
            `Stock calculation is incorrect. Expected ${expectedStock}, got ${product.stock}`
        );
    }

    console.log(
        '✓ Stock calculation is correct.'
    );

    console.log('');

    /*
    ============================================
    CONNECT TO SHOPIFY
    ============================================
    */

    console.log(
        'Loading Shopify products...'
    );

    const shopify =
        new ShopifyClient();

    const skuMap =
        await buildShopifySKUMap(
            shopify
        );

    console.log('');

    console.log(
        `Shopify SKUs loaded: ${skuMap.size}`
    );

    /*
    ============================================
    FIND SHOPIFY SKU
    ============================================
    */

    const skuKey =
        TEST_SKU
            .trim()
            .toLowerCase();

    const existing =
        skuMap.get(
            skuKey
        );

    if (!existing) {

        throw new Error(
            `Shopify product with SKU ${TEST_SKU} was not found.`
        );
    }

    console.log('');

    console.log(
        '✓ Shopify SKU found.'
    );

    console.log('');

    /*
    ============================================
    SHOW EXACT SKU MAP RECORD
    ============================================
    */

    console.log(
        'Shopify SKU map record:'
    );

    console.log('');

    console.log(
        JSON.stringify(
            existing,
            null,
            2
        )
    );

    console.log('');

    /*
    ============================================
    IMPORTANT
    ============================================
    */

    console.log(
        '======================================'
    );

    console.log(
        ' SHOPIFY RECORD CHECK COMPLETE'
    );

    console.log(
        '======================================'
    );

    console.log('');

    console.log(
        'Syntech SKU:',
        product.sku
    );

    console.log(
        'Syntech stock:',
        product.stock
    );

    console.log('');

    console.log(
        'The Shopify SKU record above will be used'
    );

    console.log(
        'to identify the correct Shopify product.'
    );

    console.log('');

    console.log(
        'NO Shopify stock was changed by this test.'
    );

    console.log('');

}


main().catch(error => {

    console.error('');

    console.error(
        'SINGLE PRODUCT TEST FAILED'
    );

    console.error('');

    if (error.response) {

        console.error(
            'HTTP:',
            error.response.status
        );

        console.error(
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
});


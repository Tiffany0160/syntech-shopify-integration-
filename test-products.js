'use strict';

require('dotenv').config();

const { ShopifyClient } = require('./shopify/client');

async function main() {

    console.log('');
    console.log('======================================');
    console.log(' SHOPIFY PRODUCT CHECK');
    console.log('======================================');
    console.log('');

    const shopify = new ShopifyClient();

    console.log('Loading Shopify products...');

    const data = await shopify.request(
        'GET',
        '/products.json',
        {
            params: {
                limit: 10
            }
        }
    );

    const products = data.products || [];

    console.log('');
    console.log('Products found:', products.length);
    console.log('');

    if (!products.length) {
        console.log('No products were returned from Shopify.');
        return;
    }

    for (const product of products) {

        const variant = product.variants?.[0];

        console.log('--------------------------------------');
        console.log('Product ID:', product.id);
        console.log('Title:', product.title);
        console.log('SKU:', variant?.sku || '');
        console.log('Price:', variant?.price || '');
        console.log('Status:', product.status);
        console.log('');
    }

    console.log('======================================');
    console.log(' CHECK COMPLETE');
    console.log('======================================');
    console.log('');
}

main().catch(error => {

    console.log('');
    console.log('======================================');
    console.log(' CHECK FAILED');
    console.log('======================================');
    console.log('');

    if (error.response) {
        console.log('HTTP Status:', error.response.status);
        console.log(
            JSON.stringify(
                error.response.data,
                null,
                2
            )
        );
    } else {
        console.log('Error:', error.message);
    }

    console.log('');
});
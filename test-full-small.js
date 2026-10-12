'use strict';

require('dotenv').config();

const {
    getSyntechFullProducts
} = require('./syntech/products');

const { syncProducts } = require('./sync');

async function main() {
    console.log('');
    console.log('======================================');
    console.log(' SYNTECH FULL FEED SMALL TEST');
    console.log('======================================');
    console.log('');

    console.log('Downloading Syntech FULL feed...');
    console.log('This makes ONE FULL feed request.');
    console.log('');

    const result = await getSyntechFullProducts();

    console.log('');
    console.log('FULL feed products:', result.products.length);
    console.log('');

    const testProducts = result.products.slice(0, 5);

    console.log('Testing first:', testProducts.length, 'products');
    console.log('');

    for (let i = 0; i < testProducts.length; i++) {
        console.log(
            `${i + 1}. ${testProducts[i].sku} - ${testProducts[i].name}`
        );
    }

    console.log('');
    console.log('Starting Shopify test...');
    console.log('');

    await syncProducts(testProducts, 'full');

    console.log('');
    console.log('======================================');
    console.log(' SMALL FULL TEST FINISHED');
    console.log('======================================');
    console.log('');
}

main().catch(error => {
    console.error('');
    console.error('======================================');
    console.error(' SMALL FULL TEST FAILED');
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
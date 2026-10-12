'use strict';

require('dotenv').config();

const {
    SyntechClient
} = require('./syntech/client');

const {
    parseSyntechXML
} = require('./syntech/parser');

const {
    getProductArray
} = require('./syntech/products');

async function main() {

    console.log('');
    console.log('======================================');
    console.log(' SYNTECH REAL FEED TEST');
    console.log('======================================');
    console.log('');

    const client =
        new SyntechClient();

    console.log('Downloading FULL Syntech feed...');

    const xml =
        await client.getFullFeed();

    console.log('');
    console.log('XML downloaded successfully.');
    console.log(
        'Characters:',
        xml.length
    );

    console.log('');
    console.log('Parsing XML...');

    const data =
        parseSyntechXML(xml);

    const products =
        getProductArray(data);

    console.log('');
    console.log('======================================');
    console.log(' FEED RESULTS');
    console.log('======================================');
    console.log('');

    console.log(
        'Products found:',
        products.length
    );

    if (products.length === 0) {

        console.log('');
        console.log(
            'WARNING: No products were found.'
        );

        console.log('');
        console.log(
            'Top-level XML structure:'
        );

        console.log(
            Object.keys(data)
        );

        return;
    }

    console.log('');
    console.log('FIRST PRODUCT');
    console.log('--------------------------------------');

    console.log(
        JSON.stringify(
            products[0],
            null,
            2
        )
    );

    console.log('');
    console.log('======================================');
    console.log(' TEST COMPLETE');
    console.log('======================================');
    console.log('');
}

main().catch(error => {

    console.log('');
    console.log('======================================');
    console.log(' FEED TEST FAILED');
    console.log('======================================');
    console.log('');

    if (error.response) {

        console.log(
            'HTTP Status:',
            error.response.status
        );

        console.log(
            'Response:',
            error.response.data
        );

    } else {

        console.log(
            'Error:',
            error.message
        );
    }

    console.log('');
});
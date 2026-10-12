'use strict';

require('dotenv').config();

const { SyntechClient } = require('./syntech/client');
const { parseSyntechXML } = require('./syntech/parser');


function getProductArray(data) {

    if (
        data &&
        data.syntechstock &&
        data.syntechstock.stock &&
        data.syntechstock.stock.product
    ) {
        return data.syntechstock.stock.product;
    }

    return [];
}


async function main() {

    console.log('');
    console.log('======================================');
    console.log(' SYNTECH FULL FEED PRODUCT TEST');
    console.log('======================================');
    console.log('');

    const client = new SyntechClient();

    console.log('Downloading Syntech FULL feed...');
    console.log('');

    const xml = await client.getFullFeed();

    console.log('Feed downloaded.');
    console.log('Characters:', xml.length);
    console.log('');

    const data = parseSyntechXML(xml);

    const products = getProductArray(data);

    console.log('Products found:', products.length);
    console.log('');

    if (!products.length) {
        console.log('No products found.');
        return;
    }

    const product = products[0];

    console.log('======================================');
    console.log(' RAW FIRST FULL-FEED PRODUCT');
    console.log('======================================');
    console.log('');

    console.log(
        JSON.stringify(
            product,
            null,
            2
        )
    );

    console.log('');
    console.log('======================================');
    console.log(' END');
    console.log('======================================');
    console.log('');
}


main().catch(error => {

    console.error('');
    console.error('TEST FAILED');
    console.error('');
    console.error(error.message);
    console.error('');

});
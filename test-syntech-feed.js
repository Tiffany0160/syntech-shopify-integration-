'use strict';

require('dotenv').config();

const {
    SyntechClient
} = require('./syntech/client');

const {
    parseSyntechXML
} = require('./syntech/parser');

const {
    mapSyntechProduct
} = require('./syntech/mapper');


function getProductArray(data) {

    if (
        data &&
        data.syntechstock &&
        data.syntechstock.stock &&
        data.syntechstock.stock.product
    ) {
        return data.syntechstock.stock.product;
    }

    if (
        data &&
        data.Products &&
        data.Products.Product
    ) {
        return data.Products.Product;
    }

    return [];
}


async function main() {

    console.log('');
    console.log('======================================');
    console.log(' SYNTECH FEED TEST');
    console.log('======================================');
    console.log('');

    const client =
        new SyntechClient();


    console.log(
        'Testing Syntech UPDATE feed...'
    );

    console.log('');


    try {

        const xml =
            await client.getUpdateFeed();


        console.log(
            'Feed downloaded successfully.'
        );

        console.log(
            'XML characters:',
            xml.length
        );

        console.log('');


        const data =
            parseSyntechXML(xml);


        const products =
            getProductArray(data);


        console.log(
            'Products found:',
            products.length
        );

        console.log('');


        if (!products.length) {

            console.log(
                'No products were found in the update feed.'
            );

            return;
        }


        const limit =
            Math.min(
                products.length,
                5
            );


        console.log(
            'First products:'
        );

        console.log('');


        for (
            let i = 0;
            i < limit;
            i++
        ) {

            const product =
                mapSyntechProduct(
                    products[i]
                );


            console.log(
                `${i + 1}. ${product.sku}`
            );

            console.log(
                `   Name: ${product.title}`
            );

            console.log(
                `   Supplier cost: R ${product.supplierPrice}`
            );

            console.log(
                `   RRP: R ${product.rrp}`
            );

            console.log(
                `   Shopify price: R ${product.price}`
            );

            console.log(
                `   Stock: ${product.stock}`
            );

            console.log(
                `   Images: ${product.images.length}`
            );

            console.log('');
        }


        console.log(
            '======================================'
        );

        console.log(
            ' SYNTECH FEED TEST SUCCESSFUL'
        );

        console.log(
            '======================================'
        );

        console.log('');

    } catch (error) {

        console.log('');
        console.log(
            '======================================'
        );

        console.log(
            ' SYNTECH FEED TEST FAILED'
        );

        console.log(
            '======================================'
        );

        console.log('');

        console.error(
            error.message
        );

        console.log('');
    }
}


main();
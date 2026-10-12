'use strict';

require('dotenv').config();

const { ShopifyClient } = require('./shopify/client');
const { addMissingImages } = require('./shopify/media');

const PRODUCT_ID = 15399349289138;

const images = [
    'https://www.syntech.co.za/wp-content/uploads/2026/09/AHHSBK-10_Anycubic-PLA-High-Speed-Filament-1kg-–-Pearl-Black_wr_01.jpg',
    'https://www.syntech.co.za/wp-content/uploads/2026/09/AHHSBK-10_Anycubic-PLA-High-Speed-Filament-1kg-–-Pearl-Black_wr_02.jpg',
    'https://www.syntech.co.za/wp-content/uploads/2026/09/AHHSBK-10_Anycubic-PLA-High-Speed-Filament-1kg-–-Pearl-Black_wr_03.jpg',
    'https://www.syntech.co.za/wp-content/uploads/2026/09/AHHSBK-10_Anycubic-PLA-High-Speed-Filament-1kg-–-Pearl-Black_wr_04.jpg'
];

async function main() {

    console.log('');
    console.log('======================================');
    console.log(' REAL SHOPIFY IMAGE TEST');
    console.log('======================================');
    console.log('');

    console.log('Shopify Product ID:', PRODUCT_ID);
    console.log('Images to upload:', images.length);

    const shopify = new ShopifyClient();

    console.log('');
    console.log('Uploading images...');

    const added = await addMissingImages(
        shopify,
        PRODUCT_ID,
        images
    );

    console.log('');
    console.log('======================================');
    console.log(' IMAGE TEST COMPLETE');
    console.log('======================================');
    console.log('');

    console.log('Images added:', added);
    console.log('');
}

main().catch(error => {

    console.log('');
    console.log('======================================');
    console.log(' IMAGE TEST FAILED');
    console.log('======================================');
    console.log('');

    if (error.response && error.response.data) {
        console.error(
            JSON.stringify(
                error.response.data,
                null,
                2
            )
        );
    } else {
        console.error(error.message);
    }

    console.log('');
});
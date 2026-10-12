'use strict';

const fs = require('fs');

const {
    parseSyntechXML
} = require('./syntech/parser');

const {
    mapSyntechProduct
} = require('./syntech/mapper');

const xml =
    fs.readFileSync(
        './test-data/sample.xml',
        'utf8'
    );

const data =
    parseSyntechXML(xml);

let products = [];

if (
    data.syntechstock &&
    data.syntechstock.stock &&
    data.syntechstock.stock.product
) {

    products =
        data.syntechstock.stock.product;

} else if (
    data.Products &&
    data.Products.Product
) {

    products =
        data.Products.Product;
}


console.log('');
console.log('======================================');
console.log(' SYNTECH PRODUCT MAPPING TEST');
console.log('======================================');
console.log('');

console.log(
    `Products found: ${products.length}`
);

console.log('');

for (const product of products) {

    const mapped =
        mapSyntechProduct(product);

    console.log(
        '--------------------------------------'
    );

    console.log(
        'SKU:',
        mapped.sku
    );

    console.log(
        'Title:',
        mapped.title
    );

    console.log(
        'Supplier Cost: R',
        mapped.supplierPrice
    );

    console.log(
        'Recommended Retail: R',
        mapped.rrp
    );

    console.log(
        'Shopify Price: R',
        mapped.price
    );

    console.log(
        'Stock:',
        mapped.stock
    );

    console.log(
        'Cape Town:',
        mapped.stockBreakdown.capeTown
    );

    console.log(
        'Johannesburg:',
        mapped.stockBreakdown.johannesburg
    );

    console.log(
        'Durban:',
        mapped.stockBreakdown.durban
    );

    console.log(
        'Images:',
        mapped.images.length
    );

    console.log(
        'Brand:',
        mapped.brand
    );

    console.log('');
}

console.log(
    'Mapping test complete!'
);

console.log('');
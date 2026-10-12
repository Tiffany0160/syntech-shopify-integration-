'use strict';

const { SyntechClient } = require('./client');
const { parseSyntechXML } = require('./parser');

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

async function getSyntechFullProducts() {
    const client = new SyntechClient();

    const xml = await client.getFullFeed();

    const data = parseSyntechXML(xml);

    const products = getProductArray(data);

    return {
        data,
        products
    };
}

async function getSyntechUpdateProducts() {
    const client = new SyntechClient();

    const xml = await client.getUpdateFeed();

    const data = parseSyntechXML(xml);

    const products = getProductArray(data);

    return {
        data,
        products
    };
}

module.exports = {
    getProductArray,
    getSyntechFullProducts,
    getSyntechUpdateProducts
};
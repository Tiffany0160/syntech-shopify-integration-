'use strict';

require('dotenv').config();

const { ShopifyClient } = require('./shopify/client');
const { findProductBySKU } = require('./shopify/products');
const {
    getLocations,
    enableInventoryTracking,
    setInventory
} = require('./shopify/inventory');
const { addMissingImages } = require('./shopify/media');

const product = {
    sku: 'AHHSBK-10',
    title: 'Anycubic PLA High Speed Filament 1kg – Pearl Black',
    description:
        '<p><strong>Print up to 600 mm/s | Smooth, clog-free output | High toughness, low shrinkage | Compatible with standard and high-speed FDM printers | 1 kg spool</strong></p>',
    brand: 'ANYCUBIC',
    categoryTree: 'Lifestyle & home tech > 3D printing > 3D Printer Materials',
    price: 399,
    stock: 48,
    images: [
        'https://www.syntech.co.za/wp-content/uploads/2026/09/AHHSBK-10_Anycubic-PLA-High-Speed-Filament-1kg-–-Pearl-Black_wr_01.jpg',
        'https://www.syntech.co.za/wp-content/uploads/2026/09/AHHSBK-10_Anycubic-PLA-High-Speed-Filament-1kg-–-Pearl-Black_wr_02.jpg',
        'https://www.syntech.co.za/wp-content/uploads/2026/09/AHHSBK-10_Anycubic-PLA-High-Speed-Filament-1kg-–-Pearl-Black_wr_03.jpg',
        'https://www.syntech.co.za/wp-content/uploads/2026/09/AHHSBK-10_Anycubic-PLA-High-Speed-Filament-1kg-–-Pearl-Black_wr_04.jpg'
    ]
};

async function main() {
    console.log('');
    console.log('======================================');
    console.log(' REAL SHOPIFY PRODUCT TEST');
    console.log('======================================');
    console.log('');

    console.log('SKU:', product.sku);
    console.log('Price: R', product.price);
    console.log('Stock:', product.stock);
    console.log('Images:', product.images.length);

    const shopify = new ShopifyClient();

    console.log('');
    console.log('Checking Shopify for existing product...');

    const existing = await findProductBySKU(shopify, product.sku);

    if (existing) {
        console.log('');
        console.log('PRODUCT ALREADY EXISTS');
        console.log('Product:', existing.product.title);
        console.log('Product ID:', existing.product.id);
        console.log('Variant ID:', existing.variant.id);
        console.log('');
        console.log('STOPPING WITHOUT CHANGING THE PRODUCT.');
        console.log('');
        console.log('REAL SHOPIFY PRODUCT TEST STOPPED SAFELY.');
        return;
    }

    console.log('');
    console.log('Product does not exist.');
    console.log('Creating new Shopify product...');

    const data = await shopify.request(
        'POST',
        '/products.json',
        {
            data: {
                product: {
                    title: product.title,
                    body_html: product.description,
                    vendor: product.brand,
                    product_type: product.categoryTree,
                    status: 'active',
                    variants: [
                        {
                            sku: product.sku,
                            price: product.price,
                            inventory_management: 'shopify'
                        }
                    ]
                }
            }
        }
    );

    const createdProduct = data.product;

    console.log('');
    console.log('PRODUCT CREATED');
    console.log('Product:', createdProduct.title);
    console.log('Product ID:', createdProduct.id);

    const variant = createdProduct.variants[0];

    console.log('Variant ID:', variant.id);
    console.log('Inventory Item ID:', variant.inventory_item_id);

    console.log('');
    console.log('Getting Shopify locations...');

    const locations = await getLocations(shopify);

    if (!locations.length) {
        throw new Error('No Shopify locations found.');
    }

    const location = locations[0];

    console.log('Location:', location.name);
    console.log('Location ID:', location.id);

    console.log('');
    console.log('Enabling inventory tracking...');

    await enableInventoryTracking(
        shopify,
        variant.inventory_item_id
    );

    console.log('Inventory tracking enabled.');

    console.log('');
    console.log('Setting stock to:', product.stock);

    await setInventory(
        shopify,
        variant.inventory_item_id,
        location.id,
        product.stock
    );

    console.log('Stock set successfully.');

    console.log('');
    console.log('Adding product images...');

    const addedImages = await addMissingImages(
        shopify,
        createdProduct.id,
        product.images
    );

    console.log('Images added:', addedImages);

    console.log('');
    console.log('======================================');
    console.log(' REAL SHOPIFY PRODUCT TEST SUCCESSFUL');
    console.log('======================================');
    console.log('');

    console.log('Product:', createdProduct.title);
    console.log('SKU:', product.sku);
    console.log('Price: R', product.price);
    console.log('Stock:', product.stock);
    console.log('Images added:', addedImages);
    console.log('');
}

main().catch(error => {
    console.log('');
    console.log('======================================');
    console.log(' REAL SHOPIFY PRODUCT TEST FAILED');
    console.log('======================================');
    console.log('');

    if (error.response && error.response.data) {
        console.error(JSON.stringify(error.response.data, null, 2));
    } else {
        console.error(error.message);
    }

    console.log('');
});
'use strict';

require('dotenv').config();

const {
    getSyntechFullProducts,
    getSyntechUpdateProducts
} = require('./syntech/products');

const {
    mapSyntechProduct
} = require('./syntech/mapper');

const {
    ShopifyClient
} = require('./shopify/client');

const {
    buildShopifySKUMap,
    createProduct,
    updateProduct
} = require('./shopify/products');

const {
    getLocations,
    enableInventoryTracking,
    setInventory
} = require('./shopify/inventory');

const {
    addMissingImages
} = require('./shopify/media');

function sleep(ms) {
    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}

async function updatePriceOnly(
    shopify,
    existing,
    product
) {
    const variantId =
        existing.variant.id;

    await shopify.request(
        'PUT',
        `/variants/${variantId}.json`,
        {
            data: {
                variant: {
                    id: variantId,
                    price: product.price
                }
            }
        }
    );
}

async function syncFullProduct(
    shopify,
    product,
    location,
    existing
) {
    let shopifyProduct;
    let variantId;

    if (existing) {
        console.log(
            'Existing Shopify product found.'
        );

        const result =
            await updateProduct(
                shopify,
                existing,
                product
            );

        shopifyProduct =
            result.product;

        variantId =
            result.variantId;

        console.log(
            'Full product information updated.'
        );
    } else {
        console.log(
            'Product not found. Creating...'
        );

        shopifyProduct =
            await createProduct(
                shopify,
                product
            );

        if (
            !shopifyProduct ||
            !shopifyProduct.variants ||
            !shopifyProduct.variants.length
        ) {
            throw new Error(
                'Shopify product was created but no variant was returned.'
            );
        }

        variantId =
            shopifyProduct
                .variants[0]
                .id;

        console.log(
            'Product created.'
        );
    }

    let variant =
        shopifyProduct.variants &&
        shopifyProduct.variants[0];

    let inventoryItemId =
        variant
            ? variant.inventory_item_id
            : null;

    /*
     * If inventory_item_id was not returned,
     * retrieve the product again.
     */
    if (!inventoryItemId) {
        const productData =
            await shopify.request(
                'GET',
                `/products/${shopifyProduct.id}.json`
            );

        const foundVariant =
            productData.product.variants.find(
                item =>
                    String(item.id) ===
                    String(variantId)
            );

        if (foundVariant) {
            inventoryItemId =
                foundVariant.inventory_item_id;
        }
    }

    /*
     * Update stock.
     */
    if (inventoryItemId) {
        await enableInventoryTracking(
            shopify,
            inventoryItemId
        );

        await setInventory(
            shopify,
            inventoryItemId,
            location.id,
            product.stock
        );

        console.log(
            `Stock updated to ${product.stock}.`
        );
    } else {
        console.log(
            'Inventory item ID not available. Stock skipped.'
        );
    }

    /*
     * Add images.
     */
    if (
        Array.isArray(product.images) &&
        product.images.length > 0
    ) {
        const imageCount =
            await addMissingImages(
                shopify,
                shopifyProduct.id,
                product.images
            );

        console.log(
            `Images added: ${imageCount}`
        );
    } else {
        console.log(
            'No product images found.'
        );
    }

    return {
        created: !existing,
        updated: !!existing
    };
}

async function syncUpdateProduct(
    shopify,
    product,
    location,
    existing
) {
    if (!existing) {
        console.log(
            'Product not found in Shopify.'
        );

        console.log(
            'Skipped because this is an UPDATE feed.'
        );

        return {
            created: false,
            updated: false,
            skipped: true
        };
    }

    console.log(
        'Existing Shopify product found.'
    );

    await updatePriceOnly(
        shopify,
        existing,
        product
    );

    console.log(
        `Price updated to R${product.price}`
    );

    let inventoryItemId =
        existing.variant.inventory_item_id;

    if (!inventoryItemId) {
        const productData =
            await shopify.request(
                'GET',
                `/products/${existing.product.id}.json`
            );

        const foundVariant =
            productData.product.variants.find(
                item =>
                    String(item.id) ===
                    String(existing.variant.id)
            );

        if (foundVariant) {
            inventoryItemId =
                foundVariant.inventory_item_id;
        }
    }

    if (inventoryItemId) {
        await enableInventoryTracking(
            shopify,
            inventoryItemId
        );

        await setInventory(
            shopify,
            inventoryItemId,
            location.id,
            product.stock
        );

        console.log(
            `Stock updated to ${product.stock}`
        );
    }

    return {
        created: false,
        updated: true,
        skipped: false
    };
}

async function syncProducts(
    products,
    mode
) {
    if (!Array.isArray(products)) {
        throw new Error(
            'syncProducts expected products to be an array.'
        );
    }

    const shopify =
        new ShopifyClient();

    console.log('');
    console.log(
        '======================================'
    );
    console.log(
        ` ${mode.toUpperCase()} SYNCHRONISATION`
    );
    console.log(
        '======================================'
    );
    console.log('');

    console.log(
        'Products received:',
        products.length
    );

    console.log('');

    /*
     * Load Shopify products once.
     */
    console.log(
        'Loading existing Shopify products...'
    );

    const skuMap =
        await buildShopifySKUMap(
            shopify
        );

    console.log(
        `Shopify SKUs loaded: ${skuMap.size}`
    );

    console.log('');

    const locations =
        await getLocations(
            shopify
        );

    if (
        !locations ||
        !locations.length
    ) {
        throw new Error(
            'No Shopify locations were found.'
        );
    }

    let location;

    /*
     * Prefer the location specified in .env.
     */
    const configuredLocationId =
        process.env.SHOPIFY_LOCATION_ID;

    if (configuredLocationId) {
        location =
            locations.find(
                item =>
                    String(item.id) ===
                    String(configuredLocationId)
            );
    }

    /*
     * Otherwise use the first Shopify location.
     */
    if (!location) {
        location = locations[0];
    }

    console.log(
        'Shopify location:',
        location.name
    );

    console.log(
        'Location ID:',
        location.id
    );

    console.log('');

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (
        let i = 0;
        i < products.length;
        i++
    ) {
        const rawProduct =
            products[i];

        let product;

        /*
         * Map the Syntech product.
         */
        try {
            product =
                mapSyntechProduct(
                    rawProduct
                );
        } catch (error) {
            failed++;

            console.error(
                `Failed to map product ${i + 1}:`,
                error.message
            );

            continue;
        }

        console.log('');
        console.log(
            `[${i + 1}/${products.length}] ${product.sku}`
        );

        if (!product.sku) {
            console.log(
                'Skipped: product has no SKU.'
            );

            skipped++;

            continue;
        }

        try {
            const skuKey =
                String(product.sku)
                    .trim()
                    .toLowerCase();

            const existing =
                skuMap.get(skuKey) ||
                null;

            if (mode === 'full') {
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

                console.log(
                    'Images:',
                    product.images.length
                );

                const result =
                    await syncFullProduct(
                        shopify,
                        product,
                        location,
                        existing
                    );

                if (result.created) {
                    created++;
                }

                if (result.updated) {
                    updated++;
                }
            }

            if (mode === 'update') {
                console.log(
                    'Price:',
                    `R ${product.price}`
                );

                console.log(
                    'Stock:',
                    product.stock
                );

                const result =
                    await syncUpdateProduct(
                        shopify,
                        product,
                        location,
                        existing
                    );

                if (result.updated) {
                    updated++;
                }

                if (result.skipped) {
                    skipped++;
                }
            }

            /*
             * Small delay to reduce API pressure.
             */
            await sleep(250);
        } catch (error) {
            failed++;

            console.error(
                'Product sync failed.'
            );

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
        }
    }

    console.log('');
    console.log(
        '======================================'
    );
    console.log(
        ' SYNCHRONISATION COMPLETE'
    );
    console.log(
        '======================================'
    );
    console.log('');

    console.log(
        'Created:',
        created
    );

    console.log(
        'Updated:',
        updated
    );

    console.log(
        'Skipped:',
        skipped
    );

    console.log(
        'Failed:',
        failed
    );

    console.log('');
}

async function runFullSync() {
    console.log('');
    console.log(
        'Loading Syntech FULL feed...'
    );

    const result =
        await getSyntechFullProducts();

    await syncProducts(
        result.products,
        'full'
    );
}

async function runUpdateSync() {
    console.log('');
    console.log(
        'Loading Syntech UPDATE feed...'
    );

    const result =
        await getSyntechUpdateProducts();

    await syncProducts(
        result.products,
        'update'
    );
}

module.exports = {
    runFullSync,
    runUpdateSync,
    syncProducts
};
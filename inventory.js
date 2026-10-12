'use strict';

const axios = require('axios');
const crypto = require('crypto');


// ========================================
// GET SHOPIFY LOCATIONS
// ========================================

async function getLocations(shopify) {
    const data = await shopify.request(
        'GET',
        '/locations.json'
    );

    return data.locations || [];
}


// ========================================
// SHOPIFY GRAPHQL IDS
// ========================================

function inventoryItemGID(inventoryItemId) {
    return `gid://shopify/InventoryItem/${inventoryItemId}`;
}

function locationGID(locationId) {
    return `gid://shopify/Location/${locationId}`;
}


// ========================================
// GRAPHQL HELPER
// ========================================

async function graphql(
    shopify,
    query,
    variables
) {
    const token =
        await shopify.getAccessToken();

    const url =
        `https://${shopify.storeDomain}` +
        `/admin/api/${shopify.apiVersion}/graphql.json`;

    const response =
        await axios.post(
            url,
            {
                query,
                variables
            },
            {
                headers: {
                    'Content-Type':
                        'application/json',

                    'X-Shopify-Access-Token':
                        token
                },

                timeout: 60000
            }
        );

    if (response.data.errors) {
        throw new Error(
            JSON.stringify(
                response.data.errors,
                null,
                2
            )
        );
    }

    return response.data.data;
}


// ========================================
// ENABLE INVENTORY TRACKING
// ========================================

async function enableInventoryTracking(
    shopify,
    inventoryItemId
) {
    console.log(
        'Enabling Shopify inventory tracking...'
    );

    const query = `
        mutation InventoryItemUpdate(
            $id: ID!
            $input: InventoryItemInput!
        ) {
            inventoryItemUpdate(
                id: $id
                input: $input
            ) {
                inventoryItem {
                    id
                    tracked
                    requiresShipping
                }

                userErrors {
                    field
                    message
                }
            }
        }
    `;

    const variables = {
        id:
            inventoryItemGID(
                inventoryItemId
            ),

        input: {
            tracked: true
        }
    };

    const data =
        await graphql(
            shopify,
            query,
            variables
        );

    const result =
        data.inventoryItemUpdate;

    if (
        result.userErrors &&
        result.userErrors.length
    ) {
        throw new Error(
            result.userErrors
                .map(
                    error =>
                        error.message
                )
                .join('; ')
        );
    }

    console.log(
        'Inventory tracking enabled.'
    );

    return result.inventoryItem;
}


// ========================================
// GET CURRENT INVENTORY
// ========================================

async function getAvailableQuantity(
    shopify,
    inventoryItemId,
    locationId
) {
    const query = `
        query InventoryQuantity(
            $inventoryItemId: ID!
        ) {
            inventoryItem(
                id: $inventoryItemId
            ) {
                id
                tracked

                inventoryLevels(
                    first: 50
                ) {
                    nodes {
                        id

                        location {
                            id
                            name
                        }

                        quantities(
                            names: ["available"]
                        ) {
                            name
                            quantity
                        }
                    }
                }
            }
        }
    `;

    const variables = {
        inventoryItemId:
            inventoryItemGID(
                inventoryItemId
            )
    };

    const data =
        await graphql(
            shopify,
            query,
            variables
        );

    if (!data.inventoryItem) {
        throw new Error(
            'Shopify inventory item was not found.'
        );
    }

    console.log(
        'Inventory tracked:',
        data.inventoryItem.tracked
    );

    const levels =
        data.inventoryItem
            .inventoryLevels
            .nodes || [];

    const targetLocationId =
        String(locationId);

    for (const level of levels) {
        const levelLocationId =
            String(
                level.location.id
                    .split('/')
                    .pop()
            );

        console.log(
            'Shopify inventory location:',
            level.location.name,
            '| ID:',
            levelLocationId
        );

        if (
            levelLocationId ===
            targetLocationId
        ) {
            const available =
                (level.quantities || [])
                    .find(
                        quantity =>
                            quantity.name ===
                            'available'
                    );

            return available
                ? Number(
                    available.quantity
                )
                : 0;
        }
    }

    return 0;
}


// ========================================
// SET INVENTORY
// ========================================

async function setInventory(
    shopify,
    inventoryItemId,
    locationId,
    quantity
) {
    const newQuantity =
        Math.max(
            0,
            Math.floor(
                Number(quantity) || 0
            )
        );


    // Make sure Shopify tracks
    // the inventory item
    await enableInventoryTracking(
        shopify,
        inventoryItemId
    );


    // Check current Shopify quantity
    const currentQuantity =
        await getAvailableQuantity(
            shopify,
            inventoryItemId,
            locationId
        );

    console.log(
        'Current Shopify stock:',
        currentQuantity
    );

    console.log(
        'New Shopify stock:',
        newQuantity
    );


    // No update needed
    if (
        currentQuantity ===
        newQuantity
    ) {
        console.log(
            'Shopify stock is already correct.'
        );

        return {
            changed: false,

            previousQuantity:
                currentQuantity,

            quantity:
                newQuantity
        };
    }


    // ========================================
    // UPDATE SHOPIFY INVENTORY
    // ========================================

    console.log(
        'Updating Shopify inventory...'
    );

    const query = `
        mutation InventorySetQuantities(
            $input: InventorySetQuantitiesInput!
            $idempotencyKey: String!
        ) {
            inventorySetQuantities(
                input: $input
            ) @idempotent(
                key: $idempotencyKey
            ) {
                inventoryAdjustmentGroup {
                    reason
                    referenceDocumentUri

                    changes {
                        name
                        delta
                        quantityAfterChange
                    }
                }

                userErrors {
                    code
                    field
                    message
                }
            }
        }
    `;


    const idempotencyKey =
        crypto.randomUUID();


    const variables = {
        input: {
            name: 'available',

            reason: 'correction',

            referenceDocumentUri:
                'syntech://shopify-sync',

            quantities: [
                {
                    inventoryItemId:
                        inventoryItemGID(
                            inventoryItemId
                        ),

                    locationId:
                        locationGID(
                            locationId
                        ),

                    quantity:
                        newQuantity,

                    changeFromQuantity:
                        currentQuantity
                }
            ]
        },

        idempotencyKey
    };


    const data =
        await graphql(
            shopify,
            query,
            variables
        );


    const result =
        data.inventorySetQuantities;


    if (
        result.userErrors &&
        result.userErrors.length
    ) {
        throw new Error(
            result.userErrors
                .map(
                    error =>
                        error.message
                )
                .join('; ')
        );
    }


    console.log(
        'Shopify inventory mutation completed.'
    );


    // ========================================
    // VERIFY INVENTORY
    // ========================================

    const verifiedQuantity =
        await getAvailableQuantity(
            shopify,
            inventoryItemId,
            locationId
        );


    console.log(
        'Verified Shopify stock:',
        verifiedQuantity
    );


    if (
        Number(verifiedQuantity) !==
        Number(newQuantity)
    ) {
        throw new Error(
            `Inventory verification failed. ` +
            `Expected ${newQuantity}, ` +
            `but Shopify reports ` +
            `${verifiedQuantity}.`
        );
    }


    console.log(
        'Shopify stock verified successfully.'
    );


    return {
        changed: true,

        previousQuantity:
            currentQuantity,

        quantity:
            newQuantity,

        verifiedQuantity,

        result
    };
}


// ========================================
// EXPORTS
// ========================================

module.exports = {
    getLocations,
    enableInventoryTracking,
    getAvailableQuantity,
    setInventory
};
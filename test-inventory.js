'use strict';

require('dotenv').config();

const axios = require('axios');

const {
    ShopifyClient
} = require('./shopify/client');


async function main() {

    console.log('');
    console.log('======================================');
    console.log(' SHOPIFY STOCK UPDATE TEST');
    console.log('======================================');
    console.log('');

    const shopify = new ShopifyClient();

    const inventoryItemId =
        '69578397122738';

    const locationId =
        '84123287730';

    /*
     * Shopify currently has 0 stock.
     */
    const currentQuantity =
        0;

    /*
     * We want Shopify to have 30.
     */
    const newQuantity =
        30;

    /*
     * Shopify requires an idempotency key
     * for inventorySetQuantities.
     */
    const idempotencyKey =
        `syntech-stock-test-${Date.now()}`;


    console.log(
        'Inventory Item ID:',
        inventoryItemId
    );

    console.log(
        'Location ID:',
        locationId
    );

    console.log(
        'Current stock:',
        currentQuantity
    );

    console.log(
        'New stock:',
        newQuantity
    );

    console.log('');


    const token =
        await shopify.getAccessToken();


    const url =
        `https://${shopify.storeDomain}/admin/api/${shopify.apiVersion}/graphql.json`;


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


    const variables = {

        input: {

            name:
                'available',

            reason:
                'correction',

            referenceDocumentUri:
                'syntech://shopify-stock-test',

            quantities: [

                {

                    inventoryItemId:
                        `gid://shopify/InventoryItem/${inventoryItemId}`,

                    locationId:
                        `gid://shopify/Location/${locationId}`,

                    changeFromQuantity:
                        currentQuantity,

                    quantity:
                        newQuantity

                }

            ]
        },

        idempotencyKey:
            idempotencyKey
    };


    try {

        console.log(
            'Setting Shopify stock...'
        );

        console.log('');


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


        console.log(
            JSON.stringify(
                response.data,
                null,
                2
            )
        );


        if (response.data.errors) {

            console.log('');
            console.log(
                'Shopify GraphQL error occurred.'
            );
            console.log('');

            return;
        }


        const result =
            response.data.data
                .inventorySetQuantities;


        if (
            result.userErrors &&
            result.userErrors.length
        ) {

            console.log('');
            console.log(
                'Shopify returned an inventory error:'
            );
            console.log('');

            for (
                const error
                of result.userErrors
            ) {

                console.log(
                    error.message
                );
            }

            console.log('');

            return;
        }


        console.log('');
        console.log(
            '======================================'
        );

        console.log(
            ' STOCK UPDATED SUCCESSFULLY'
        );

        console.log(
            '======================================'
        );

        console.log('');


        if (
            result.inventoryAdjustmentGroup &&
            result.inventoryAdjustmentGroup.changes
        ) {

            for (
                const change
                of result.inventoryAdjustmentGroup.changes
            ) {

                console.log(
                    'Inventory:',
                    change.name
                );

                console.log(
                    'Change:',
                    change.delta
                );

                console.log(
                    'New quantity:',
                    change.quantityAfterChange
                );

            }
        }


        console.log('');

    } catch (error) {

        console.log('');
        console.log(
            '======================================'
        );

        console.log(
            ' STOCK UPDATE FAILED'
        );

        console.log(
            '======================================'
        );

        console.log('');

        if (error.response) {

            console.log(
                'HTTP Status:',
                error.response.status
            );

            console.log(
                JSON.stringify(
                    error.response.data,
                    null,
                    2
                )
            );

        } else {

            console.log(
                'Error:',
                error.message
            );
        }

        console.log('');
    }
}


main();
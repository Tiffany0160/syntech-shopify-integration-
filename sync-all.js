
'use strict';

require('dotenv').config();

const {
    spawn
} = require('child_process');

const TOTAL_BATCHES = 6;


function runBatch(batchNumber) {

    return new Promise((resolve, reject) => {

        console.log('');
        console.log('======================================');
        console.log(` STARTING BATCH ${batchNumber}/${TOTAL_BATCHES}`);
        console.log('======================================');
        console.log('');

        const batchProcess =
            spawn(
                process.execPath,
                [
                    __dirname + '\\batch-sync.js',
                    String(batchNumber)
                ],
                {
                    stdio: 'inherit',
                    cwd: process.cwd()
                }
            );


        batchProcess.on(
            'error',
            error => {

                reject(error);

            }
        );


        batchProcess.on(
            'close',
            code => {

                if (code === 0) {

                    console.log('');
                    console.log(
                        `✓ BATCH ${batchNumber}/${TOTAL_BATCHES} FINISHED`
                    );
                    console.log('');

                    resolve();

                } else {

                    reject(
                        new Error(
                            `Batch ${batchNumber} stopped with exit code ${code}.`
                        )
                    );

                }

            }
        );

    });

}


async function main() {

    console.log('');
    console.log('======================================');
    console.log(' SYNTECH → SHOPIFY FULL SYNC');
    console.log('======================================');
    console.log('');

    console.log(
        'This will process all 2,838 Syntech products.'
    );

    console.log(
        'Products will be processed in 6 batches.'
    );

    console.log('');

    console.log(
        'Batch size: 500 products'
    );

    console.log(
        'Total batches: 6'
    );

    console.log('');


    for (
        let batchNumber = 1;
        batchNumber <= TOTAL_BATCHES;
        batchNumber++
    ) {

        await runBatch(
            batchNumber
        );

    }


    console.log('');
    console.log('======================================');
    console.log(' FULL SYNCHRONISATION COMPLETE');
    console.log('======================================');
    console.log('');

    console.log(
        'All 2,838 Syntech products have been processed.'
    );

    console.log('');

    console.log(
        'Syntech → Shopify sync finished successfully.'
    );

    console.log('');

}


main().catch(error => {

    console.error('');
    console.error('======================================');
    console.error(' FULL SYNC STOPPED');
    console.error('======================================');
    console.error('');

    console.error(
        error.message
    );

    console.error('');

    console.error(
        'The batch that failed was NOT automatically repeated.'
    );

    console.error(
        'You can fix the problem and restart from the affected batch.'
    );

    console.error('');

});


'use strict';

const axios = require('axios');

require('dotenv').config();


class SyntechClient {

    constructor() {

        this.fullFeedUrl =
            process.env.SYNTECH_FULL_FEED_URL ||
            '';

        this.updateFeedUrl =
            process.env.SYNTECH_UPDATE_FEED_URL ||
            '';
    }


    async downloadFeed(
        url,
        feedName
    ) {

        if (!url) {

            throw new Error(
                `${feedName} feed URL is not configured.`
            );
        }

        console.log('');
        console.log(
            `Downloading Syntech ${feedName} feed...`
        );

        try {

            const response =
                await axios.get(
                    url,
                    {
                        timeout:
                            120000,

                        responseType:
                            'text'
                    }
                );

            console.log(
                `${feedName} feed downloaded: ${response.data.length} characters`
            );

            return response.data;

        } catch (error) {

            if (
                error.response &&
                error.response.status === 429
            ) {

                throw new Error(
                    'Syntech rate limit reached (HTTP 429). ' +
                    'Stop requesting the feed and wait for the rate-limit window to reset.'
                );
            }

            if (
                error.response &&
                error.response.status === 403
            ) {

                throw new Error(
                    'Syntech returned HTTP 403. ' +
                    'The feed key may be blocked or access may be restricted.'
                );
            }

            throw error;
        }
    }


    async getFullFeed() {

        return this.downloadFeed(
            this.fullFeedUrl,
            'FULL'
        );
    }


    async getUpdateFeed() {

        return this.downloadFeed(
            this.updateFeedUrl,
            'UPDATE'
        );
    }
}


module.exports = {
    SyntechClient
};
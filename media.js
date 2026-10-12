'use strict';

const axios = require('axios');

async function getProductImages(
    shopify,
    productId
) {
    const data = await shopify.request(
        'GET',
        `/products/${productId}/images.json`,
        {
            params: {
                limit: 250
            }
        }
    );

    return data.images || [];
}

async function downloadImage(imageUrl) {
    console.log(
        `Downloading image: ${imageUrl}`
    );

    const response = await axios.get(
        imageUrl,
        {
            responseType: 'arraybuffer',
            timeout: 60000,
            maxContentLength: 25 * 1024 * 1024,
            headers: {
                'User-Agent':
                    'Mozilla/5.0'
            }
        }
    );

    const contentType =
        response.headers['content-type'] ||
        'image/jpeg';

    if (
        !contentType
            .toLowerCase()
            .startsWith('image/')
    ) {
        throw new Error(
            `URL did not return an image. Content-Type: ${contentType}`
        );
    }

    const base64 = Buffer
        .from(response.data)
        .toString('base64');

    return {
        attachment: base64,
        contentType
    };
}

function getFilename(imageUrl) {
    try {
        const url = new URL(imageUrl);

        let filename =
            url.pathname.split('/').pop();

        if (!filename) {
            filename = 'syntech-product.jpg';
        }

        filename = filename
            .replace(/[^a-zA-Z0-9._-]/g, '_');

        return filename;
    } catch {
        return 'syntech-product.jpg';
    }
}

async function addProductImage(
    shopify,
    productId,
    imageUrl
) {
    if (!imageUrl) {
        return null;
    }

    try {
        const image =
            await downloadImage(imageUrl);

        const data =
            await shopify.request(
                'POST',
                `/products/${productId}/images.json`,
                {
                    data: {
                        image: {
                            attachment:
                                image.attachment,
                            filename:
                                getFilename(imageUrl),
                            content_type:
                                image.contentType
                        }
                    }
                }
            );

        console.log(
            'Image uploaded successfully.'
        );

        return data.image || null;
    } catch (error) {
        console.error(
            `Image failed: ${imageUrl}`
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

        return null;
    }
}

async function addMissingImages(
    shopify,
    productId,
    imageUrls
) {
    if (
        !Array.isArray(imageUrls) ||
        imageUrls.length === 0
    ) {
        return 0;
    }

    const existingImages =
        await getProductImages(
            shopify,
            productId
        );

    const existingUrls =
        existingImages.map(image =>
            String(image.src || '')
                .split('?')[0]
                .trim()
        );

    let added = 0;

    for (const imageUrl of imageUrls) {
        const cleanUrl =
            String(imageUrl)
                .split('?')[0]
                .trim();

        if (!cleanUrl) {
            continue;
        }

        if (
            existingUrls.includes(cleanUrl)
        ) {
            console.log(
                `Image already exists: ${cleanUrl}`
            );

            continue;
        }

        const result =
            await addProductImage(
                shopify,
                productId,
                cleanUrl
            );

        if (result) {
            added++;

            if (result.src) {
                existingUrls.push(
                    String(result.src)
                        .split('?')[0]
                        .trim()
                );
            }
        }
    }

    return added;
}

module.exports = {
    getProductImages,
    downloadImage,
    addProductImage,
    addMissingImages
};
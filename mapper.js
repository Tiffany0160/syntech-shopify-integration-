'use strict';

function cleanText(value) {
    if (value === undefined || value === null) return '';
    return String(value).trim();
}

function cleanNumber(value, defaultValue = 0) {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }

    const cleaned = String(value)
        .replace(/R/gi, '')
        .replace(/\s/g, '')
        .replace(/,/g, '');

    const number = Number(cleaned);

    return Number.isFinite(number) ? number : defaultValue;
}

function cleanStock(value) {
    const stock = cleanNumber(value, 0);

    if (stock < 0) return 0;

    return Math.floor(stock);
}

function getFirstValue(...values) {
    for (const value of values) {
        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ''
        ) {
            return value;
        }
    }

    return '';
}

function extractImages(rawProduct) {
    const images = [];

    function addImage(value) {
        if (!value) return;

        if (Array.isArray(value)) {
            for (const item of value) {
                addImage(item);
            }
            return;
        }

        if (typeof value === 'object') {
            const url = getFirstValue(
                value.url,
                value.URL,
                value.href,
                value.Href,
                value.image,
                value.Image,
                value.src,
                value.Src
            );

            if (url) {
                addImage(url);
            }

            return;
        }

        const text = String(value).trim();

        if (!text) return;

        const parts = text
            .split(/\s*,\s*|\s*;\s*|\r?\n|\s*\|\s*/)
            .map(item => item.trim())
            .filter(Boolean);

        for (const part of parts) {
            if (
                part.startsWith('http://') ||
                part.startsWith('https://')
            ) {
                images.push(part);
            }
        }
    }

    // Syntech's actual FULL feed fields
    addImage(rawProduct.featured_image);
    addImage(rawProduct.all_images);

    if (rawProduct.additional_images) {
        addImage(rawProduct.additional_images.additional_image);
    }

    // Other possible image fields
    const possibleImageFields = [
        rawProduct.images,
        rawProduct.Images,
        rawProduct.image,
        rawProduct.Image,
        rawProduct.imageUrl,
        rawProduct.ImageUrl,
        rawProduct.imageURL,
        rawProduct.ImageURL,
        rawProduct.productImages,
        rawProduct.ProductImages,
        rawProduct.media,
        rawProduct.Media,
        rawProduct.picture,
        rawProduct.Picture
    ];

    for (const field of possibleImageFields) {
        addImage(field);
    }

    for (let i = 1; i <= 20; i++) {
        addImage(rawProduct[`image${i}`]);
        addImage(rawProduct[`Image${i}`]);
        addImage(rawProduct[`image_${i}`]);
        addImage(rawProduct[`Image_${i}`]);
    }

    return [
        ...new Set(
            images
                .map(url => String(url).trim())
                .filter(Boolean)
        )
    ];
}

function calculateSyntechStock(rawProduct) {
    /*
     * Syntech FULL XML feed uses:
     *
     * cptstock = Cape Town
     * jhbstock = Johannesburg
     * dbnstock = Durban
     *
     * Total available stock = all three branches added together.
     */

    const capeTown = cleanStock(rawProduct.cptstock);
    const johannesburg = cleanStock(rawProduct.jhbstock);
    const durban = cleanStock(rawProduct.dbnstock);

    const totalStock =
        capeTown +
        johannesburg +
        durban;

    return totalStock;
}

function mapSyntechProduct(rawProduct) {
    if (!rawProduct || typeof rawProduct !== 'object') {
        throw new Error(
            'Invalid Syntech product. Expected an object.'
        );
    }

    // -------------------------
    // SKU
    // -------------------------

    const sku = cleanText(
        getFirstValue(
            rawProduct.sku,
            rawProduct.SKU,
            rawProduct.partNumber,
            rawProduct.PartNumber,
            rawProduct.productCode,
            rawProduct.ProductCode,
            rawProduct.code,
            rawProduct.Code,
            rawProduct.itemCode,
            rawProduct.ItemCode,
            rawProduct.model,
            rawProduct.Model
        )
    );

    // -------------------------
    // Product name
    // -------------------------

    const title = cleanText(
        getFirstValue(
            rawProduct.name,
            rawProduct.Name,
            rawProduct.title,
            rawProduct.Title,
            rawProduct.productName,
            rawProduct.ProductName
        )
    );

    // -------------------------
    // Description
    // -------------------------

    const description = cleanText(
        getFirstValue(
            rawProduct.description,
            rawProduct.Description,
            rawProduct.descriptionHtml,
            rawProduct.DescriptionHtml,
            rawProduct.longDescription,
            rawProduct.LongDescription,
            rawProduct.details,
            rawProduct.Details
        )
    );

    // -------------------------
    // Price
    // -------------------------

    const price = cleanNumber(
        getFirstValue(
            rawProduct.rrp_incl,
            rawProduct.RRP_INCL,
            rawProduct.rrpIncl,
            rawProduct.RrpIncl,
            rawProduct.rrp,
            rawProduct.RRP,
            rawProduct.priceIncl,
            rawProduct.PriceIncl,
            rawProduct.price,
            rawProduct.Price
        ),
        0
    );

    // -------------------------
    // STOCK
    // -------------------------

    const stock = calculateSyntechStock(rawProduct);

    // -------------------------
    // Brand
    // -------------------------

    let vendor = '';

    if (rawProduct.attributes) {
        vendor = cleanText(
            getFirstValue(
                rawProduct.attributes.brand,
                rawProduct.attributes.Brand
            )
        );
    }

    if (!vendor) {
        vendor = cleanText(
            getFirstValue(
                rawProduct.brand,
                rawProduct.Brand,
                rawProduct.manufacturer,
                rawProduct.Manufacturer,
                rawProduct.vendor,
                rawProduct.Vendor
            )
        );
    }

    // -------------------------
    // Product type / category
    // -------------------------

    const productType = cleanText(
        getFirstValue(
            rawProduct.categories,
            rawProduct.category,
            rawProduct.Category,
            rawProduct.productType,
            rawProduct.ProductType,
            rawProduct.type,
            rawProduct.Type,
            rawProduct.department,
            rawProduct.Department
        )
    );

    // -------------------------
    // Images
    // -------------------------

    const images = extractImages(rawProduct);

    // -------------------------
    // Return mapped product
    // -------------------------

    return {
        sku,
        title: title || sku || 'Syntech Product',
        description,
        price,
        stock,
        vendor,
        productType,
        images,
        raw: rawProduct
    };
}

module.exports = {
    mapSyntechProduct,
    calculateSyntechStock
};
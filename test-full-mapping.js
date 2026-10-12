'use strict';

const { mapSyntechProduct } = require('./syntech/mapper');

const product = {
    sku: 'AHHSBK-10',

    name: 'Anycubic PLA High Speed Filament 1kg &#x2013; Pearl Black',

    price: 260,

    rrp_incl: 399,

    recommended_margin: 25.06,

    promo_price: '',
    promo_starts: '',
    promo_ends: '',

    cptstock: 48,
    jhbstock: 0,
    dbnstock: 0,

    nextshipmenteta: '',

    last_modified: '2026-09-30 09:55:14',

    url: 'https://www.syntech.co.za/product/anycubic-pla-high-speed-filament-1kg-pearl-black/',

    description:
        '<p><strong>Print up to 600 mm/s | Smooth, clog-free output | High toughness, low shrinkage | Compatible with standard and high-speed FDM printers | 1 kg spool</strong></p>',

    shortdesc: '',

    weight: 0,
    length: 0,
    width: 0,
    height: 0,

    featured_image:
        'https://www.syntech.co.za/wp-content/uploads/2026/09/AHHSBK-10_Anycubic-PLA-High-Speed-Filament-1kg-&#x2013;-Pearl-Black_wr_01.jpg',

    additional_images: {
        additional_image: [
            'https://www.syntech.co.za/wp-content/uploads/2026/09/AHHSBK-10_Anycubic-PLA-High-Speed-Filament-1kg-&#x2013;-Pearl-Black_wr_02.jpg',
            'https://www.syntech.co.za/wp-content/uploads/2026/09/AHHSBK-10_Anycubic-PLA-High-Speed-Filament-1kg-&#x2013;-Pearl-Black_wr_03.jpg',
            'https://www.syntech.co.za/wp-content/uploads/2026/09/AHHSBK-10_Anycubic-PLA-High-Speed-Filament-1kg-&#x2013;-Pearl-Black_wr_04.jpg'
        ]
    },

    all_images:
        'https://www.syntech.co.za/wp-content/uploads/2026/09/AHHSBK-10_Anycubic-PLA-High-Speed-Filament-1kg-&#x2013;-Pearl-Black_wr_01.jpg | https://www.syntech.co.za/wp-content/uploads/2026/09/AHHSBK-10_Anycubic-PLA-High-Speed-Filament-1kg-&#x2013;-Pearl-Black_wr_02.jpg | https://www.syntech.co.za/wp-content/uploads/2026/09/AHHSBK-10_Anycubic-PLA-High-Speed-Filament-1kg-&#x2013;-Pearl-Black_wr_03.jpg | https://www.syntech.co.za/wp-content/uploads/2026/09/AHHSBK-10_Anycubic-PLA-High-Speed-Filament-1kg-&#x2013;-Pearl-Black_wr_04.jpg',

    categories:
        'Lifestyle & home tech, 3D printing, 3D Printer Materials',

    categorytree:
        'Lifestyle & home tech > 3D printing > 3D Printer Materials',

    attributes: {
        brand: 'ANYCUBIC',
        warranty: 'None'
    }
};


console.log('');
console.log('======================================');
console.log(' LOCAL MAPPING TEST');
console.log('======================================');
console.log('');

const mapped = mapSyntechProduct(product);

console.log('SKU:', mapped.sku);
console.log('Name:', mapped.title);
console.log('Supplier cost: R', mapped.supplierPrice);
console.log('RRP: R', mapped.rrp);
console.log('Shopify price: R', mapped.price);
console.log('Stock:', mapped.stock);

console.log('');
console.log('Stock breakdown:');
console.log('Cape Town:', mapped.stockBreakdown.capeTown);
console.log('Johannesburg:', mapped.stockBreakdown.johannesburg);
console.log('Durban:', mapped.stockBreakdown.durban);

console.log('');
console.log('Brand:', mapped.brand);
console.log('Warranty:', mapped.warranty);
console.log('Category:', mapped.categoryTree);
console.log('Product URL:', mapped.url);

console.log('');
console.log('Images:', mapped.images.length);

mapped.images.forEach((image, index) => {
    console.log(`Image ${index + 1}:`, image);
});

console.log('');
console.log('======================================');
console.log(' CHECKS');
console.log('======================================');
console.log('');

let passed = true;

if (mapped.sku === 'AHHSBK-10') {
    console.log('PASS: SKU');
} else {
    console.log('FAIL: SKU');
    passed = false;
}

if (mapped.title && mapped.title.length > 0) {
    console.log('PASS: Product name');
} else {
    console.log('FAIL: Product name');
    passed = false;
}

if (mapped.rrp === 399) {
    console.log('PASS: RRP');
} else {
    console.log('FAIL: RRP');
    passed = false;
}

if (mapped.price === 399) {
    console.log('PASS: Shopify price');
} else {
    console.log('FAIL: Shopify price');
    passed = false;
}

if (mapped.stock === 48) {
    console.log('PASS: Stock');
} else {
    console.log('FAIL: Stock');
    passed = false;
}

if (mapped.images.length === 4) {
    console.log('PASS: Images');
} else {
    console.log('FAIL: Images');
    passed = false;
}

if (mapped.brand === 'ANYCUBIC') {
    console.log('PASS: Brand');
} else {
    console.log('FAIL: Brand');
    passed = false;
}

console.log('');
console.log('======================================');

if (passed) {
    console.log('LOCAL MAPPING TEST SUCCESSFUL');
} else {
    console.log('LOCAL MAPPING TEST FAILED');
}

console.log('======================================');
console.log('');
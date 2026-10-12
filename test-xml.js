'use strict';

const fs = require('fs');

const {
    parseSyntechXML
} = require('./syntech/parser');

const filePath = './test-data/sample.xml';

console.log('');
console.log('======================================');
console.log(' XML FILE TEST');
console.log('======================================');
console.log('');

console.log('Reading:', filePath);

const xml = fs.readFileSync(
    filePath,
    'utf8'
);

console.log('');
console.log('XML characters:', xml.length);
console.log('');
console.log('XML content:');
console.log(xml);
console.log('');

const data = parseSyntechXML(xml);

console.log('Parsed result:');
console.log(
    JSON.stringify(
        data,
        null,
        2
    )
);

console.log('');
console.log('XML parsed successfully!');
console.log('');
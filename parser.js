'use strict';

const {
    XMLParser
} = require('fast-xml-parser');

function parseSyntechXML(xml) {

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        trimValues: true,
        parseTagValue: true,
        isArray: (tagName) => {
            return tagName === 'product';
        }
    });

    return parser.parse(xml);
}

module.exports = {
    parseSyntechXML
};
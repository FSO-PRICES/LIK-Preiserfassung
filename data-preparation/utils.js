"use strict";
var encoding = require('encoding');
var _ = require('lodash');
function bufferToCells(buffer) {
    var s = encoding.convert(buffer, 'UTF-8', 'Latin_1').toString();
    var lines = s.split(/\r?\n/); // s.split('\u000a'); This is incompatible with dos format
    return _.drop(lines.filter(function (x) { return x.length; })).map(function (x) { return x.split(';'); });
}
exports.bufferToCells = bufferToCells;

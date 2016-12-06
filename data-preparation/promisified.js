"use strict";
var fs = require('fs');
var bluebird = require('bluebird');
exports.readFile = bluebird.promisify(fs.readFile);
exports.writeFile = bluebird.promisify(fs.writeFile);

"use strict";
var request = require('request-promise');
var _ = require('lodash');
var docuri = require('docuri');
var promisified_1 = require('./promisified');
var models_1 = require('../common/models');
var _a = process.argv, username = _a[2], password = _a[3];
var baseUrl = "http://" + username + ":" + password + "@localhost:5986";
var pmsUri = docuri.route(models_1.pmsUriRoute);
var preismeldungReferenceUri = docuri.route(models_1.preismeldungReferenceUriRoute);
var filenameRegex = /erheber__(.*?)\.json/;
promisified_1.readFile('./warenkorb/flat.json')
    .then(function (x) { return JSON.parse(x.toString()); })
    .then(function (warenkorbProducts) { return promisified_1.readdir('./presta/').then(function (files) { return files.filter(function (x) { return !!x.match(filenameRegex); }); }).then(function (files) { return ({ warenkorbProducts: warenkorbProducts, files: files }); }); })
    .then(function (x) {
    return x.files.map(function (filename) {
        var username = filename.match(filenameRegex)[1];
        var url = baseUrl + "/" + username;
        return request.del(url)
            .catch(function () { })
            .then(function () { return request.put(url); })
            .then(function () { return request({
            url: url + "/_security",
            method: 'PUT',
            json: {
                admins: { names: [username], roles: [] },
                members: { names: [], 'roles': [] } }
        }); })
            .then(function () { return promisified_1.readFile("./presta/erheber__" + username + ".json"); })
            .then(function (buffer) {
            var data = JSON.parse(buffer.toString());
            var erheber = _.assign({}, data.erheber, { _id: 'erheber' });
            var preismeldestellen = data.preismeldestellen.map(function (x) { return (_.assign({}, x, { _id: pmsUri({ pmsNummer: x.pmsNummer }) })); });
            var products = data.preismeldungen.map(function (x) { return _.assign(x, { _id: preismeldungReferenceUri({ pmsNummer: x.pmsNummer, epNummer: x.epNummer, laufnummer: x.laufnummer }) }); });
            var warenkorb = {
                _id: 'warenkorb',
                products: x.warenkorbProducts
            };
            return request({
                url: url + "/_bulk_docs",
                method: 'POST',
                json: {
                    docs: [erheber].concat(preismeldestellen, products, [warenkorb])
                }
            });
        });
    });
});

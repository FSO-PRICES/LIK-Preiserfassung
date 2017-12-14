import * as request from 'request-promise';

const [, , username, password] = process.argv;

const url = `http://${username}:${password}@localhost:5984/test-couch`;

request
    .del(url)
    .catch(() => {})
    .then(() => request.put(url))
    .then(() => {
        const json = {
            _id: 'pms_Manor',
            name: 'Manor',
            priceReports: [{ id: 1, name: 'Milk', price: 1.0 }, { id: 2, name: 'Bread', price: 1.73 }],
        };
        return request({
            url,
            method: 'POST',
            json,
        });
    })
    .then(() => {
        const json = {
            _id: 'pm_123',
            foo: 'bar',
        };
        return request({
            url,
            method: 'POST',
            json,
        });
    })
    .then(() => {
        const json = {
            _id: 'pm_234',
            foo: 'barxxx',
        };
        return request({
            url,
            method: 'POST',
            json,
        });
    });

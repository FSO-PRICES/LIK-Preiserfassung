import * as bluebird from 'bluebird';
import * as request from 'request-promise';

const [, , username, password] = process.argv;

const url = `http://${username}:${password}@localhost:5986/_users`;

const users = [
    'marie_cretin',
    'alphonse_dupont',
    'pierrette_dupont',
    'germaine_exemple',
    'patrick_muster',
    'petra_muster',
    'hans_mueller',
    'hansueli_mueller',
    'nicole_schmidt',
    'pierrinne_tabouret',
];


bluebird.all(
    users.map(x => request({
        url,
        method: 'POST',
        json: {
            _id: `org.couchdb.user:${x}`,
            name: x,
            roles: [],
            type: 'user',
            password: 'secret'
        }
    })))
    .then(() => console.log('done!'));

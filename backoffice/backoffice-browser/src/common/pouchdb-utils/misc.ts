import { Observable } from 'rxjs/Observable';
import * as bluebird from 'bluebird';

import { getLocalDatabase, getSettings, dbNames } from './database';

function setCouchLoginTime(timestamp: number) {
    return localStorage.setItem('couchdb_lastLoginTime', timestamp.toString());
}

export function loginToDatabase(credentials: { username: string; password: string }): Promise<PouchDB.Database<{}>> {
    return getSettings().then(settings => {
        const couch = new PouchDB(`${settings.serverConnection.url}/${dbNames.users}`);
        const login = bluebird.promisify((couch as any).login, { context: couch }) as Function;

        return login(credentials.username, credentials.password).then(x => {
            setCouchLoginTime(+new Date());
            return couch;
        }) as any;
    });
}

export function checkServerConnection() {
    return Observable.fromPromise(getSettings()).flatMap(settings =>
        Observable.ajax({
            url: settings.serverConnection.url,
            method: 'GET',
            crossDomain: true,
        })
    );
}

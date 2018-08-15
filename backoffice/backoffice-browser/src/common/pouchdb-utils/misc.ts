import { Observable } from 'rxjs/Observable';
import * as bluebird from 'bluebird';
import PouchDB from './pouchdb';

import { Models as P, preismeldungId } from 'lik-shared';

import { getLocalDatabase, getSettings, dbNames, downloadDatabaseAsync, uploadDatabaseAsync } from './database';
import { getDocumentByKeyFromDb } from './documents';
import { environment } from '../../environments/environment';

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

export async function getAllPreismeldungenStatus() {
    await downloadDatabaseAsync(dbNames.preismeldungen_status);
    const db = await getLocalDatabase(dbNames.preismeldungen_status);
    const currentPreismeldungenStatus = await getDocumentByKeyFromDb<P.PreismeldungenStatus>(
        db,
        'preismeldungen_status'
    );
    return currentPreismeldungenStatus;
}

export async function updateMissingPreismeldungenStatus(preismeldungen: P.Preismeldung[]) {
    await downloadDatabaseAsync(dbNames.preismeldungen_status);
    const settings = await getSettings();
    const db = await getLocalDatabase(dbNames.preismeldungen_status);
    const currentPreismeldungenStatus = await getDocumentByKeyFromDb<P.PreismeldungenStatus>(
        db,
        'preismeldungen_status'
    );
    let count = 0;
    const newStatus =
        environment.masterErhebungsorgannummer === settings.general.erhebungsorgannummer
            ? P.PreismeldungStatus['geprüft']
            : P.PreismeldungStatus['ungeprüft'];
    preismeldungen.forEach(pm => {
        if (!!pm.uploadRequestedAt && currentPreismeldungenStatus.statusMap[pm._id] == null) {
            count++;
            currentPreismeldungenStatus.statusMap[pm._id] = newStatus;
        }
    });
    if (count > 0) {
        await db.put(currentPreismeldungenStatus);
        await uploadDatabaseAsync(dbNames.preismeldungen_status);
    }
    return { currentPreismeldungenStatus, count };
}

export async function getMissingPreismeldungenStatusCount(preismeldungen: P.Preismeldung[]) {
    await downloadDatabaseAsync(dbNames.preismeldungen_status);
    const db = await getLocalDatabase(dbNames.preismeldungen_status);
    const currentPreismeldungenStatus = await getDocumentByKeyFromDb<P.PreismeldungenStatus>(
        db,
        'preismeldungen_status'
    );
    let count = 0;
    preismeldungen.forEach(pm => {
        if (!!pm.uploadRequestedAt && currentPreismeldungenStatus.statusMap[pm._id] == null) {
            count++;
        }
    });
    return count;
}

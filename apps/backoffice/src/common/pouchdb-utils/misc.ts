import * as bluebird from 'bluebird';
import { from } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { flatMap } from 'rxjs/operators';
import PouchDB from './pouchdb';

import { Models as P } from '@lik-shared';

import { environment } from '../../environments/environment';
import { dbNames, downloadDatabaseAsync, getLocalDatabase, getSettings, uploadDatabaseAsync } from './database';
import { getDocumentByKeyFromDb } from './documents';

function setCouchLoginTime(timestamp: number) {
    return localStorage.setItem('couchdb_lastLoginTime', timestamp.toString());
}

export async function loginToDatabase(credentials: {
    username: string;
    password: string;
}): Promise<PouchDB.Database<{}>> {
    const settings = await getSettings();
    const couch = new PouchDB(`${settings.serverConnection.url}/${dbNames.users}`, { skip_setup: true });

    await couch.logIn(credentials.username, credentials.password);

    setCouchLoginTime(+new Date());
    await couch.getSession();
    return couch;
}

export async function logoutOfDatabase(): Promise<PouchDB.Database<{}>> {
    const settings = await getSettings();
    const couch = new PouchDB(`${settings.serverConnection.url}/${dbNames.users}`, { skip_setup: true });

    couch.logOut(() => {});

    return couch;
}

export function checkServerConnection() {
    return from(getSettings()).pipe(
        flatMap(settings =>
            ajax({
                url: settings.serverConnection.url,
                method: 'GET',
                crossDomain: true,
                timeout: 10000,
            }),
        ),
    );
}

export async function getAllPreismeldungenStatus() {
    await downloadDatabaseAsync(dbNames.preismeldungen_status);
    const db = await getLocalDatabase(dbNames.preismeldungen_status);
    const currentPreismeldungenStatus = await getDocumentByKeyFromDb<P.PreismeldungenStatus>(
        db,
        'preismeldungen_status',
    );
    return currentPreismeldungenStatus;
}

export async function updateMissingPreismeldungenStatus(preismeldungen: P.Preismeldung[]) {
    await downloadDatabaseAsync(dbNames.preismeldungen_status);
    const settings = await getSettings();
    const db = await getLocalDatabase(dbNames.preismeldungen_status);
    const currentPreismeldungenStatus = await getDocumentByKeyFromDb<P.PreismeldungenStatus>(
        db,
        'preismeldungen_status',
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
        'preismeldungen_status',
    );
    let count = 0;
    preismeldungen.forEach(pm => {
        if (!!pm.uploadRequestedAt && currentPreismeldungenStatus.statusMap[pm._id] == null) {
            count++;
        }
    });
    return count;
}

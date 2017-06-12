import { Observable } from 'rxjs/Observable';
import { assign, flatten, some } from 'lodash';

import { Models as P } from 'lik-shared';

import { dropDatabase, getDatabase, putUserToDatabase, dbNames, getUserDatabaseName, getAllDocumentsForPrefixFromDb, clearRev, getDatabaseAsObservable, getAllDocumentsForKeysFromDb, getDocumentByKeyFromDb } from '../effects/pouchdb-utils';

export interface UserDbStructure {
    preiserheber: P.Erheber;
    preismeldestellen: P.Preismeldestelle[];
    preismeldungen: P.Preismeldung[];
    warenkorb: P.WarenkorbDocument;
    dbSchemaVersion: P.DbSchemaVersion;
    erhebungsmonat: P.Erhebungsmonat;
}

/**
 * Create userDbs for given preiserheber IDs. Adding the warenkorb, current erhebungsmonat (if any), db-schema-version, preismeldestellen, preismeldungen and userDbId
 * Returns null if no error has occured, otherwise returns a string describing the error.
 */
export function createUserDbs(preiserheberIds: string[]) {
    return getDatabaseAsObservable(dbNames.warenkorb)
        .flatMap(warenkorbDb => warenkorbDb.get('warenkorb').then(doc => clearRev<P.WarenkorbDocument>(doc)).then(warenkorb => ({ warenkorb })))
        .flatMap(data => getDatabase(dbNames.preismeldung).then(preismeldungDb => preismeldungDb.get('erhebungsmonat').then(doc => clearRev<P.Erhebungsmonat>(doc)).catch(() => null).then(erhebungsmonat => assign(data, { erhebungsmonat }))))
        .map(data => assign(data, { dbSchemaVersion: { _id: 'db-schema-version', version: P.ExpectedDbSchemaVersion } }))
        .flatMap(mainData => Observable.from(preiserheberIds)
            .flatMap(preiserheberId => getDatabase(dbNames.preiserheber).then(db => db.get(preiserheberId).then(doc => ({ preiserheber: clearRev<P.Erheber>(doc) }))))
            .flatMap(preiserheberData => getPmsNummers(preiserheberData.preiserheber._id).then(pmsNummers => assign(preiserheberData, { pmsNummers })))
            // Create a collection of user db creation observables, false means that no user db was created
            .map(preiserheberData => preiserheberData.pmsNummers.length === 0 ?
                // Do nothing if no preiszuweisung was assigned
                Observable.of(false) :
                // For each preiserheber with preiszuweisung create their own user db
                Observable.fromPromise(dropDatabase(getUserDatabaseName(preiserheberData.preiserheber._id)))
                    .flatMap(() => getPreismeldestellen(preiserheberData.pmsNummers).map(preismeldestellen => ({ preismeldestellen })))
                    .flatMap(pmsData => getPreismeldungen(preiserheberData.pmsNummers).map(preismeldungen => assign(pmsData, { preismeldungen })))
                    .map(pmsData => assign({}, mainData, preiserheberData, pmsData))
                    .flatMap(payload => getDatabase(getUserDatabaseName(preiserheberData.preiserheber._id)).then(db => db.bulkDocs({ docs: prepareDocs(payload) } as any)).then(() => payload))
                    .flatMap(({ preiserheber }) => putUserToDatabase(getUserDatabaseName(preiserheber._id), { members: { names: [preiserheber._id] } }))
                    .mapTo(true)
            )
        )
        // Return an error if no user db was created
        .combineAll((...userDbsCreated) => !some(userDbsCreated) ? 'Es gibt keine zugewiesene preismeldestellen' : null)
        // Handle other kind of errors
        .catch(error => Observable.of(getErrorMessage(error)))
}

/**
 * Create userDb for given preiserheber. Adding the warenkorb, current erhebungsmonat (if any), db-schema-version and userDbId
 * Returns null if no error has occured, otherwise returns a string describing the error.
 */
export function createUserDb(preiserheber: P.Erheber) {
    return getDatabaseAsObservable(dbNames.warenkorb)
        .flatMap(warenkorbDb => warenkorbDb.get('warenkorb').then(doc => clearRev<P.WarenkorbDocument>(doc)).then(warenkorb => ({ warenkorb })).catch(() => ({})))
        .flatMap(data => getDatabase(dbNames.preismeldung).then(preismeldungDb => preismeldungDb.get('erhebungsmonat').then(doc => clearRev<P.Erhebungsmonat>(doc)).catch(() => null).then(erhebungsmonat => assign(data, { erhebungsmonat }))))
        .map(data => assign(data, { preiserheber, dbSchemaVersion: { _id: 'db-schema-version', version: P.ExpectedDbSchemaVersion } }))
        .flatMap(data => getDatabase(getUserDatabaseName(preiserheber._id)).then(db => db.bulkDocs({ docs: prepareDocs(data) } as any)))
        .mapTo(null)
        .catch(error => Observable.of(getErrorMessage(error)));
}

/**
 * Update userDb with given preiserheber.
 * Returns null if no error has occured, otherwise returns a string describing the error.
 */
export function updateUserDb(preiserheber: P.Erheber) {
    return getDatabaseAsObservable(getUserDatabaseName(preiserheber._id))
        .flatMap(db => db.bulkDocs({ docs: prepareDocs({ preiserheber }) } as any))
        .mapTo(null)
        .catch(error => Observable.of(getErrorMessage(error)));
}

function getErrorMessage(error: { name: string, message: string, stack: string }) {
    return error.message;
}

function prepareDocs(docs: Partial<UserDbStructure>) {
    const payload: any[] = [assign({}, docs.preiserheber, { _id: 'preiserheber' }), ...(docs.preismeldestellen || []), ...(docs.preismeldungen || []), createUserDbIdDoc()]
    if (!!docs.warenkorb) {
        payload.push(docs.warenkorb);
    }
    if (!!docs.dbSchemaVersion) {
        payload.push(docs.dbSchemaVersion)
    }
    if (!!docs.erhebungsmonat) {
        payload.push(docs.erhebungsmonat);
    }
    return payload;
}

function getPreismeldestellen(pmsNummers: string[]) {
    return getDatabaseAsObservable(dbNames.preismeldestelle)
        .flatMap(db => getAllDocumentsForKeysFromDb(db, pmsNummers.map(x => `pms/${x}`)));
}

function getPreismeldungen(pmsNummers: string[]) {
    return getDatabaseAsObservable(dbNames.preismeldung)
        .flatMap(db =>
            Observable.from(pmsNummers.map(pmsNummer => getAllDocumentsForPrefixFromDb(db, `pm-ref/${pmsNummer}`) as Promise<P.Preismeldung[]>))
                .combineAll<Promise<P.Preismeldung[]>, P.Preismeldung[][]>()
                .map(preismeldungenArray => flatten(preismeldungenArray).map(pm => clearRev<P.PreismeldungReference>(pm)))
        );
}

function getPmsNummers(preiserheberId: string) {
    return getDatabase(dbNames.preiszuweisung).then(preiszuweisungDb => getDocumentByKeyFromDb<P.Preiszuweisung>(preiszuweisungDb, preiserheberId))
        .then(preiszuweisung => preiszuweisung.preismeldestellenNummern)
        .catch(() => [])
}

function createUserDbIdDoc() {
    return {
        _id: 'user-db-id',
        value: new Date().getTime()
    }
}

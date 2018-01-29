import { Observable, Observer } from 'rxjs';
import { assign, flatten, some } from 'lodash';
import * as moment from 'moment';

import {
    Models as P,
    allPropertiesExeceptIdAndRev,
    preismeldungRefId,
    preismeldungId,
    pmsSortId,
    preismeldestelleId,
} from 'lik-shared';

import {
    dropRemoteCouchDatabase,
    getDatabase,
    putUserToDatabase,
    dbNames,
    getUserDatabaseName,
    getAllDocumentsForPrefix,
    getAllDocumentsForPrefixFromDb,
    clearRev,
    getDatabaseAsObservable,
    getAllDocumentsForKeysFromDb,
    getDocumentByKeyFromDb,
    getSettings,
    getAllDocumentsFromDb,
    getAllIdRevsForPrefixFromDb,
    listAllDatabases,
} from '../effects/pouchdb-utils';

export interface UserDbStructure {
    preiserheber: P.Erheber;
    preismeldestellen: P.Preismeldestelle[];
    preismeldungen: P.Preismeldung[];
    warenkorb: P.WarenkorbDocument;
    dbSchemaVersion: P.DbSchemaVersion;
    erhebungsmonat: P.Erhebungsmonat;
    erhebungsorgannummer: P.DbErhebungsorgannummer;
}

export function createUserDbs(preiserheberIds: string[]) {
    console.log('DEBUG: IN CREATEUSERDBS');
    return backupAndDeleteAllMonthDatabases()
        .do(x => console.log('DEBUG: AFTER DELETE MONTH DBS'))
        .flatMap(() => _fetchStandardUserDbData())
        .do(x => console.log('DEBUG: AFTER FETCHING STANDARD USER DATA', x))
        .flatMap(data =>
            getDatabase(dbNames.preiserheber).then(db =>
                getAllDocumentsFromDb<P.Erheber>(db).then(preiserhebers => ({ data, preiserhebers }))
            )
        )
        .do(x => console.log('DEBUG: AFTER GETTING PREISERHEBER DATA', x))
        .flatMap(
            x =>
                x.preiserhebers.length === 0
                    ? Observable.of(null)
                    : Observable.forkJoin(
                          x.preiserhebers.map(preiserheber => _createUserDb(assign({}, x.data, { preiserheber })))
                      )
        )
        .do(x => console.log('DEBUG: AFTER _CREATEUSERDB'));
}

function backupAndDeleteAllMonthDatabases() {
    return listAllDatabases()
        .map(dbs => dbs.filter(db => db.startsWith('user_') || db === dbNames.orphaned_erfasste_preismeldungen))
        .flatMap(
            dbs =>
                dbs.length === 0
                    ? Observable.of({})
                    : Observable.forkJoin(
                          dbs.map(dbName =>
                              backupAndDeleteDatabase(dbName, `backup_${dbName}_${moment().format('YYYYMMDDhhmmss')}`)
                          )
                      )
        );
}

export function createUserDb(preiserheber: P.Erheber) {
    return _fetchStandardUserDbData()
        .flatMap(data => _createUserDb(assign({}, data, { preiserheber })))
        .flatMap(error => (!!error ? Observable.of(error) : updateZuweisung(preiserheber.username, []).mapTo(null)));
}

type StandardUserDbData = {
    preiserheber: P.Erheber;
    warenkorb: P.WarenkorbDocument;
    erhebungsmonat: P.Erhebungsmonat;
    erhebungsorgannummer: P.DbErhebungsorgannummerProperties;
};

function _createUserDb({ preiserheber, warenkorb, erhebungsmonat, erhebungsorgannummer }: StandardUserDbData) {
    console.log(`DEBUG: CREATE USER DB ${preiserheber.username}`);
    const standardDocs = [
        assign({}, preiserheber, { _id: 'preiserheber', _rev: undefined }),
        createUserDbIdDoc(),
        warenkorb,
        erhebungsmonat,
        erhebungsorgannummer,
        { _id: 'db-schema-version', version: P.ExpectedDbSchemaVersion },
    ];

    return getPmsNummers(preiserheber._id)
        .flatMap(pmsNummers =>
            getPreismeldestellen(pmsNummers).map(preismeldestellen => ({ pmsNummers, preismeldestellen }))
        )
        .flatMap(x =>
            getPreismeldungen(x.pmsNummers).map(preismeldungen => [
                ...x.preismeldestellen,
                ...preismeldungen,
                ...standardDocs,
            ])
        )
        .flatMap(data =>
            getDatabaseAsObservable(getUserDatabaseName(preiserheber.username)).flatMap(db =>
                db.bulkDocs({ docs: data } as any)
            )
        )
        .mapTo(<string>null)
        .catch(error => Observable.of(getErrorMessage(error)));
}

function _fetchStandardUserDbData() {
    return getDatabaseAsObservable(dbNames.warenkorb)
        .flatMap(warenkorbDb =>
            warenkorbDb.get('warenkorb').then(doc => ({ warenkorb: clearRev<P.WarenkorbDocument>(doc) }))
        )
        .flatMap(data =>
            getDatabase(dbNames.preismeldung).then(preismeldungDb =>
                preismeldungDb
                    .get('erhebungsmonat')
                    .then(doc => assign(data, { erhebungsmonat: clearRev<P.Erhebungsmonat>(doc) }))
            )
        )
        .flatMap(data =>
            getSettings().then(settings =>
                assign(data, {
                    erhebungsorgannummer: { _id: 'erhebungsorgannummer', value: settings.general.erhebungsorgannummer },
                })
            )
        );
}

function createPmsDocsBasedOnZuweisung(
    preiserheberId: string,
    currentPreismeldestellenNummern: string[],
    newPreismeldestellenNummern: string[]
) {
    const toCreate = newPreismeldestellenNummern.filter(n => !currentPreismeldestellenNummern.some(c => c === n));
    const toRemove = currentPreismeldestellenNummern.filter(c => !newPreismeldestellenNummern.some(n => n === c));

    const preiserheberId$ = getDatabaseAsObservable(getUserDatabaseName(preiserheberId))
        .publishReplay(1)
        .refCount();

    return (
        getDatabaseAsObservable(dbNames.preismeldestelle)
            // 'pms_' records to be created or deleted from user db
            .flatMap(db =>
                getAllDocumentsForKeysFromDb<P.Preismeldestelle>(db, toCreate.map(x => preismeldestelleId(x)))
            )
            .flatMap(preismeldestellen =>
                getDatabaseAsObservable(getUserDatabaseName(preiserheberId))
                    .flatMap(db => getAllIdRevsForPrefixFromDb(db, preismeldestelleId()))
                    .map(existingPmsRecords => ({ preismeldestellen, existingPmsRecords }))
            )
            .map(x => {
                const pmsToCreate = toCreate
                    .map(y => x.preismeldestellen.filter(z => !!z).find(z => z.pmsNummer === y))
                    .map(pms => clearRev<P.CouchProperties>(pms));
                const pmsToRemove = toRemove
                    .map(y => x.existingPmsRecords.find(z => z._id === preismeldestelleId(y)))
                    .map(pms => assign({}, pms, { _deleted: true }));
                return [...pmsToCreate, ...pmsToRemove];
            })
            // 'pm-ref_' records to be created in user db
            .flatMap(docs => getDatabaseAsObservable(dbNames.preismeldung).map(db => ({ docs, db })))
            .flatMap(
                x =>
                    !toCreate.length
                        ? Observable.of(x.docs)
                        : Observable.forkJoin(
                              toCreate.map(pmsNummer =>
                                  Observable.from(
                                      getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(
                                          x.db,
                                          preismeldungRefId(pmsNummer)
                                      )
                                  )
                              )
                          )
                              .map(preismeldungenArray =>
                                  flatten(preismeldungenArray).map(pm => clearRev<P.PreismeldungReference>(pm))
                              )
                              .map(pmRefDocs => [...pmRefDocs, ...x.docs])
            )
            // 'pm_' and 'pm-sort_' records to be created in user db (sourced from backup db) and deleted from backup db
            .flatMap(
                docs =>
                    !toCreate.length
                        ? Observable.of({ forUserDb: docs, forBackupDb: [] })
                        : getDatabaseAsObservable(dbNames.orphaned_erfasste_preismeldungen).flatMap(db =>
                              Observable.forkJoin([
                                  ...toCreate.map(pmsNummer =>
                                      Observable.from(
                                          getAllDocumentsForPrefixFromDb<P.Preismeldung>(db, preismeldungId(pmsNummer))
                                      )
                                  ),
                                  ...toCreate.map(pmsNummer =>
                                      Observable.from(
                                          getAllDocumentsForPrefixFromDb<P.Preismeldung>(db, pmsSortId(pmsNummer))
                                      )
                                  ),
                              ])
                                  .map(preismeldungenArray => flatten(preismeldungenArray))
                                  .map(pmDocs => ({
                                      forUserDb: [...docs, ...pmDocs.map(pm => clearRev<P.CouchProperties>(pm))],
                                      forBackupDb: pmDocs.map(p => ({ _id: p._id, _rev: p._rev, _deleted: true })),
                                  }))
                          )
            )
            // 'pm-ref_' records to be deleted from user db
            .flatMap(
                docs =>
                    !toRemove.length
                        ? Observable.of(docs)
                        : getDatabaseAsObservable(getUserDatabaseName(preiserheberId)).flatMap(db =>
                              Observable.forkJoin(
                                  toRemove.map(pmsNummer =>
                                      Observable.from(getAllIdRevsForPrefixFromDb(db, preismeldungRefId(pmsNummer)))
                                  )
                              )
                                  .map(preismeldungenArray =>
                                      flatten(preismeldungenArray).map(pm => assign({}, pm, { _deleted: true }))
                                  )
                                  .map(pmRefDocs => ({
                                      forUserDb: [...pmRefDocs, ...docs.forUserDb],
                                      forBackupDb: docs.forBackupDb,
                                  }))
                          )
            )
            // 'pm_' records to be deleted from user db _and_ 'pm' records to be created in backup db
            .flatMap(
                docs =>
                    !toRemove.length
                        ? Observable.of(docs)
                        : getDatabaseAsObservable(getUserDatabaseName(preiserheberId)).flatMap(db =>
                              Observable.forkJoin([
                                  ...toRemove.map(pmsNummer =>
                                      Observable.from(
                                          getAllDocumentsForPrefixFromDb<P.Preismeldung>(db, preismeldungId(pmsNummer))
                                      )
                                  ),
                                  ...toRemove.map(pmsNummer =>
                                      Observable.from(
                                          getAllDocumentsForPrefixFromDb<P.Preismeldung>(db, pmsSortId(pmsNummer))
                                      )
                                  ),
                              ])
                                  .map(preismeldungenArray => flatten(preismeldungenArray))
                                  .map(preismeldungen => ({
                                      forUserDb: [
                                          ...docs.forUserDb,
                                          ...preismeldungen.map(p => ({ _id: p._id, _rev: p._rev, _deleted: true })),
                                      ],
                                      forBackupDb: [
                                          ...docs.forBackupDb,
                                          ...preismeldungen.map(p => assign(p, { _rev: undefined })),
                                      ],
                                  }))
                          )
            )
    );
}

function assignUndefinedRevIfNotInList(doc: P.CouchProperties, list: P.CouchProperties[]) {
    const item = list.find(i => i._id === doc._id);
    const _rev = !!item ? item._rev : undefined;
    return assign({}, doc, { _rev });
}

export function updateUserAndZuweisungDb(preiserheber: P.Erheber, currentPrieszuweisung: P.Preiszuweisung) {
    return updateZuweisung(preiserheber._id, currentPrieszuweisung.preismeldestellenNummern)
        .flatMap(() => getDatabaseAsObservable(getUserDatabaseName(preiserheber._id)))
        .flatMap(db =>
            getAllDocumentsForPrefixFromDb<P.Preismeldestelle>(db, preismeldestelleId()).then(preismeldestellen => ({
                db,
                preismeldestellen,
            }))
        )
        .flatMap(x =>
            createPmsDocsBasedOnZuweisung(
                preiserheber._id,
                x.preismeldestellen.map(p => p.pmsNummer),
                currentPrieszuweisung.preismeldestellenNummern
            ).map(docs => assign(x, { docs }))
        )
        .flatMap(x =>
            x.db
                .get('preiserheber')
                .then(doc => assign(x, { preiserheber: assign({}, doc, allPropertiesExeceptIdAndRev(preiserheber)) }))
        )
        .flatMap(x => x.db.bulkDocs([...x.docs.forUserDb, x.preiserheber]).then(() => x.docs.forBackupDb))
        .flatMap(docsForBackupDb =>
            getDatabaseAsObservable(dbNames.orphaned_erfasste_preismeldungen).flatMap(db =>
                db.bulkDocs(docsForBackupDb)
            )
        )
        .mapTo(<string>null)
        .catch(error => Observable.of(getErrorMessage(error)));
}

function updateZuweisung(preiserheberId: string, preismeldestellenNummern: string[]) {
    return getDatabaseAsObservable(dbNames.preiszuweisung)
        .flatMap(db =>
            db
                .get(preiserheberId)
                .catch(() => ({ _id: preiserheberId, preiserheberId }))
                .then(preiszuweisung => ({ preiszuweisung, db }))
        )
        .flatMap(({ preiszuweisung, db }) => db.put(assign(preiszuweisung, { preismeldestellenNummern })));
}

function getErrorMessage(error: { name: string; message: string; stack: string }) {
    return error.message;
}

function getPreismeldestellen(pmsNummers: string[]) {
    return getDatabaseAsObservable(dbNames.preismeldestelle)
        .flatMap(db => getAllDocumentsForKeysFromDb<P.Preismeldestelle>(db, pmsNummers.map(x => preismeldestelleId(x))))
        .map(preismeldestellen => preismeldestellen.map(pm => clearRev<P.Preismeldestelle>(pm)));
}

function getPreismeldungen(pmsNummers: string[]) {
    return getDatabaseAsObservable(dbNames.preismeldung)
        .flatMap(
            db =>
                !pmsNummers.length
                    ? Observable.of([])
                    : Observable.forkJoin(
                          pmsNummers.map(pmsNummer =>
                              Observable.from(
                                  getAllDocumentsForPrefixFromDb<P.Preismeldung>(db, preismeldungRefId(pmsNummer))
                              )
                          )
                      )
        )
        .map(preismeldungenArray => flatten(preismeldungenArray).map(pm => clearRev<P.PreismeldungReference>(pm)));
}

function getPmsNummers(preiserheberId: string) {
    return getDatabaseAsObservable(dbNames.preiszuweisung)
        .flatMap(preiszuweisungDb =>
            getDocumentByKeyFromDb<P.Preiszuweisung>(preiszuweisungDb, preiserheberId).catch(() => ({
                preismeldestellenNummern: <string[]>[],
            }))
        )
        .map(preiszuweisung => preiszuweisung.preismeldestellenNummern);
}

function backupAndDeleteDatabase(oldDatabaseName, newDatabaseName) {
    // return getDatabaseAsObservable(oldDatabaseName)
    //     .flatMap(oldDb => getDatabaseAsObservable(newDatabaseName).map(newDb => ({ oldDb, newDb })))
    //     .flatMap(x => Observable.create((observer: Observer<{}>) => {
    //         x.oldDb.replicate.to(x.newDb).on('complete', () => { observer.next(x.oldDb); observer.complete(); });
    //     }))
    //     .flatMap((oldDb: any) => oldDb.destroy())

    // backup and delete is only intended for development and testing
    // production requirement is that the old database must _always_ be deleted
    return getDatabaseAsObservable(oldDatabaseName).flatMap((oldDb: any) => oldDb.destroy());
}

function createUserDbIdDoc() {
    return {
        _id: 'user-db-id',
        value: new Date().getTime(),
    };
}

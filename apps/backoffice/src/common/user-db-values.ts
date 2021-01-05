/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import * as bluebird from 'bluebird';
import { assign, first, flatten, groupBy, intersection, sortBy } from 'lodash';
import { concat, from, Observable, forkJoin } from 'rxjs';
import { flatMap, map, reduce, toArray, withLatestFrom, switchMap } from 'rxjs/operators';

import { Models as P, PmsFilter, pmsSortId, preismeldestelleId, preismeldungId, preismeldungRefId } from '@lik-shared';

import {
    dbNames,
    getAllDocumentsForPrefixFromDb,
    getAllDocumentsFromDb,
    getAllPreismeldungenStatus,
    getDatabase,
    getDatabaseAsObservable,
    getDocumentByKeyFromDb,
    getUserDatabaseName,
    listUserDatabases,
    downloadDatabaseAsync,
    getLocalDatabase,
    clearRev,
} from '../common/pouchdb-utils';

type FindSelector<T> = PouchDB.Find.CombinationOperators &
    { [V in keyof T]: PouchDB.Find.Selector | PouchDB.Find.Selector[] | PouchDB.Find.ConditionOperators | T[V] } & {
        _id?: PouchDB.Find.ConditionOperators;
    };

export function loadAllPreismeldestellen() {
    return getAllDocumentsForPrefixFromUserDbs<P.Preismeldestelle>(preismeldestelleId()).pipe(
        flatMap((preismeldestellen: any[]) =>
            getDatabaseAsObservable(dbNames.preismeldestellen).pipe(
                flatMap(db => getAllDocumentsForPrefixFromDb<P.Preismeldestelle>(db, preismeldestelleId())),
                map(unassignedPms => {
                    const remainingPms = unassignedPms.filter(
                        pms => !preismeldestellen.some(x => x.pmsNummer === pms.pmsNummer),
                    );
                    return sortBy([...preismeldestellen, ...remainingPms], pms => pms.pmsNummer);
                }),
            ),
        ),
    );
}

export function loadAllPreismeldungenForExport(
    alreadyExported: string[],
): Observable<{ pm: P.Preismeldung; refPreismeldung: P.PreismeldungReference; sortierungsnummer: number }[]> {
    return from(getAllUnexportedPm(alreadyExported)).pipe(
        flatMap(preismeldungen =>
            getDatabaseAsObservable(dbNames.preismeldungen).pipe(
                flatMap(db =>
                    getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(db, preismeldungRefId()).then(
                        refPreismeldungen => ({ refPreismeldungen, preismeldungen }),
                    ),
                ),
            ),
        ),
        withLatestFrom(getAllPreismeldungenStatus()),
        map(([{ preismeldungen, refPreismeldungen }, preismeldungenStatus]) => ({
            grouped: groupBy(
                preismeldungen.filter(
                    pm => (preismeldungenStatus.statusMap[pm._id] || 0) >= P.PreismeldungStatus['geprüft'],
                ),
                pm => pm.pmsNummer,
            ),
            refPreismeldungen,
        })),
        flatMap(({ grouped, refPreismeldungen }) =>
            getAllSortierungenByPmsId(Object.keys(grouped)).pipe(
                map(sortierung => ({
                    grouped,
                    refPreismeldungen,
                    sortierung,
                })),
            ),
        ),
        map(({ grouped, refPreismeldungen, sortierung }) =>
            flatten(
                Object.keys(grouped).reduce(
                    (acc, pms) => [
                        ...acc,
                        sortBy(grouped[pms], [pm => pm.pmsNummer, pm => pm.erfasstAt]).map(pm => ({
                            pm,
                            refPreismeldung: refPreismeldungen.find(rpm => rpm.pmId === pm._id) || {},
                            sortierungsnummer: sortierung[pm._id] || null,
                        })),
                    ],
                    [],
                ),
            ),
        ),
    );
}

const getAllSortierungenByPmsId = (pmsIds: string[]) => {
    if (pmsIds.length === 0) {
        throw new Error('Keine Daten zum exportieren vorhanden');
    }
    return listUserDatabases().pipe(
        flatMap(dbnames =>
            from(dbnames).pipe(
                flatMap(dbname => getDatabaseAsObservable(dbname)),
                flatMap(db =>
                    db.find({
                        limit: Number.MAX_SAFE_INTEGER,
                        selector: <FindSelector<P.PmsPreismeldungenSort>>{
                            _id: { $in: pmsIds.map(pmsSortId) },
                        },
                    }),
                ),
                map((list: PouchDB.Find.FindResponse<P.PmsPreismeldungenSort>) =>
                    list.docs
                        .reduce(
                            (acc, sort) => [
                                ...acc,
                                ...sort.sortOrder.reduce((sublist, x) => [...sublist, x], [] as ({
                                    pmId: string;
                                } & P.PreismeldungSortProperties)[]),
                            ],
                            [] as ({
                                pmId: string;
                            } & P.PreismeldungSortProperties)[],
                        )
                        .reduce((acc, sort) => ({ ...acc, [sort.pmId]: sort.sortierungsnummer }), {} as {
                            [pmId: string]: number;
                        }),
                ),
                toArray(),
                map(x =>
                    x.reduce((acc, sort) => ({ ...acc, ...sort }), {} as {
                        [pmId: string]: number;
                    }),
                ),
            ),
        ),
    );
};

const loadUserDbs = async (preiserheberIds: string[]) => {
    if (preiserheberIds.length === 0) {
        return [];
    }
    return await bluebird.reduce(
        preiserheberIds,
        (acc, preiserheberId) =>
            getDatabase(getUserDatabaseName(preiserheberId)).then(x => [...acc, x] as PouchDB.Database<{}>[]),
        [] as PouchDB.Database<{}>[],
    );
};

const loadByEpNumbers = async (preiserheberIds: string[], filter: Partial<PmsFilter>) => {
    const userDbs = await loadUserDbs(preiserheberIds);
    const pmsNummer = first(filter.pmsNummers);

    if (userDbs.length === 0) {
        return null;
    }

    const preismeldungen = userDbs.map(async userDb => {
        if (pmsNummer) {
            return await bluebird.reduce(
                filter.epNummers.map(
                    async epNummer =>
                        await getAllDocumentsForPrefixFromDb<P.Preismeldung>(
                            userDb,
                            preismeldungId(pmsNummer, epNummer),
                        ),
                ),
                (acc, x) => [...acc, ...x],
                [] as P.Preismeldung[],
            );
        }
        const allPreismeldungen = await getAllDocumentsForPrefixFromDb<P.Preismeldung>(userDb, preismeldungId());
        return allPreismeldungen.filter(pm => filter.epNummers.some(x => x === pm.epNummer));
    });
    return await bluebird.reduce(preismeldungen, (acc, x) => [...acc, ...x], [] as P.Preismeldung[]);
};

const parseIdSearchParams = (filterText: string) => {
    const idsRegex = /^([0-9]+?)\/(([0-9]*?)(\/([0-9]*?))?)$/;
    if (!idsRegex.test(filterText)) {
        return null;
    }
    const [, pmsNummer, , epNummer, , laufNummer] = filterText.match(idsRegex);
    return { pmsNummers: [pmsNummer], epNummers: [epNummer], laufNummer, preiserheberIds: [] as string[] };
};

export async function loadPreiszuweisungen() {
    return (await getDatabase(dbNames.preiszuweisungen).then(db => getAllDocumentsFromDb<P.Preiszuweisung>(db))).filter(
        x => !!x.preismeldestellenNummern.length,
    );
}

export async function loadPreismeldungenAndRefPreismeldungForPms(filterParams: Partial<PmsFilter>) {
    const notFound = { refPreismeldungen: [], preismeldungen: [], pms: null, alreadyExported: [] };
    if (!!filterParams.pmIdSearch && parseIdSearchParams(filterParams.pmIdSearch) === null) {
        return notFound;
    }

    const preiszuweisungen = await loadPreiszuweisungen();

    const alreadyExported = await getDatabase(dbNames.exports).then(db =>
        getAllDocumentsFromDb<any>(db).then(docs => flatten(docs.map(doc => (doc.preismeldungIds as string[]) || []))),
    );
    if (!!filterParams.pmIdSearch) {
        return loadByExactSearch(filterParams.pmIdSearch, preiszuweisungen, alreadyExported);
    }
    const pmsNummers = filterParams.pmsNummers;
    const byPreiserheberIds =
        !filterParams.preiserheberIds || filterParams.preiserheberIds.length === 0
            ? null
            : preiszuweisungen
                  .filter(x => filterParams.preiserheberIds.some(id => id === x.preiserheberId))
                  .map(x => x.preiserheberId);
    const byPmsNummer = !pmsNummers
        ? null
        : preiszuweisungen
              .filter(x => x.preismeldestellenNummern.some(p => pmsNummers.some(y => y === p)))
              .map(x => x.preiserheberId);
    const preiserheberIds =
        (!!byPreiserheberIds && byPreiserheberIds.length > 0 && !!byPmsNummer && byPmsNummer.length > 0
            ? intersection(byPreiserheberIds, byPmsNummer)
            : byPreiserheberIds || byPmsNummer) || [];

    const refPreismeldungen = await getRefPreismeldungenByPmsNummers(filterParams);
    const alreadyExportedById = alreadyExported.reduce((acc, id) => {
        acc[id] = true;
        return acc;
    }, {});
    const preismeldungenStatus = await getAllPreismeldungenStatus();

    if (!!filterParams.epNummers && filterParams.epNummers.length >= 1) {
        const preismeldungenByEpNummer = await loadByEpNumbers(
            preiserheberIds.length > 0 ? preiserheberIds : preiszuweisungen.map(x => x.preiserheberId),
            filterParams,
        );
        return {
            refPreismeldungen,
            alreadyExported,
            preismeldungen: filterPreismeldungenByStatus(
                preismeldungenByEpNummer,
                preismeldungenStatus.statusMap,
                alreadyExportedById,
                filterParams,
            ),
            pms: null,
        };
    }

    if (preiserheberIds.length === 0) {
        return notFound;
    }
    const preismeldungen = await getPreismeldungenByPmsNummers(filterParams, preiserheberIds);

    return {
        refPreismeldungen,
        preismeldungen: filterPreismeldungenByStatus(
            preismeldungen,
            preismeldungenStatus.statusMap,
            alreadyExportedById,
            filterParams,
        ),
        alreadyExported,
        pms: null,
    };
}

export function loadAllPreiserheber() {
    return getAllDocumentsForPrefixFromUserDbs<P.Erheber>('preiserheber').pipe(
        flatMap((preiserheber: P.Erheber[]) =>
            getDatabaseAsObservable(dbNames.preiserheber).pipe(
                flatMap(db => getAllDocumentsFromDb<P.Erheber>(db)),
                map(unassignedPe => {
                    const remainingPe = unassignedPe.filter(pe => !preiserheber.some(x => x.username === pe.username));
                    return sortBy(
                        [...preiserheber.map(pe => assign({}, pe, { _id: pe.username })), ...remainingPe],
                        pe => pe.username,
                    );
                }),
            ),
        ),
    );
}

export function loadPreiserheber(id: string) {
    return listUserDatabases().pipe(
        flatMap(userDbNames => {
            const userDbName = userDbNames.find(dbName => dbName === getUserDatabaseName(id));
            if (userDbName) {
                return getDatabaseAsObservable(userDbName).pipe(
                    flatMap(db =>
                        getDocumentByKeyFromDb<P.Erheber>(db, 'preiserheber').then(pe =>
                            assign(pe, { _id: pe.username }),
                        ),
                    ),
                );
            }
            return getDatabaseAsObservable(dbNames.preiserheber).pipe(
                flatMap(db => getDocumentByKeyFromDb<P.Erheber>(db, id)),
            );
        }),
    );
}

export function updatePreiserheber(preiserheber: P.Erheber) {
    return listUserDatabases().pipe(
        flatMap(userDbNames => {
            const userDbName = userDbNames.find(dbName => dbName === getUserDatabaseName(preiserheber.username));
            if (userDbName) {
                return getDatabaseAsObservable(userDbName).pipe(
                    map(db => ({
                        db,
                        updatedPreiserheber: assign({}, preiserheber, { _id: 'preiserheber' }),
                    })),
                );
            }
            return getDatabaseAsObservable(dbNames.preiserheber).pipe(
                map(db => ({ db, updatedPreiserheber: preiserheber })),
            );
        }),
        flatMap(({ db, updatedPreiserheber }) => db.put(updatedPreiserheber)),
    );
}

export function getAllDocumentsForPrefixFromUserDbs<T extends P.CouchProperties>(prefix: string): Observable<T[]> {
    return listUserDatabases().pipe(
        flatMap(dbnames =>
            from(dbnames).pipe(
                flatMap(dbname => getDatabaseAsObservable(dbname)),
                flatMap(db => getAllDocumentsForPrefixFromDb<T>(db, prefix)),
                reduce((acc, docs) => [...acc, ...docs], []),
            ),
        ),
    );
}

export function createIndexes() {
    return listUserDatabases().pipe(
        flatMap(dbnames =>
            from(dbnames).pipe(
                flatMap(dbname => getDatabaseAsObservable(dbname)),
                flatMap(db =>
                    concat(
                        (<(keyof P.Preismeldung)[]>['_id', 'istAbgebucht', 'uploadRequestedAt']).map(key =>
                            db.createIndex({ index: { fields: [key] } }),
                        ),
                    ),
                ),
            ),
        ),
    );
}

export function getAllUploadedPm(): Promise<P.Preismeldung[]> {
    return listUserDatabases()
        .pipe(
            flatMap(dbnames =>
                from(dbnames).pipe(
                    flatMap(dbname => getDatabaseAsObservable(dbname)),
                    flatMap(db =>
                        db.find({
                            limit: Number.MAX_SAFE_INTEGER,
                            selector: <FindSelector<P.Preismeldung>>{
                                _id: { $gt: 'pm_', $lt: 'pm_\uffff' },
                                uploadRequestedAt: { $ne: null },
                            },
                        }),
                    ),
                    reduce((acc, docs) => [...acc, ...docs.docs], []),
                ),
            ),
        )
        .toPromise();
}

export function getAllEpsRelatedPm(epNummern: string[]): Promise<P.Preismeldung[]> {
    return listUserDatabases()
        .pipe(
            flatMap(dbnames =>
                from(dbnames).pipe(
                    flatMap(dbname => getDatabaseAsObservable(dbname)),
                    flatMap(db =>
                        db.find({
                            limit: Number.MAX_SAFE_INTEGER,
                            selector: <FindSelector<P.Preismeldung>>{
                                _id: { $gt: 'pm_', $lt: 'pm_\uffff' },
                                epNummer: { $in: epNummern },
                            },
                        }),
                    ),
                    reduce((acc, docs) => [...acc, ...docs.docs], []),
                ),
            ),
        )
        .toPromise();
}

export function getAllUnexportedPm(alreadyExported: string[]) {
    return listUserDatabases()
        .pipe(
            flatMap(dbnames =>
                from(dbnames).pipe(
                    flatMap(dbname => getDatabaseAsObservable(dbname)),
                    flatMap(db =>
                        db.find({
                            limit: Number.MAX_SAFE_INTEGER,
                            selector: <FindSelector<P.Preismeldung>>{
                                _id: { $nin: alreadyExported },
                                istAbgebucht: true,
                                uploadRequestedAt: { $ne: null },
                            },
                        }),
                    ),
                    reduce((acc, docs) => [...acc, ...docs.docs], []),
                ),
            ),
        )
        .toPromise();
}

export async function getAllAssignedPreismeldungen() {
    const preiszuweisungen = await loadPreiszuweisungen();
    const preismeldungenByPe = preiszuweisungen.map(async pz => {
        const db = await getDatabase(getUserDatabaseName(pz.preiserheberId));
        const preismeldungen = await getAllDocumentsForPrefixFromDb<P.Preismeldung>(db, preismeldungId());
        return preismeldungen.filter(pm => pz.preismeldestellenNummern.some(pmsNummer => pmsNummer === pm.pmsNummer));
    });
    return await bluebird
        .all(preismeldungenByPe)
        .then(x => x.reduce((list, lookup) => [...list, ...lookup], [] as P.Preismeldung[]));
}

function filterPreismeldungenByStatus(
    preismeldungen: P.Preismeldung[],
    preismeldungenStatus: { [pmId: string]: P.PreismeldungStatus },
    alreadyExportedById: { [pmId: string]: true },
    filter: Partial<PmsFilter>,
) {
    return preismeldungen.filter(pm => {
        switch (filter.statusFilter) {
            case 'erhebung':
                return !!pm.uploadRequestedAt && preismeldungenStatus[pm._id] == null;
            case 'exportiert':
                return !!alreadyExportedById[pm._id];
            case 'prüfung':
                return (
                    preismeldungenStatus[pm._id] != null &&
                    preismeldungenStatus[pm._id] < P.PreismeldungStatus.geprüft &&
                    !alreadyExportedById[pm._id] &&
                    !!pm.uploadRequestedAt
                );
            default:
                return true;
        }
    });
}

async function getRefPreismeldungenByPmsNummers(filterParams: Partial<PmsFilter & { laufNummer: string }>) {
    const pmsNummers =
        !filterParams.pmsNummers || filterParams.pmsNummers.length === 0 ? [null] : filterParams.pmsNummers;
    const pmDb = await getDatabase(dbNames.preismeldungen);
    return bluebird.reduce(
        pmsNummers.map(pmsNummer =>
            getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(pmDb, preismeldungRefId(pmsNummer)),
        ),
        (acc, x) => [...acc, ...x],
        [] as P.PreismeldungReference[],
    );
}

async function getPreismeldungenByPmsNummers(
    filterParams: Partial<PmsFilter & { laufNummer: string }>,
    preiserheberIds: string[],
) {
    const userDbs = await loadUserDbs(preiserheberIds);
    const pmsNummers =
        !filterParams.pmsNummers || filterParams.pmsNummers.length === 0 ? [null] : filterParams.pmsNummers;

    const preismeldungenLookups: Promise<P.Preismeldung[]>[] = pmsNummers.reduce(
        (acc, pmsNummer) => [
            ...acc,
            ...userDbs.map(userDb =>
                getAllDocumentsForPrefixFromDb<P.Preismeldung>(
                    userDb,
                    preismeldungId(pmsNummer, first(filterParams.epNummers), filterParams.laufNummer),
                ),
            ),
        ],
        [] as Promise<P.Preismeldung[]>[],
    );
    return bluebird.reduce(preismeldungenLookups, (acc, x) => [...acc, ...x], [] as P.Preismeldung[]);
}

async function loadByExactSearch(
    idSearchParams: string,
    preiszuweisungen: P.Preiszuweisung[],
    alreadyExported: string[],
) {
    const notFound = { refPreismeldungen: [], preismeldungen: [], pms: null, alreadyExported: [] };
    const filter = parseIdSearchParams(idSearchParams);
    if (!filter) {
        return notFound;
    }

    const preiserheberId = first(
        preiszuweisungen
            .filter(pz => pz.preismeldestellenNummern.some(p => p === first(filter.pmsNummers)))
            .map(pz => pz.preiserheberId),
    );
    if (!preiserheberId) {
        return notFound;
    }

    const refPreismeldungen = await getRefPreismeldungenByPmsNummers(filter);
    const preismeldungen = await getPreismeldungenByPmsNummers(filter, [preiserheberId]);
    return {
        refPreismeldungen,
        alreadyExported,
        preismeldungen: preismeldungen,
        // priorizedPreismeldungen: filter.laufNummer
        //     ? preismeldungen.filter(pm => pm.laufnummer !== filter.laufNummer).map(pm => pm._id)
        //     : null,
        pms: null,
    };
}

export async function getMissingPreismeldungenStatusCount() {
    const preismeldungen = await getAllUploadedPm();
    await downloadDatabaseAsync(dbNames.preismeldungen_status);
    const db = await getLocalDatabase(dbNames.preismeldungen_status);
    const currentPreismeldungenStatus = await getDocumentByKeyFromDb<P.PreismeldungenStatus>(
        db,
        'preismeldungen_status',
    );
    return preismeldungen.filter(pm => currentPreismeldungenStatus.statusMap[pm._id] == null).length;
}

export async function updateMissingStichtage(preismeldungen: P.Preismeldung[]) {
    if (preismeldungen.some(pm => pm.erhebungsZeitpunkt === 99)) {
        const pmWrongErhebungszeitpunkt = preismeldungen.filter(pm => pm.erhebungsZeitpunkt === 99);
        const otherEps = await getAllEpsRelatedPm(pmWrongErhebungszeitpunkt.map(pm => pm.epNummer));
        const updatedPm = pmWrongErhebungszeitpunkt.map(pm => ({
            ...pm,
            erhebungsZeitpunkt: (
                otherEps.find(o => o.epNummer === pm.epNummer) || {
                    erhebungsZeitpunkt: pm.erhebungsZeitpunkt,
                }
            ).erhebungsZeitpunkt,
        }));

        const pmsMap = (await loadPreiszuweisungen()).reduce(
            (acc, z) => ({
                ...acc,
                ...z.preismeldestellenNummern.reduce(
                    (list, pms) => ({ ...list, [pms]: z.preiserheberId }),
                    {} as Record<string, string>,
                ),
            }),
            {} as Record<string, string>,
        );

        return await forkJoin(
            updatedPm.map(pm =>
                getDatabaseAsObservable(getUserDatabaseName(pmsMap[pm.pmsNummer])).pipe(switchMap(db => db.put(pm))),
            ),
        )
            .pipe(
                map(preismeldungenArray =>
                    flatten(preismeldungenArray).map(pm => clearRev<P.PreismeldungReference>(pm)),
                ),
            )
            .toPromise();
    }
    return new Promise(resolve => resolve());
}

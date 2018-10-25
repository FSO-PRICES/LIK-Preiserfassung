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

import { Observable } from 'rxjs/Observable';
import { groupBy, sortBy, first, assign, flatten, intersection } from 'lodash';
import * as bluebird from 'bluebird';

import { Models as P, preismeldungId, preismeldungRefId, preismeldestelleId, PmsFilter } from 'lik-shared';

import {
    listUserDatabases,
    getDatabaseAsObservable,
    getAllDocumentsForPrefixFromDb,
    dbNames,
    getAllDocumentsFromDb,
    getDocumentByKeyFromDb,
    getUserDatabaseName,
    getDatabase,
    getAllPreismeldungenStatus,
} from '../common/pouchdb-utils';

export function loadAllPreismeldestellen() {
    return getAllDocumentsForPrefixFromUserDbs<P.Preismeldestelle>(preismeldestelleId()).flatMap(
        (preismeldestellen: any[]) =>
            getDatabaseAsObservable(dbNames.preismeldestellen)
                .flatMap(db => getAllDocumentsForPrefixFromDb<P.Preismeldestelle>(db, preismeldestelleId()))
                .map(unassignedPms => {
                    const remainingPms = unassignedPms.filter(
                        pms => !preismeldestellen.some(x => x.pmsNummer === pms.pmsNummer)
                    );
                    return sortBy([...preismeldestellen, ...remainingPms], pms => pms.pmsNummer);
                })
    );
}

export function loadAllPreismeldungenForExport(
    pmsNummer: string = ''
): Observable<{ pm: P.Preismeldung; refPreismeldung: P.PreismeldungReference; sortierungsnummer: number }[]> {
    return getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>(preismeldungId(pmsNummer))
        .flatMap(preismeldungen =>
            getDatabaseAsObservable(dbNames.preismeldungen).flatMap(db =>
                getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(db, preismeldungRefId(pmsNummer)).then(
                    refPreismeldungen => ({ refPreismeldungen, preismeldungen })
                )
            )
        )
        .withLatestFrom(getAllPreismeldungenStatus())
        .map(([{ preismeldungen, refPreismeldungen }, preismeldungenStatus]) => {
            const grouped = groupBy(
                preismeldungen.filter(
                    pm =>
                        pm.istAbgebucht &&
                        !!pm.uploadRequestedAt &&
                        (preismeldungenStatus.statusMap[pm._id] || 0) >= P.PreismeldungStatus['geprüft']
                ),
                pm => pm.pmsNummer
            );
            return flatten(
                Object.keys(grouped).reduce(
                    (acc, pms) => [
                        ...acc,
                        sortBy(grouped[pms], [pm => pm.pmsNummer, pm => pm.erfasstAt]).map((pm, i) => ({
                            pm,
                            refPreismeldung: refPreismeldungen.find(rpm => rpm.pmId === pm._id) || {},
                            sortierungsnummer: i + 1,
                        })),
                    ],
                    []
                )
            );
        });
}

const loadUserDbs = async (preiserheberIds: string[]) => {
    if (preiserheberIds.length === 0) {
        return [];
    }
    return await bluebird.reduce(
        preiserheberIds.map(async preiserheberId => await getDatabase(getUserDatabaseName(preiserheberId))),
        (acc, x) => [...acc, x],
        [] as PouchDB.Database<{}>[]
    );
};

const loadByEpNumbers = async (preiserheberIds: string[], filter: Partial<PmsFilter>) => {
    let userDbs = await loadUserDbs(preiserheberIds);
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
                            preismeldungId(pmsNummer, epNummer)
                        )
                ),
                (acc, x) => [...acc, ...x],
                [] as P.Preismeldung[]
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

async function loadPreiszuweisungen() {
    return (await getDatabase(dbNames.preiszuweisungen).then(db => getAllDocumentsFromDb<P.Preiszuweisung>(db))).filter(
        x => !!x.preismeldestellenNummern.length
    );
}

export async function loadPreismeldungenAndRefPreismeldungForPms(filterParams: Partial<PmsFilter>) {
    const preiszuweisungen = await loadPreiszuweisungen();

    const alreadyExported = await getDatabase(dbNames.exports).then(db =>
        getAllDocumentsFromDb<any>(db).then(docs => flatten(docs.map(doc => (doc.preismeldungIds as string[]) || [])))
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
            filterParams
        );
        return {
            refPreismeldungen,
            alreadyExported,
            preismeldungen: filterPreismeldungenByStatus(
                preismeldungenByEpNummer,
                preismeldungenStatus.statusMap,
                alreadyExportedById,
                filterParams
            ),
            pms: null,
        };
    }

    if (preiserheberIds.length === 0) {
        return { refPreismeldungen: [], preismeldungen: [], pms: null, alreadyExported: [] };
    }
    const preismeldungen = await getPreismeldungenByPmsNummers(filterParams, preiserheberIds);

    return {
        refPreismeldungen,
        preismeldungen: filterPreismeldungenByStatus(
            preismeldungen,
            preismeldungenStatus.statusMap,
            alreadyExportedById,
            filterParams
        ),
        alreadyExported,
        pms: null,
    };
}

export function loadAllPreiserheber() {
    return getAllDocumentsForPrefixFromUserDbs<P.Erheber>('preiserheber').flatMap((preiserheber: P.Erheber[]) =>
        getDatabaseAsObservable(dbNames.preiserheber)
            .flatMap(db => getAllDocumentsFromDb<P.Erheber>(db))
            .map(unassignedPe => {
                const remainingPe = unassignedPe.filter(pe => !preiserheber.some(x => x.username === pe.username));
                return sortBy(
                    [...preiserheber.map(pe => assign({}, pe, { _id: pe.username })), ...remainingPe],
                    pe => pe.username
                );
            })
    );
}

export function loadPreiserheber(id: string) {
    return listUserDatabases().flatMap(userDbNames => {
        const userDbName = userDbNames.find(dbName => dbName === getUserDatabaseName(id));
        if (userDbName) {
            return getDatabaseAsObservable(userDbName).flatMap(db =>
                getDocumentByKeyFromDb<P.Erheber>(db, 'preiserheber').then(pe => assign(pe, { _id: pe.username }))
            );
        }
        return getDatabaseAsObservable(dbNames.preiserheber).flatMap(db => getDocumentByKeyFromDb<P.Erheber>(db, id));
    });
}

export function updatePreiserheber(preiserheber: P.Erheber) {
    return listUserDatabases()
        .flatMap(userDbNames => {
            const userDbName = userDbNames.find(dbName => dbName === getUserDatabaseName(preiserheber.username));
            if (userDbName) {
                return getDatabaseAsObservable(userDbName).map(db => ({
                    db,
                    updatedPreiserheber: assign({}, preiserheber, { _id: 'preiserheber' }),
                }));
            }
            return getDatabaseAsObservable(dbNames.preiserheber).map(db => ({ db, updatedPreiserheber: preiserheber }));
        })
        .flatMap(({ db, updatedPreiserheber }) => db.put(updatedPreiserheber));
}

export function getAllDocumentsForPrefixFromUserDbs<T extends P.CouchProperties>(prefix: string): Observable<T[]> {
    return listUserDatabases().flatMap(dbnames =>
        Observable.from(dbnames)
            .flatMap(dbname => getDatabaseAsObservable(dbname))
            .flatMap(db => getAllDocumentsForPrefixFromDb<T>(db, prefix))
            .reduce((acc, docs) => [...acc, ...docs], [])
    );
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
    filter: Partial<PmsFilter>
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
            getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(pmDb, preismeldungRefId(pmsNummer))
        ),
        (acc, x) => [...acc, ...x],
        [] as P.PreismeldungReference[]
    );
}

async function getPreismeldungenByPmsNummers(
    filterParams: Partial<PmsFilter & { laufNummer: string }>,
    preiserheberIds: string[]
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
                    preismeldungId(pmsNummer, first(filterParams.epNummers), filterParams.laufNummer)
                )
            ),
        ],
        [] as Promise<P.Preismeldung[]>[]
    );
    return bluebird.reduce(preismeldungenLookups, (acc, x) => [...acc, ...x], [] as P.Preismeldung[]);
}

async function loadByExactSearch(
    idSearchParams: string,
    preiszuweisungen: P.Preiszuweisung[],
    alreadyExported: string[]
) {
    const filter = parseIdSearchParams(idSearchParams);
    const preiserheberId = first(
        preiszuweisungen
            .filter(pz => pz.preismeldestellenNummern.some(p => p === first(filter.pmsNummers)))
            .map(pz => pz.preiserheberId)
    );
    if (!preiserheberId) {
        return { refPreismeldungen: [], preismeldungen: [], pms: null, alreadyExported: [] };
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

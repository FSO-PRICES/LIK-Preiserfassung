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

import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { assign, groupBy, mapValues } from 'lodash';

import { Models as P, preismeldungId, preismeldestelleId } from 'lik-shared';

import { getDatabase, getAllDocumentsForPrefixFromDb } from './pouchdb-utils';
import * as fromRoot from '../reducers';
import { Action as StatisticsAction } from '../actions/statistics';
import { PreismeldestelleStatisticsMap } from '../reducers/statistics';

@Injectable()
export class StatisticsEffects {
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldungViewBag);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadPreismeldungen$ = this.actions$
        .ofType('PREISMELDUNG_STATISTICS_LOAD')
        .flatMap(() => getDatabase())
        .flatMap(db =>
            loadAllPreismeldungRefs(db).then(pmsRefPreismeldungenTotals => ({ db, pmsRefPreismeldungenTotals }))
        )
        .flatMap(({ db, pmsRefPreismeldungenTotals }) =>
            getAllDocumentsForPrefixFromDb(db, preismeldungId())
                .then((allPreismeldungen: P.Preismeldung[]) => {
                    const pmsPreismeldungen = groupBy(allPreismeldungen, p => p.pmsNummer);
                    const pmsPreismeldungenStatistics = mapValues(pmsPreismeldungen, preismeldungen => {
                        const preismeldungenByUploaded = groupBy(
                            preismeldungen,
                            p => (!!p.uploadRequestedAt ? 'uploaded' : 'notUploaded')
                        );
                        const preismeldungenBySaved = groupBy(
                            preismeldungenByUploaded['notUploaded'],
                            p => (!!p.istAbgebucht ? 'saved' : 'notSaved')
                        );
                        return {
                            totalCount: preismeldungen.length,
                            uploadedCount: (preismeldungenByUploaded['uploaded'] || []).length,
                            openSavedCount: (preismeldungenBySaved['saved'] || []).length,
                            openUnsavedCount: (preismeldungenBySaved['notSaved'] || []).length,
                        };
                    });

                    return mapValues(pmsRefPreismeldungenTotals, (v: any, pmsNummer) => {
                        return pmsPreismeldungenStatistics[pmsNummer]
                            ? assign({}, v, pmsPreismeldungenStatistics[pmsNummer])
                            : {
                                  downloadedCount: v.downloadedCount,
                                  totalCount: v.downloadedCount,
                                  uploadedCount: 0,
                                  openSavedCount: 0,
                                  openUnsavedCount: v.downloadedCount,
                              };
                    }) as PreismeldestelleStatisticsMap;
                })
                .then(preismeldestelleStatistics => ({ db, preismeldestelleStatistics }))
        )
        .flatMap(({ db, preismeldestelleStatistics }) =>
            db
                .get('erhebungsmonat')
                .then((doc: P.Erhebungsmonat) => ({ monthAsString: doc.monthAsString, preismeldestelleStatistics }))
        )
        .map(
            preismeldungenData =>
                ({ type: 'PREISMELDUNG_STATISTICS_LOAD_SUCCESS', payload: preismeldungenData } as StatisticsAction)
        );
}

async function loadAllPreismeldungRefs(db): Promise<{ [pmsNummer: number]: { downloadedCount: number } }> {
    const assignedPms = await getAllDocumentsForPrefixFromDb<P.Preismeldestelle>(db, preismeldestelleId());
    const pmRefs = await getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(db, 'pm-ref');

    return assignedPms.reduce((acc, pms) => {
        return {
            ...acc,
            [pms.pmsNummer]: { downloadedCount: pmRefs.filter(pm => pm.pmsNummer == pms.pmsNummer).length },
        };
    }, {});
}

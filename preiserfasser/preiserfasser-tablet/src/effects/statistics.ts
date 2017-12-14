import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { assign, groupBy, mapValues } from 'lodash';

import { Models as P, preismeldungId } from 'lik-shared';

import { getDatabase, getAllDocumentsForPrefixFromDb } from './pouchdb-utils';
import * as fromRoot from '../reducers';
import { Action as StatisticsAction } from '../actions/statistics';
import { PreismeldestelleStatisticsMap } from '../reducers/statistics';

@Injectable()
export class StatisticsEffects {
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldung);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadPreismeldungen$ = this.actions$
        .ofType('PREISMELDUNG_STATISTICS_LOAD')
        .flatMap(() => getDatabase())
        .flatMap(db =>
            getAllDocumentsForPrefixFromDb(db, 'pm-ref').then((refPreismeldungen: P.PreismeldungReference[]) => {
                const pmsRefPreismeldungen = groupBy(refPreismeldungen, p => p.pmsNummer);
                return {
                    db,
                    pmsRefPreismeldungenTotals: mapValues(pmsRefPreismeldungen, value => ({
                        downloadedCount: value.length,
                    })) as { [pmsNummer: number]: { downloadedCount: number } },
                };
            })
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

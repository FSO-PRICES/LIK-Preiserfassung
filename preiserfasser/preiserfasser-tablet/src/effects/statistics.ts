import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { assign, groupBy, mapValues } from 'lodash';

import { Models as P } from 'lik-shared';

import { getDatabase, getAllDocumentsForPrefix } from './pouchdb-utils';
import * as fromRoot from '../reducers';
import { Action as StatisticsAction } from '../actions/statistics';

@Injectable()
export class StatisticsEffects {
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldung);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadPreismeldungen$ = this.actions$
        .ofType('PREISMELDUNG_STATISTICS_LOAD')
        .switchMap(() => getDatabase())
        .flatMap(db => db.allDocs(assign({}, getAllDocumentsForPrefix('pm-ref'), { include_docs: true })).then(res => {
            const refPreismeldungen = res.rows.map(y => y.doc) as P.PreismeldungReference[];
            const pmsRefPreismeldungen = groupBy(refPreismeldungen, p => p.pmsNummer);
            return { db, pmsRefPreismeldungenTotals: mapValues(pmsRefPreismeldungen, value => ({ totalCount: value.length })) as { [pmsNummer: number]: { totalCount: number } } };
        }))
        .flatMap(({ db, pmsRefPreismeldungenTotals }) => db.allDocs(assign({}, getAllDocumentsForPrefix('pm'), { include_docs: true }))
            .then(res => {
                const pmsPreismeldungen = groupBy(res.rows.map(y => y.doc) as P.Preismeldung[], p => p.pmsNummer);
                const pmsPreismeldungenStatistics = mapValues(pmsPreismeldungen, preismeldungen => {
                    const preismeldungenByUploaded = groupBy(preismeldungen, p => !!p.uploadRequestedAt ? 'uploaded' : 'notUploaded');
                    const preismeldungenBySaved = groupBy(preismeldungenByUploaded['notUploaded'], p => !!p.istAbgebucht ? 'saved' : 'notSaved');
                    return {
                        totalCount: preismeldungen.length,
                        uploadedCount: (preismeldungenByUploaded['uploaded'] || []).length,
                        openSavedCount: (preismeldungenBySaved['saved'] || []).length,
                        openUnsavedCount: (preismeldungenBySaved['notSaved'] || []).length
                    };
                });

                return mapValues(pmsRefPreismeldungenTotals, (v: any, pmsNummer) => {
                    return pmsPreismeldungenStatistics[pmsNummer] || { totalCount: v.totalCount, uploadedCount: 0, openSavedCount: 0, openUnsavedCount: v.totalCount };
                });
            })
        )
        .map(preismeldungenData => ({ type: 'PREISMELDUNG_STATISTICS_LOAD_SUCCESS', payload: preismeldungenData } as StatisticsAction));
}

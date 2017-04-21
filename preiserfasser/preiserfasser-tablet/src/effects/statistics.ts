import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { assign, groupBy, mapValues, merge } from 'lodash';

import { Models as P } from 'lik-shared';

import { getDatabase, getAllDocumentsForPrefix } from './pouchdb-utils';
import * as fromRoot from '../reducers';
import { Action as StatisticsAction } from '../actions/statistics';
import { PreismeldungenStatistics } from '../reducers/statistics';

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
            const preismeldungen = res.rows.map(y => y.doc) as P.PreismeldungReference[];
            const preismeldungenByPms = groupBy(preismeldungen, p => p.pmsNummer);
            return { db, preismeldungenData: mapValues(preismeldungenByPms, value => ({ totalCount: value.length })) as { [pmsNummer: number]: { totalCount: number } } };
        }))
        .flatMap(({ db, preismeldungenData }) => db.allDocs(assign({}, getAllDocumentsForPrefix(`pm`), { include_docs: true }))
            .then(res => {
                const preismeldungenByPms = groupBy(res.rows.map(y => y.doc) as P.Preismeldung[], p => p.pmsNummer);
                return merge(preismeldungenData, mapValues(preismeldungenByPms, preismeldungen => {
                    const preismeldungenByUploaded = groupBy(preismeldungen, (p) => !!p.uploadRequestedAt ? 'uploaded' : 'notUploaded');
                    const preismeldungenBySaved = groupBy(preismeldungenByUploaded['notUploaded'], p => !!p.istAbgebucht ? 'saved' : 'notSaved');
                    return {
                        uploadedCount: !!preismeldungenByUploaded['uploaded'] ? preismeldungenByUploaded['uploaded'].length : 0,
                        openSavedCount: !!preismeldungenBySaved['saved'] ? preismeldungenBySaved['saved'].length : 0,
                        openUnsavedCount: !!preismeldungenBySaved['notSaved'] ? preismeldungenBySaved['notSaved'].length : 0
                    };
                })) as PreismeldungenStatistics;
            })
        )
        .map(preismeldungenData => ({ type: 'PREISMELDUNG_STATISTICS_LOAD_SUCCESS', payload: preismeldungenData } as StatisticsAction));
}

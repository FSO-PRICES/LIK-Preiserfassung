import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { assign, groupBy, mapValues } from 'lodash';
import { flatMap, map } from 'rxjs/operators';

import { Models as P, preismeldestelleId, preismeldungId } from 'lik-shared';

import { Action as StatisticsAction } from '../actions/statistics';
import * as fromRoot from '../reducers';
import { PreismeldestelleStatisticsMap } from '../reducers/statistics';
import { getAllDocumentsForPrefixFromDb, getDatabase } from './pouchdb-utils';

@Injectable()
export class StatisticsEffects {
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldungViewBag);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadPreismeldungen$ = this.actions$.ofType('PREISMELDUNG_STATISTICS_LOAD').pipe(
        flatMap(() => getDatabase()),
        flatMap(db =>
            loadAllPreismeldungRefs(db).then(pmsRefPreismeldungenTotals => ({ db, pmsRefPreismeldungenTotals })),
        ),
        flatMap(({ db, pmsRefPreismeldungenTotals }) =>
            getAllDocumentsForPrefixFromDb(db, preismeldungId())
                .then((allPreismeldungen: P.Preismeldung[]) => {
                    const pmsPreismeldungen = groupBy(allPreismeldungen, p => p.pmsNummer);
                    const pmsPreismeldungenStatistics = mapValues(pmsPreismeldungen, preismeldungen => {
                        const preismeldungenByUploaded = groupBy(preismeldungen, p =>
                            !!p.uploadRequestedAt ? 'uploaded' : 'notUploaded',
                        );
                        const preismeldungenBySaved = groupBy(preismeldungenByUploaded['notUploaded'], p =>
                            !!p.istAbgebucht ? 'saved' : 'notSaved',
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
                .then(preismeldestelleStatistics => ({ db, preismeldestelleStatistics })),
        ),
        flatMap(({ db, preismeldestelleStatistics }) =>
            db
                .get('erhebungsmonat')
                .then((doc: P.Erhebungsmonat) => ({ monthAsString: doc.monthAsString, preismeldestelleStatistics })),
        ),
        map(
            preismeldungenData =>
                ({ type: 'PREISMELDUNG_STATISTICS_LOAD_SUCCESS', payload: preismeldungenData } as StatisticsAction),
        ),
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

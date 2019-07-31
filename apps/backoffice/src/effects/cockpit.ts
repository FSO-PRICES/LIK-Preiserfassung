import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { assign } from 'lodash';
import { concat } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import { PouchService } from '../services/PouchService';

import { Models as P, preismeldungRefId } from '@lik-shared';

import * as cockpit from '../actions/cockpit';
import { getAllAssignedPreismeldungen } from '../common/user-db-values';
import * as fromRoot from '../reducers';

@Injectable()
export class CockpitEffects {
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(
        private actions$: Actions,
        private pouchService: PouchService,
        private store: Store<fromRoot.AppState>,
    ) {}

    @Effect()
    loadCockpitData$ = this.actions$.ofType('LOAD_COCKPIT_DATA').pipe(
        continueEffectOnlyIfTrue(this.isLoggedIn$),
        flatMap(() =>
            concat(
                [{ type: 'LOAD_COCKPIT_DATA_EXECUTING' }],
                this.pouchService
                    .getAllDocumentsForPrefixFromDbName<P.PreismeldungReference>(
                        this.pouchService.dbNames.preismeldung,
                        preismeldungRefId(),
                    )
                    .pipe(
                        flatMap(refPreismeldungen =>
                            getAllAssignedPreismeldungen().then(preismeldungen => ({
                                refPreismeldungen,
                                preismeldungen,
                            })),
                        ),
                        flatMap(x =>
                            this.pouchService
                                .loadAllPreismeldestellen()
                                .pipe(map(preismeldestellen => assign({}, x, { preismeldestellen }))),
                        ),
                        flatMap(x =>
                            this.pouchService
                                .loadAllPreiserheber()
                                .pipe(map(preiserheber => assign({}, x, { preiserheber }))),
                        ),
                        flatMap(x =>
                            this.pouchService
                                .getAllDocumentsForPrefixFromDbName<P.Preiszuweisung>(
                                    this.pouchService.dbNames.preiszuweisung,
                                    '',
                                )
                                .pipe(map(preiszuweisungen => assign({}, x, { preiszuweisungen }))),
                        ),
                        flatMap(x =>
                            this.pouchService
                                .getAllDocumentsForPrefixFromUserDbsKeyed<P.LastSyncedAt>('last-synced-at')
                                .pipe(map(lastSyncedAt => assign({}, x, { lastSyncedAt }))),
                        ),
                        map(payload => ({ type: 'LOAD_COCKPIT_DATA_SUCCESS', payload } as cockpit.Action)),
                    ),
            ),
        ),
    );
}

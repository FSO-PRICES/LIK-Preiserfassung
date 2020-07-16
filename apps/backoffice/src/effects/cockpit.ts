import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { assign } from 'lodash';
import { concat } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';

import { Models as P, preismeldungRefId } from '@lik-shared';

import * as cockpit from '../actions/cockpit';
import { blockIfNotLoggedIn } from '../common/effects-extensions';
import {
    dbNames,
    getAllDocumentsForPrefixFromDbName,
    getAllDocumentsForPrefixFromUserDbsKeyed,
} from '../common/pouchdb-utils';
import { getAllAssignedPreismeldungen, loadAllPreiserheber, loadAllPreismeldestellen } from '../common/user-db-values';
import * as fromRoot from '../reducers';

@Injectable()
export class CockpitEffects {
    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadCockpitData$ = this.actions$.pipe(
        ofType('LOAD_COCKPIT_DATA'),
        blockIfNotLoggedIn(this.store),
        flatMap(() =>
            concat(
                [{ type: 'LOAD_COCKPIT_DATA_EXECUTING' }],
                getAllDocumentsForPrefixFromDbName<P.PreismeldungReference>(
                    dbNames.preismeldungen,
                    preismeldungRefId(),
                ).pipe(
                    flatMap(refPreismeldungen =>
                        getAllAssignedPreismeldungen().then(preismeldungen => ({
                            refPreismeldungen,
                            preismeldungen,
                        })),
                    ),
                    flatMap(x =>
                        loadAllPreismeldestellen().pipe(map(preismeldestellen => assign({}, x, { preismeldestellen }))),
                    ),
                    flatMap(x => loadAllPreiserheber().pipe(map(preiserheber => assign({}, x, { preiserheber })))),
                    flatMap(x =>
                        getAllDocumentsForPrefixFromDbName<P.Preiszuweisung>(dbNames.preiszuweisungen, '').pipe(
                            map(preiszuweisungen => assign({}, x, { preiszuweisungen })),
                        ),
                    ),
                    flatMap(x =>
                        getAllDocumentsForPrefixFromUserDbsKeyed<P.LastSyncedAt>('last-synced-at').pipe(
                            map(lastSyncedAt => assign({}, x, { lastSyncedAt })),
                        ),
                    ),
                    map(payload => ({ type: 'LOAD_COCKPIT_DATA_SUCCESS', payload } as cockpit.Action)),
                ),
            ),
        ),
    );
}

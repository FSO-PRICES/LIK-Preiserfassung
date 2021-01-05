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

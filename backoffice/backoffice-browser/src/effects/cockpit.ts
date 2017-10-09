import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { PouchService } from '../services/PouchService';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import * as fromRoot from '../reducers';
import * as cockpit from '../actions/cockpit';
import { Models as P } from 'lik-shared';
import { assign } from 'lodash';

@Injectable()
export class CockpitEffects {
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(private actions$: Actions, private pouchService: PouchService, private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadCockpitData$ = this.actions$.ofType('LOAD_COCKPIT_DATA')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => Observable.concat(
            [{ type: 'LOAD_COCKPIT_DATA_EXECUTING' }],
            this.pouchService.getAllDocumentsForPrefixFromDbName<P.PreismeldungReference>(this.pouchService.dbNames.preismeldung, 'pm-ref/')
                .flatMap(refPreismeldungen => this.pouchService.getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>('pm/').map(preismeldungen => ({ refPreismeldungen, preismeldungen })))
                .flatMap(x => this.pouchService.loadAllPreismeldestellen().map(preismeldestellen => assign({}, x, { preismeldestellen })))
                .flatMap(x => this.pouchService.loadAllPreiserheber().map(preiserheber => assign({}, x, { preiserheber })))
                .flatMap(x => this.pouchService.getAllDocumentsForPrefixFromDbName<P.Preiszuweisung>(this.pouchService.dbNames.preiszuweisung, '').map(preiszuweisungen => assign({}, x, { preiszuweisungen })))
                .flatMap(x => this.pouchService.getAllDocumentsForPrefixFromUserDbsKeyed<P.LastSyncedAt>('last-synced-at').map(lastSyncedAt => assign({}, x, { lastSyncedAt })))
                .map(payload => ({ type: 'LOAD_COCKPIT_DATA_SUCCESS', payload } as cockpit.Action)))
        );
}

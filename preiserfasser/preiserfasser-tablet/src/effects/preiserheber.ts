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

import { Models as P } from 'lik-shared';
import { assign } from 'lodash';

import { getServerUrl, setServerUrl } from './local-storage-utils';
import * as fromRoot from '../reducers';
import * as preiserheber from '../actions/preiserheber';
import { CurrentPreiserheber } from '../reducers/preiserheber';
import { getDatabase } from './pouchdb-utils';

@Injectable()
export class PreiserheberEffects {
    currentPreiserheber$ = this.store.select(fromRoot.getCurrentPreiserheber);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadPreiserheber$ = this.actions$
        .ofType('LOAD_PREISERHEBER')
        .flatMap(() => getDatabase())
        .flatMap(db => db.get('preiserheber'))
        .map(erheber => ({ type: 'LOAD_PREISERHEBER_SUCCESS', payload: erheber } as preiserheber.Action ));

    @Effect()
    savePreiserheber$ = this.actions$
        .ofType('SAVE_PREISERHEBER')
        .withLatestFrom(this.currentPreiserheber$, (_, currentPreiserheber) => currentPreiserheber)
        .flatMap(currentPreiserheber => {
            return getDatabase()
                .then(db => db.get(`preiserheber`).then(doc => ({ db, doc })))
                .then(({ db, doc }) => db.put(assign({}, doc, this.propertiesFromCurrentPreiserheber(currentPreiserheber))).then(() => db))
                .then(db => db.get(`preiserheber`));
        })
        .map(currentPreiserheber => ({ type: 'SAVE_PREISERHEBER_SUCCESS', payload: currentPreiserheber } as preiserheber.Action));

    private propertiesFromCurrentPreiserheber(currentPreiserheber: CurrentPreiserheber) {
        return {
            firstName: currentPreiserheber.firstName,
            surname: currentPreiserheber.surname,
            languageCode: currentPreiserheber.languageCode,
            telephone: currentPreiserheber.telephone,
            mobilephone: currentPreiserheber.mobilephone,
            email: currentPreiserheber.email,
            fax: currentPreiserheber.fax,
            webseite: currentPreiserheber.webseite,
            street: currentPreiserheber.street,
            postcode: currentPreiserheber.postcode,
            town: currentPreiserheber.town
        } as P.Erheber;
    }
}

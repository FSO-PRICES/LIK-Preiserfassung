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

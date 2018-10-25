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
import { Store } from '@ngrx/store';
import { Effect, Actions } from '@ngrx/effects';

import { assign } from 'lodash';

import { getDatabase, getAllDocumentsForPrefix } from './pouchdb-utils';
import * as fromRoot from '../reducers';
import { CurrentPreismeldestelle } from '../reducers/preismeldestellen';
import { preismeldestelleId } from 'lik-shared';

@Injectable()
export class PreismeldestelleEffects {
    currentPreismeldestelle$ = this.store.select(fromRoot.getCurrentPreismeldestelle);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadPreismeldestellen$ = this.actions$
        .ofType('PREISMELDESTELLEN_LOAD_ALL')
        .flatMap(() => getDatabase())
        .flatMap(db =>
            db.allDocs(Object.assign({}, getAllDocumentsForPrefix(preismeldestelleId()), { include_docs: true }))
        )
        .map(allDocs => ({ type: 'PREISMELDESTELLEN_LOAD_SUCCESS', payload: allDocs.rows.map(x => x.doc) }));

    @Effect()
    savePreismeldung$ = this.actions$
        .ofType('SAVE_PREISMELDESTELLE')
        .withLatestFrom(this.currentPreismeldestelle$, (_, currentPreismeldestelle) => currentPreismeldestelle)
        .flatMap(currentPreismeldestelle => {
            return getDatabase()
                .then(db => db.get(preismeldestelleId(currentPreismeldestelle.pmsNummer)).then(doc => ({ db, doc })))
                .then(({ db, doc }) =>
                    db
                        .put(assign({}, doc, this.propertiesFromCurrentPreismeldestelle(currentPreismeldestelle)))
                        .then(() => db)
                )
                .then(db => db.get(preismeldestelleId(currentPreismeldestelle.pmsNummer)));
        })
        .map(payload => ({ type: 'SAVE_PREISMELDESTELLE_SUCCESS', payload }));

    private propertiesFromCurrentPreismeldestelle(currentPreismeldestelle: CurrentPreismeldestelle) {
        return {
            _id: currentPreismeldestelle._id,
            _rev: currentPreismeldestelle._rev,
            preissubsystem: currentPreismeldestelle.preissubsystem,
            name: currentPreismeldestelle.name,
            supplement: currentPreismeldestelle.supplement,
            street: currentPreismeldestelle.street,
            postcode: currentPreismeldestelle.postcode,
            town: currentPreismeldestelle.town,
            telephone: currentPreismeldestelle.telephone,
            email: currentPreismeldestelle.email,
            internetLink: currentPreismeldestelle.internetLink,
            languageCode: currentPreismeldestelle.languageCode,
            erhebungsregion: currentPreismeldestelle.erhebungsregion,
            erhebungsart: currentPreismeldestelle.erhebungsart,
            pmsGeschlossen: currentPreismeldestelle.pmsGeschlossen,
            erhebungsartComment: currentPreismeldestelle.erhebungsartComment,
            zusatzInformationen: currentPreismeldestelle.zusatzInformationen,
            pmsTop: currentPreismeldestelle.pmsTop,
            kontaktpersons: currentPreismeldestelle.kontaktpersons,
        };
    }
}

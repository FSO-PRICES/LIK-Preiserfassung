import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { assign } from 'lodash';

import { preismeldestelleId } from '@lik-shared';
import { flatMap, map, withLatestFrom } from 'rxjs/operators';
import * as fromRoot from '../reducers';
import { CurrentPreismeldestelle } from '../reducers/preismeldestellen';
import { getAllDocumentsForPrefix, getDatabase } from './pouchdb-utils';

@Injectable()
export class PreismeldestelleEffects {
    currentPreismeldestelle$ = this.store.select(fromRoot.getCurrentPreismeldestelle);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadPreismeldestellen$ = this.actions$.ofType('PREISMELDESTELLEN_LOAD_ALL').pipe(
        flatMap(() => getDatabase()),
        flatMap(db =>
            db.allDocs(Object.assign({}, getAllDocumentsForPrefix(preismeldestelleId()), { include_docs: true })),
        ),
        map(allDocs => ({ type: 'PREISMELDESTELLEN_LOAD_SUCCESS', payload: allDocs.rows.map(x => x.doc) })),
    );

    @Effect()
    savePreismeldung$ = this.actions$.ofType('SAVE_PREISMELDESTELLE').pipe(
        withLatestFrom(this.currentPreismeldestelle$, (_, currentPreismeldestelle) => currentPreismeldestelle),
        flatMap(currentPreismeldestelle => {
            return getDatabase()
                .then(db => db.get(preismeldestelleId(currentPreismeldestelle.pmsNummer)).then(doc => ({ db, doc })))
                .then(({ db, doc }) =>
                    db
                        .put(assign({}, doc, this.propertiesFromCurrentPreismeldestelle(currentPreismeldestelle)))
                        .then(() => db),
                )
                .then(db => db.get(preismeldestelleId(currentPreismeldestelle.pmsNummer)));
        }),
        map(payload => ({ type: 'SAVE_PREISMELDESTELLE_SUCCESS', payload })),
    );

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

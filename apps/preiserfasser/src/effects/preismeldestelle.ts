import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { assign } from 'lodash';
import { from, of } from 'rxjs';
import { catchError, exhaustMap, flatMap, map, withLatestFrom } from 'rxjs/operators';

import { preismeldestelleId } from '@lik-shared';

import * as fromRoot from '../reducers';
import { CurrentPreismeldestelle } from '../reducers/preismeldestellen';
import { getAllDocumentsForPrefix, getDatabase, getDatabaseAsObservable } from './pouchdb-utils';

@Injectable()
export class PreismeldestelleEffects {
    currentPreismeldestelle$ = this.store.select(fromRoot.getCurrentPreismeldestelle);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadPreismeldestellen$ = this.actions$.ofType('PREISMELDESTELLEN_LOAD_ALL').pipe(
        exhaustMap(() =>
            getDatabaseAsObservable().pipe(
                flatMap(db =>
                    db.allDocs(
                        Object.assign({}, getAllDocumentsForPrefix(preismeldestelleId()), { include_docs: true }),
                    ),
                ),
                map(allDocs => ({ type: 'PREISMELDESTELLEN_LOAD_SUCCESS', payload: allDocs.rows.map(x => x.doc) })),
                catchError(payload => of({ type: 'PREISMELDESTELLEN_LOAD_FAILURE', payload })),
            ),
        ),
    );

    @Effect()
    savePreismeldung$ = this.actions$.ofType('SAVE_PREISMELDESTELLE').pipe(
        withLatestFrom(this.currentPreismeldestelle$, (_, currentPreismeldestelle) => currentPreismeldestelle),
        flatMap(currentPreismeldestelle =>
            from(
                getDatabase()
                    .then(db =>
                        db.get(preismeldestelleId(currentPreismeldestelle.pmsNummer)).then(doc => ({ db, doc })),
                    )
                    .then(({ db, doc }) =>
                        db
                            .put(assign({}, doc, this.propertiesFromCurrentPreismeldestelle(currentPreismeldestelle)))
                            .then(() => db),
                    )
                    .then(db => db.get(preismeldestelleId(currentPreismeldestelle.pmsNummer))),
            ).pipe(
                map(payload => ({ type: 'SAVE_PREISMELDESTELLE_SUCCESS', payload })),
                catchError(payload => of({ type: 'SAVE_PREISMELDESTELLE_FAILURE', payload })),
            ),
        ),
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

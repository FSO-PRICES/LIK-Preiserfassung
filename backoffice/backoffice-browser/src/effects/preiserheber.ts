import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import * as preiserheber from '../actions/preiserheber';
import { getDatabase } from './pouchdb-utils';
import { Models as P, CurrentPreiserheber } from '../common-models';;

const PREISERHEBER_DB_NAME = 'preiserheber';

@Injectable()
export class PreiserheberEffects {
    currentPreiserheber$ = this.store.select(fromRoot.getCurrentPreiserheber);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadPreiserheber$ = this.actions$
        .ofType('PREISERHEBER_LOAD')
        .switchMap(() => getDatabase(PREISERHEBER_DB_NAME).then(db => ({ db })))
        .flatMap(x => x.db.allDocs(Object.assign({}, { include_docs: true })).then(res => ({ preiserhebers: res.rows.map(y => y.doc) as P.Erheber[] })))
        .map<preiserheber.Actions>(docs => ({ type: 'PREISERHEBER_LOAD_SUCCESS', payload: docs }));

    @Effect()
    savePreiserheber$ = this.actions$
        .ofType('SAVE_PREISERHEBER')
        .withLatestFrom(this.currentPreiserheber$, (action, currentPreiserheber: CurrentPreiserheber) => ({ currentPreiserheber }))
        .switchMap<CurrentPreiserheber>(({ currentPreiserheber }) => {
            return getDatabase(PREISERHEBER_DB_NAME)
                .then(db => { // Only check if the document exists if an ID is set
                    if (!!currentPreiserheber._id) {
                        return db.get(currentPreiserheber._id).then(doc => ({ db, doc }));
                    }
                    return new Promise<{ db, doc }>((resolve, _) => resolve({ db, doc: {} }));
                })
                .then(({ db, doc }) => { // Create or update the erheber
                    const create = !doc._id;
                    const dbOperation = (create ? db.post : db.put).bind(db);
                    return dbOperation(Object.assign({}, doc, {
                        firstName: currentPreiserheber.firstName,
                        surname: currentPreiserheber.surname,
                        personFunction: currentPreiserheber.personFunction,
                        languageCode: currentPreiserheber.languageCode,
                        telephone: currentPreiserheber.telephone,
                        email: currentPreiserheber.email
                    })).then((response) => ({ db, id: response.id, created: create }));
                })
                // Reload the created erheber
                .then(({ db, id, created }) => db.get(id).then(preiserheber => Object.assign({}, preiserheber, { isModified: false, isSaved: true, isCreated: created })))
                // Initialize a database for created erheber
                .then(erheber =>
                    getDatabase(getPreiserheberDbName(erheber)).then(db => {
                        const erheberUri = 'erheber';
                        // const pmsUri = docuri.route(pmsUriRoute);
                        // const preismeldungReferenceUri = docuri.route(preismeldungReferenceUriRoute);
                        // const preismeldungUri = docuri.route(preismeldungUriRoute);
                        return Promise.all([
                            // Should we create the warenkorb document here? Or when we deliver the database to the device? Otherwise we multiplicate the warenkorb x-times

                            // Create the erheber document
                            db.get(erheberUri).then(resp => {
                                return db.put(Object.assign({}, erheber, { _id: erheberUri, _rev: resp._rev })).then(x => {
                                    return erheber;
                                });
                            }).catch(() => db.put(Object.assign({}, erheber, { _id: erheberUri })).then(x => {
                                return erheber;
                            })),

                            // preismeldungReferenceUriRoute = 'pm-ref/:pmsNummer/ep/:epNummer/lauf/:laufnummer';
                            // preismeldungUriRoute = 'pm/:pmsNummer/ep/:epNummer/lauf/:laufnummer';
                            // Create the preismeldungen docs
                            // db.get()

                            // pmsUriRoute = 'pms/:pmsNummer';
                            // Create the preismeldungstelle(n)
                        ]).then(() => erheber);
                    })
                );
        })
        .map<preiserheber.Actions>(payload => ({ type: 'SAVE_PREISERHEBER_SUCCESS', payload }));
}

function getPreiserheberDbName(preiserheber: P.Erheber) {
    return `erheber_${preiserheber._id}`;
}

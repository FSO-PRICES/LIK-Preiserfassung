import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import * as preiserheber from '../actions/preiserheber';
import { getDatabase, getAllDocumentsForPrefix } from './pouchdb-utils';
import { Erheber, CurrentPreiserheber } from '../common-models';

const DB_NAME = "preiserheber";

@Injectable()
export class PreiserheberEffects {
    currentPreiserheber$ = this.store.select(fromRoot.getCurrentPreiserheber)

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadPreiserheber$ = this.actions$
        .ofType('PREISERHEBER_LOAD')
        .switchMap(({ payload }) => getDatabase(DB_NAME).then(db => ({ db })))
        .flatMap(x => x.db.allDocs(Object.assign({}, getAllDocumentsForPrefix('erheber:'), { include_docs: true })).then(res => ({ preiserhebers: res.rows.map(y => y.doc) as Erheber[] })))
        .map<preiserheber.Actions>(docs => ({ type: 'PREISERHEBER_LOAD_SUCCESS', payload: docs }));

    @Effect()
    savePreiserheber$ = this.actions$
        .ofType('SAVE_PREISERHEBER')
        .withLatestFrom(this.currentPreiserheber$, (action, currentPreiserheber: CurrentPreiserheber) => ({ currentPreiserheber }))
        .switchMap<Erheber>(({ currentPreiserheber }) => {
            return getDatabase(DB_NAME)
                .then(db => {
                    if (!!currentPreiserheber._id) {
                        return db.get(currentPreiserheber._id).then(doc => ({ db, doc }))
                    }
                    return new Promise((resolve, _) => resolve({ db, doc: { _id: `erheber:${currentPreiserheber.firstName}_${currentPreiserheber.surname}` } }))
                })
                .then(({ db, doc }) => {
                    return db.put(Object.assign({}, doc, {
                        firstName: currentPreiserheber.firstName,
                        surname: currentPreiserheber.surname,
                        personFunction: currentPreiserheber.personFunction,
                        languageCode: currentPreiserheber.languageCode,
                        telephone: currentPreiserheber.telephone,
                        email: currentPreiserheber.email
                    })).then(() => ({ db, id: doc._id }))
                })
                .then(({db, id}) => db.get(id).then(preiserheber => Object.assign({}, preiserheber, { isModified: false, isSaved: true })));
        })
        .map<preiserheber.Actions>(payload => ({ type: 'SAVE_PREISERHEBER_SUCCESS', payload }))
}

import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import * as preiszuweisung from '../actions/preiszuweisung';
import { getDatabase } from './pouchdb-utils';
import { Models as P, CurrentPreiszuweisung } from '../common-models';;
import { Preiszuweisung } from '../../../../lik-shared/common/models';

const PREISZUWEISUNG_DB_NAME = 'preiszuweisungen';

@Injectable()
export class PreiszuweisungEffects {
    currentPreiszuweisung$ = this.store.select(fromRoot.getCurrentPreiszuweisung);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadPreiszuweisung$ = this.actions$
        .ofType('PREISZUWEISUNG_LOAD')
        .switchMap(() => getDatabase(PREISZUWEISUNG_DB_NAME).then(db => ({ db })))
        .flatMap(x => x.db.allDocs(Object.assign({}, { include_docs: true })).then(res => ({ preiszuweisungen: res.rows.map(y => y.doc) as P.Preiszuweisung[] })))
        .map<preiszuweisung.Actions>(docs => ({ type: 'PREISZUWEISUNG_LOAD_SUCCESS', payload: docs }));

    @Effect()
    savePreiszuweisung$ = this.actions$
        .ofType('SAVE_PREISZUWEISUNG')
        .withLatestFrom(this.currentPreiszuweisung$, (action, currentPreiszuweisung: CurrentPreiszuweisung) => ({ currentPreiszuweisung }))
        .switchMap<CurrentPreiszuweisung>(({ currentPreiszuweisung }) => {
            return getDatabase(PREISZUWEISUNG_DB_NAME)
                .then(db => { // Only check if the document exists if a revision not already exists
                    if (!!currentPreiszuweisung._rev) {
                        return db.get(currentPreiszuweisung._id).then(doc => ({ db, doc }));
                    }
                    return new Promise<{ db, doc }>((resolve, _) => resolve({ db, doc: {} }));
                })
                .then(({ db, doc }) => { // Create or update the preiszuweisung
                    const create = !doc._rev;
                    const dbOperation = (create ? db.post : db.put).bind(db);
                    return dbOperation(Object.assign({}, doc, <P.Preiszuweisung>{
                        _id: currentPreiszuweisung._id,
                        _rev: currentPreiszuweisung._rev,
                        preismeldestellen: currentPreiszuweisung.preismeldestellen
                    })).then((response) => ({ db, id: response.id, created: create }));
                })
                .then<CurrentPreiszuweisung>(({ db, id, created }) => db.get(id).then(preiszuweisung => Object.assign({}, preiszuweisung, { isModified: false, isSaved: true, isCreated: created })))
        })
        .map<preiszuweisung.Actions>(payload => ({ type: 'SAVE_PREISZUWEISUNG_SUCCESS', payload }));
}

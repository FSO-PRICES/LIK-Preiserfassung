import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { assign } from 'lodash';

import { Models as P } from 'lik-shared';

import { dropDatabase, getAllDocumentsForPrefix, getDatabase, putUserToDatabase, dbNames, getUserDatabaseName } from './pouchdb-utils';
import * as fromRoot from '../reducers';
import * as preiszuweisung from '../actions/preiszuweisung';
import { CurrentPreiszuweisung } from '../reducers/preiszuweisung';
import { loggedIn } from '../common/effects-extensions';

@Injectable()
export class PreiserheberInitializationEffects {
    isLoggedIn = this.store.select(fromRoot.getIsLoggedIn);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    createUserDatabase$ = loggedIn(this.isLoggedIn, this.actions$.ofType('CREATE_USER_DATABASE'), createUserDatabase => createUserDatabase
        .switchMap(action => getDatabase(dbNames.preiserheber).then(db => ({ currentPreiszuweisung: <CurrentPreiszuweisung>action.payload, db })))
        .flatMap(({ currentPreiszuweisung, db }) => db.get(currentPreiszuweisung.preiserheberId).then(doc => ({ preiserheber: <P.Erheber>doc, currentPreiszuweisung })))
        .flatMap(data => dropDatabase(getUserDatabaseName(data.preiserheber)).then(db => data))
        .flatMap(({ preiserheber, currentPreiszuweisung }) =>
            Observable.from(
                currentPreiszuweisung.preismeldestellen.length === 0 ?
                    [Promise.resolve([])] :
                    currentPreiszuweisung.preismeldestellen.map(pms =>
                        getDatabase(dbNames.preismeldung).then(db =>
                            db.allDocs(Object.assign({}, { include_docs: true }, getAllDocumentsForPrefix(`pm-ref/${pms.pmsNummer}`)))
                        ).then(result => result.rows.map(row => Object.assign({}, row.doc, { _rev: undefined })) as P.Preismeldung[])
                    )
            )
                .combineAll<Promise<P.Preismeldung[]>, P.Preismeldung[][]>()
                .flatMap(allProducts =>
                    getDatabase(dbNames.warenkorb)
                        .then(warenkorbDb =>
                            warenkorbDb.get('warenkorb')
                                .then(doc => assign({}, doc, { _rev: undefined }))
                                .then(warenkorb =>
                                    getDatabase(getUserDatabaseName(preiserheber)).then(db => {
                                        const erheber = Object.assign({}, preiserheber, { _id: 'erheber', _rev: undefined });
                                        const products = allProducts.reduce((acc, x) => acc.concat(x), []);
                                        return db.bulkDocs(<any>{
                                            docs: [
                                                erheber,
                                                ...currentPreiszuweisung.preismeldestellen,
                                                ...products,
                                                warenkorb
                                            ]
                                        });
                                    })
                                )
                        )
                        .then(() => ({ preiserheber, currentPreiszuweisung }))
                )
        )
        .flatMap(({ preiserheber, currentPreiszuweisung }) =>
            putUserToDatabase(getUserDatabaseName(preiserheber), { members: { names: [preiserheber._id] } })
                .map(() => currentPreiszuweisung)
        )
        .map(payload => ({ type: 'SAVE_PREISZUWEISUNG_SUCCESS', payload } as preiszuweisung.Action))
    );
}

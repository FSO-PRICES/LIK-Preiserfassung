import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { Models as P } from 'lik-shared';

import { dropDatabase, getAllDocumentsForPrefix, getDatabase, putUserToDatabase, dbNames } from './pouchdb-utils';
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
        .flatMap<{ preiserheber: P.Erheber, currentPreiszuweisung: CurrentPreiszuweisung }>(({ preiserheber, currentPreiszuweisung }) =>
            Observable.from(
                currentPreiszuweisung.preismeldestellen.map(pms =>
                    getDatabase('preismeldungen').then(db =>
                        db.allDocs(Object.assign({}, { include_docs: true }, getAllDocumentsForPrefix(`pm-ref/${pms.pmsNummer}`)))
                    ).then(result => <(P.Preismeldung & P.CouchProperties)[]>result.rows.map(row => Object.assign({}, row.doc, { _rev: undefined })))
                )
            ).combineAll<(P.Preismeldung & P.CouchProperties)[][]>().map(allProducts =>
                getDatabase('warenkorb')
                    .then(
                    warenkorbDb => warenkorbDb.allDocs({ include_docs: true })
                        .then(result => result.rows.map(row => Object.assign({}, row.doc, { _rev: undefined })))
                        .then(warenkorbProducts =>
                            getDatabase(getUserDatabaseName(preiserheber)).then(db => {
                                const erheber = Object.assign({}, preiserheber, { _id: 'erheber', _rev: undefined });
                                const products = allProducts.reduce((acc, x) => acc.concat(x));
                                const warenkorb = { _id: 'warenkorb', products: warenkorbProducts };
                                return db.bulkDocs(<any>{
                                    docs: [
                                        erheber,
                                        ...currentPreiszuweisung.preismeldestellen,
                                        ...products,
                                        warenkorb
                                    ]
                                }).then(() => ({ preiserheber, preismeldestellen: currentPreiszuweisung.preismeldestellen }));
                            })
                        )
                    )
                ).flatMap(x => x)
                .map(() => ({ preiserheber, currentPreiszuweisung }))
        )
        .flatMap(({ preiserheber, currentPreiszuweisung }) =>
            putUserToDatabase(getUserDatabaseName(preiserheber), { members: { names: [preiserheber._id] } })
                .map(() => currentPreiszuweisung)
        )
        .map<preiszuweisung.Actions>(payload => ({ type: 'SAVE_PREISZUWEISUNG_SUCCESS', payload }))
    );
}

function getUserDatabaseName(preiserheber: P.Erheber) {
    return `user_${preiserheber._id}`;
}

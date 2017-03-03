import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import * as preismeldestelle from '../actions/preismeldestelle';
import { getDatabase } from './pouchdb-utils';
import { Models as P, CurrentPreismeldestelle } from '../common-models';;
import { AdvancedPreismeldestelle } from '../../../../lik-shared/common/models';

const PREISMELDESTELLE_DB_NAME = 'preismeldestellen';

@Injectable()
export class PreismeldestelleEffects {
    currentPreismeldestelle$ = this.store.select(fromRoot.getCurrentPreismeldestelle);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadPreismeldestelle$ = this.actions$
        .ofType('PREISMELDESTELLE_LOAD')
        .switchMap(() => getDatabase(PREISMELDESTELLE_DB_NAME).then(db => ({ db })))
        .flatMap(x => x.db.allDocs(Object.assign({}, { include_docs: true })).then(res => ({ preismeldestellen: res.rows.map(y => y.doc) as P.AdvancedPreismeldestelle[] })))
        .map<preismeldestelle.Actions>(docs => ({ type: 'PREISMELDESTELLE_LOAD_SUCCESS', payload: docs }));

    @Effect()
    savePreismeldestelle$ = this.actions$
        .ofType('SAVE_PREISMELDESTELLE')
        .withLatestFrom(this.currentPreismeldestelle$, (action, currentPreismeldestelle: CurrentPreismeldestelle) => ({ currentPreismeldestelle }))
        .switchMap<CurrentPreismeldestelle>(({ currentPreismeldestelle }) => {
            return getDatabase(PREISMELDESTELLE_DB_NAME)
                .then(db => { // Only check if the document exists if a revision not already exists
                    if (!!currentPreismeldestelle._rev) {
                        return db.get(currentPreismeldestelle._id).then(doc => ({ db, doc }));
                    }
                    return new Promise<{ db, doc }>((resolve, _) => resolve({ db, doc: {} }));
                })
                .then(({ db, doc }) => { // Create or update the preismeldestelle
                    const create = !doc._rev;
                    const dbOperation = (create ? db.post : db.put).bind(db);
                    return dbOperation(Object.assign({}, doc, <P.AdvancedPreismeldestelle>{
                        _id: currentPreismeldestelle._id,
                        _rev: currentPreismeldestelle._rev,
                        pmsNummer: currentPreismeldestelle.pmsNummer,
                        name: currentPreismeldestelle.name,
                        supplement: currentPreismeldestelle.supplement,
                        kontaktpersons: currentPreismeldestelle.kontaktpersons,
                        street: currentPreismeldestelle.street,
                        postcode: currentPreismeldestelle.postcode,
                        town: currentPreismeldestelle.town,
                        regionId: currentPreismeldestelle.regionId,
                        languageCode: currentPreismeldestelle.languageCode,
                        telephone: currentPreismeldestelle.telephone,
                        email: currentPreismeldestelle.email,
                        erhebungsart: currentPreismeldestelle.erhebungsart,
                        erhebungsartComment: currentPreismeldestelle.erhebungsartComment,
                        erhebungshaeufigkeit: currentPreismeldestelle.erhebungshaeufigkeit
                    })).then((response) => ({ db, id: response.id, created: create }));
                })
                .then<CurrentPreismeldestelle>(({ db, id, created }) => db.get(id).then(preismeldestelle => Object.assign({}, preismeldestelle, { isModified: false, isSaved: true, isCreated: created })))
        })
        .map<preismeldestelle.Actions>(payload => ({ type: 'SAVE_PREISMELDESTELLE_SUCCESS', payload }));
}

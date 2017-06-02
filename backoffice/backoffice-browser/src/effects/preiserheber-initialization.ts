import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { assign, flatten } from 'lodash';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import { dropDatabase, getDatabase, putUserToDatabase, dbNames, getUserDatabaseName, getAllDocumentsForPrefixFromDb, clearRev, getDatabaseAsObservable, getAllDocumentsForKeysFromDb } from './pouchdb-utils';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import * as preiszuweisung from '../actions/preiszuweisung';
import { CurrentPreiszuweisung } from '../reducers/preiszuweisung';

@Injectable()
export class PreiserheberInitializationEffects {
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    createUserDatabase$ = this.actions$.ofType('CREATE_USER_DATABASE')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(action => getDatabase(dbNames.preiserheber).then(db => ({ currentPreiszuweisung: <CurrentPreiszuweisung>action.payload, db })))
        .flatMap(({ currentPreiszuweisung, db }) => db.get(currentPreiszuweisung.preiserheberId).then(doc => ({ preiserheber: clearRev<P.Erheber>(doc), currentPreiszuweisung, pmsNummers: currentPreiszuweisung.preismeldestellenNummern })))
        .flatMap(data => dropDatabase(getUserDatabaseName(data.preiserheber._id)).then(db => data))
        .flatMap(x => getPreismeldestellen(x.pmsNummers).map(preismeldestellen => assign(x, { preismeldestellen })))
        .flatMap(x => getPreismeldungenAndErhebungsMonat(x.pmsNummers).map(pmData => assign(x, pmData)))
        .flatMap(x => getDatabase(dbNames.warenkorb).then(warenkorbDb => warenkorbDb.get('warenkorb')).then(doc => clearRev<P.WarenkorbDocument>(doc)).then(warenkorb => assign(x, { warenkorb })))
        .map(x => assign(x, { dbSchemaVersion: { _id: 'db-schema-version', version: P.ExpectedDbSchemaVersion } }))
        .flatMap(x => getDatabase(getUserDatabaseName(x.preiserheber._id)).then(db => db.bulkDocs({ docs: [x.erhebungsmonat, x.preiserheber, ...x.preismeldestellen, ...x.preismeldungen, x.warenkorb, x.dbSchemaVersion] } as any)).then(() => x))
        .flatMap(({ preiserheber, currentPreiszuweisung }) => putUserToDatabase(getUserDatabaseName(preiserheber._id), { members: { names: [preiserheber._id] } }).map(() => currentPreiszuweisung))
        .map(payload => ({ type: 'SAVE_PREISZUWEISUNG_SUCCESS', payload } as preiszuweisung.Action));
}

function getPreismeldestellen(pmsNummers: string[]) {
    return getDatabaseAsObservable(dbNames.preismeldestelle)
        .flatMap(db => getAllDocumentsForKeysFromDb(db, pmsNummers.map(x => `pms/${x}`)));
}

function getPreismeldungenAndErhebungsMonat(pmsNummers: string[]) {
    const preismeldungen$ = Observable.fromPromise(getDatabase(dbNames.preismeldung))
        .flatMap(db =>
            Observable.from(pmsNummers.map(pmsNummer => getAllDocumentsForPrefixFromDb(db, `pm-ref/${pmsNummer}`) as Promise<P.Preismeldung[]>))
                .combineAll<Promise<P.Preismeldung[]>, P.Preismeldung[][]>()
                .map(preismeldungenArray => flatten(preismeldungenArray).map(pm => clearRev(pm)))
        );
    return Observable.fromPromise(getDatabase(dbNames.preismeldung))
        .flatMap(db => db.get('erhebungsmonat').then(doc => clearRev<P.Erhebungsmonat>(doc)))
        .flatMap(erhebungsmonat => preismeldungen$.map(preismeldungen => ({ erhebungsmonat, preismeldungen })));
}

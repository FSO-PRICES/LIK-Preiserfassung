import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { assign, groupBy, flattenDeep } from 'lodash';
import { Observable } from 'rxjs';
import * as moment from 'moment';

import * as controlling from '../actions/controlling';
import { getAllDocumentsForPrefixFromUserDbs } from '../common/user-db-values';
import { getAllDocumentsForPrefixFromDbName, listUserDatabases, dbNames, getDatabaseAsObservable, getAllDocumentsForPrefixFromDb } from './pouchdb-utils';
import { copyUserDbErheberDetailsToPreiserheberDb } from '../common/controlling-functions';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import * as fromRoot from '../reducers';

import { Models as P, parseDate } from 'lik-shared';

@Injectable()
export class ControllingEffects {
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    preControllingTasks$ = this.actions$
        .ofType('RUN_PRE-CONTROLLING_TASKS')
        .flatMap(() => copyUserDbErheberDetailsToPreiserheberDb())
        .map(() => ({ type: 'RUN_PRE-CONTROLLING_TASKS_SUCCESS' }));

    @Effect()
    updateStichtage$ = this.actions$
        .ofType(controlling.UPDATE_STICHTAGE)
        .flatMap(() => updateStichtage())
        .map(preismeldungen => controlling.createUpdateStichtageSuccessAction(preismeldungen));

    @Effect()
    runControlling$ = this.actions$
        .ofType(controlling.RUN_CONTROLLING)
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(({ payload }) => getAllDocumentsForPrefixFromDbName<P.PreismeldungReference>(dbNames.preismeldung, 'pm-ref/').map(refPreismeldungen => ({ controllingType: payload, data: { refPreismeldungen } })))
        .flatMap(({ controllingType, data }) => getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>('pm/').map(preismeldungen => ({ controllingType, data: Object.assign(data, { preismeldungen }) })))
        .flatMap(({ controllingType, data }) => getDatabaseAsObservable(dbNames.warenkorb).flatMap(db => db.get<P.WarenkorbDocument>('warenkorb')).map(warenkorb => ({ controllingType, data: Object.assign(data, { warenkorb }) })))
        .map(x => controlling.createRunControllingDataReadyAction(x.controllingType, x.data));
}

function updateStichtage() {
    return listUserDatabases()
        .flatMap(dbnames => Observable.forkJoin(dbnames.map(dbname => getDatabaseAsObservable(dbname).flatMap(db => getAllDocumentsForPrefixFromDb<P.Preismeldung>(db, 'pm/')).map(preismeldungen => ({ dbname, preismeldungen })))))
        .map(x => flattenDeep<{ dbname: string, preismeldung: P.Preismeldung }>(x.map(y => y.preismeldungen.map(preismeldung => ({ preismeldung, dbname: y.dbname })))))
        .flatMap(bags => getAllDocumentsForPrefixFromDbName<P.PreismeldungReference>(dbNames.preismeldung, 'pm-ref/').map(refPreismeldungen => ({ refPreismeldungen, bags })))
        .map(({ refPreismeldungen, bags }) => {
            const stichtagPreismeldungen = bags.filter(bag => !!bag.preismeldung.uploadRequestedAt && bag.preismeldung.erhebungsZeitpunkt === 99);
            return stichtagPreismeldungen
                .map(bag => {
                    const modifiedAt = moment(bag.preismeldung.modifiedAt);
                    const refPreismeldung = refPreismeldungen.find(r => modifiedAt.isAfter(moment(r.erhebungsAnfangsDatum, 'DD.MM.YYYY')) && modifiedAt.isBefore(moment(r.erhebungsEndDatum, 'DD.MM.YYYY')))
                    return {
                        dbname: bag.dbname,
                        preismeldung: assign({}, bag.preismeldung, { erhebungsZeitpunkt: !!refPreismeldung ? refPreismeldung.erhebungsZeitpunkt : bag.preismeldung.erhebungsZeitpunkt })
                    }
                })
                .filter(bag => bag.preismeldung.erhebungsZeitpunkt !== 99)
        })
        .map(bags => ({ bags, groups: groupBy(bags, x => x.dbname) }))
        .flatMap(({ groups, bags }) =>
            Object.keys(groups).length === 0
                ? Observable.of(bags)
                : Observable.forkJoin(Object.keys(groups).map(dbname => getDatabaseAsObservable(dbname).flatMap(db => db.bulkDocs(groups[dbname].map(x => x.preismeldung))))).map(() => bags)
        )
        .map(bags => bags.map(b => b.preismeldung));
}

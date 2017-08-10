import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { assign, groupBy, flattenDeep } from 'lodash';
import { Observable } from 'rxjs';
import * as moment from 'moment';

import { getAllDocumentsForPrefixFromUserDbs } from '../common/user-db-values';
import { getAllDocumentsForPrefixFromDbName, listUserDatabases, dbNames, getDatabaseAsObservable, getAllDocumentsForPrefixFromDb } from './pouchdb-utils';
import { copyUserDbErheberDetailsToPreiserheberDb } from '../common/controlling-functions';
import * as fromRoot from '../reducers';

import { Models as P, parseDate } from 'lik-shared';

@Injectable()
export class ControllingEffects {
    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    preControllingTasks$ = this.actions$
        .ofType('RUN_PRE-CONTROLLING_TASKS')
        .flatMap(() => copyUserDbErheberDetailsToPreiserheberDb())
        .map(() => ({ type: 'RUN_PRE-CONTROLLING_TASKS_SUCCESS' }));

    @Effect()
    updateStichtage$ = this.actions$
        .ofType('UPDATE_STICHTAGE')
        .flatMap(() => updateStichtage())
        .map(payload => ({ type: 'UPDATE_STICHTAGE_SUCCESS', payload }));
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
                    // const modifiedAt = moment('2017-06-23T09:30:46.285+02:00');
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

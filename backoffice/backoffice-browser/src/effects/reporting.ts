import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { PouchService } from '../services/PouchService';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import * as fromRoot from '../reducers';
import * as report from '../actions/report';
import { Models as P, preismeldungRefId, preismeldungId, PreismeldungBag, parseErhebungsarten } from 'lik-shared';
import { assign, flatten } from 'lodash';
import {
    getDatabaseAsObservable,
    dbNames,
    getDocumentByKeyFromDb,
    getAllDocumentsFromDbName,
    getAllDocumentsForPrefixFromDb,
    getDatabase,
} from './pouchdb-utils';
import {
    getAllDocumentsForPrefixFromUserDbs,
    loadAllPreismeldestellen,
    loadAllPreiserheber,
} from '../common/user-db-values';

@Injectable()
export class ReportingEffects {
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(
        private actions$: Actions,
        private pouchService: PouchService,
        private store: Store<fromRoot.AppState>
    ) {}

    @Effect()
    loadReportData$ = this.actions$
        .ofType('LOAD_REPORT_DATA')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(action =>
            Observable.concat(
                [{ type: 'LOAD_REPORT_DATA_EXECUTING' }],
                loadDataForReport(action.payload).then(
                    payload => ({ type: 'LOAD_REPORT_DATA_SUCCESS', payload } as report.Action)
                )
            )
        );
}

async function loadDataForReport(reportType: report.ReportTypes) {
    const alreadyExported = await getAllDocumentsFromDbName<any>(dbNames.exports)
        .map(docs => flatten(docs.map(doc => (doc.preismeldungIds as string[]) || [])))
        .toPromise();

    const refPreismeldungen = await getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(
        await getDatabase(dbNames.preismeldung),
        preismeldungRefId()
    );

    const preismeldungen = await getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>(preismeldungId()).toPromise();
    const preismeldestellen = await loadAllPreismeldestellen().toPromise();
    const preiserheber = await loadAllPreiserheber().toPromise();
    const warenkorb = await (await getDatabase(dbNames.warenkorb)).get<P.WarenkorbDocument>('warenkorb');
    const preiszuweisungen = await getAllDocumentsFromDbName<P.Preiszuweisung>(dbNames.preiszuweisung).toPromise();
    const erhebungsmonat = await (await getDatabase(dbNames.preismeldung)).get<P.Erhebungsmonat>('erhebungsmonat');

    return {
        reportType,
        refPreismeldungen,
        preismeldungen: preismeldungen.map(pm => ({
            pmId: pm._id,
            preismeldung: pm,
            refPreismeldung: refPreismeldungen.find(rpm => rpm.pmId === pm._id) || {},
        })) as PreismeldungBag[],
        preismeldestellen: preismeldestellen.map(pms => ({
            pms,
            erhebungsarten: parseErhebungsarten(pms.erhebungsart),
        })),
        preiserheber,
        warenkorb,
        alreadyExported,
        preiszuweisungen,
        erhebungsmonat: erhebungsmonat.monthAsString,
    } as report.LoadReportSuccess;
}

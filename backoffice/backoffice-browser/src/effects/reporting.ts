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
                loadDataForReport(action.payload)
                    .then(payload => ({ type: 'LOAD_REPORT_DATA_SUCCESS', payload } as report.Action))
                    .then(x => {
                        return x;
                    })
            )
        );
}

async function loadDataForReport(reportType: report.ReportTypes): Promise<report.LoadReportSuccess> {
    const erhebungsmonat = (await (await getDatabase(dbNames.preismeldung)).get<P.Erhebungsmonat>('erhebungsmonat'))
        .monthAsString;
    const preismeldestellen = await loadAllPreismeldestellen().toPromise();

    const loadRefPreismeldungen = async () =>
        await getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(
            await getDatabase(dbNames.preismeldung),
            preismeldungRefId()
        );
    const loadPreismeldungen = async (refPreismeldungen: P.PreismeldungReference[]) =>
        await getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>(preismeldungId()).toPromise();
    const loadPreiserheber = async () => await loadAllPreiserheber().toPromise();
    const loadWarenkorb = async () =>
        await (await getDatabase(dbNames.warenkorb)).get<P.WarenkorbDocument>('warenkorb');
    const loadPreiszuweisungen = async () =>
        await getAllDocumentsFromDbName<P.Preiszuweisung>(dbNames.preiszuweisung).toPromise();

    switch (reportType) {
        case 'monthly': {
            const refPreismeldungen = await loadRefPreismeldungen();
            return {
                reportType,
                preismeldestellen: preismeldestellen.map(pms => ({
                    pms,
                    erhebungsarten: parseErhebungsarten(pms.erhebungsart),
                })),
                preismeldungen: (await loadPreismeldungen(refPreismeldungen)).map(pm => ({
                    pmId: pm._id,
                    preismeldung: pm,
                    refPreismeldung: refPreismeldungen.find(rpm => rpm.pmId === pm._id) || {},
                })) as PreismeldungBag[],
                erhebungsmonat,
                refPreismeldungen,
            };
        }
        case 'organisation': {
            const refPreismeldungen = await loadRefPreismeldungen();
            return {
                reportType,
                preismeldestellen,
                preismeldungen: await loadPreismeldungen(refPreismeldungen),
                preiszuweisungen: await loadPreiszuweisungen(),
                preiserheber: await loadPreiserheber(),
                erhebungsmonat,
            };
        }
        case 'pmsProblems': {
            const refPreismeldungen = await loadRefPreismeldungen();
            return {
                reportType,
                preismeldestellen,
                erhebungsmonat,
            };
        }
        default:
            throw Error('Not known reporType');
    }
}

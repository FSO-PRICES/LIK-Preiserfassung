/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import * as fromRoot from '../reducers';
import * as report from '../actions/report';
import { Models as P, preismeldungRefId, preismeldungId, PreismeldungBag, parseErhebungsarten } from 'lik-shared';
import {
    dbNames,
    getAllDocumentsFromDbName,
    getAllDocumentsForPrefixFromDb,
    getDatabase,
} from '../common/pouchdb-utils';
import {
    getAllDocumentsForPrefixFromUserDbs,
    loadAllPreismeldestellen,
    loadAllPreiserheber,
} from '../common/user-db-values';

@Injectable()
export class ReportingEffects {
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

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
    const erhebungsmonat = (await (await getDatabase(dbNames.preismeldungen)).get<P.Erhebungsmonat>('erhebungsmonat'))
        .monthAsString;
    const preismeldestellen: P.Preismeldestelle[] = await loadAllPreismeldestellen().toPromise();

    const loadRefPreismeldungen = async () =>
        await getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(
            await getDatabase(dbNames.preismeldungen),
            preismeldungRefId()
        );
    const loadPreismeldungen = async () =>
        await getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>(preismeldungId()).toPromise();
    const loadPreiserheber = async () => await loadAllPreiserheber().toPromise();
    const loadWarenkorb = async () =>
        await (await getDatabase(dbNames.warenkorb)).get<P.WarenkorbDocument>('warenkorb');
    const loadPreiszuweisungen = async () =>
        await getAllDocumentsFromDbName<P.Preiszuweisung>(dbNames.preiszuweisungen).toPromise();

    const refPreismeldungen = await loadRefPreismeldungen();

    switch (reportType) {
        case 'monthly': {
            return {
                reportType,
                preismeldestellen: preismeldestellen.map(pms => ({
                    pms,
                    erhebungsarten: parseErhebungsarten(pms.erhebungsart),
                })),
                preismeldungen: (await loadPreismeldungen()).map(pm => ({
                    pmId: pm._id,
                    preismeldung: pm,
                    refPreismeldung: refPreismeldungen.find(rpm => rpm.pmId === pm._id) || {},
                })) as PreismeldungBag[],
                erhebungsmonat,
                refPreismeldungen,
            };
        }
        case 'organisation': {
            return {
                reportType,
                preismeldestellen,
                preismeldungen: await loadPreismeldungen(),
                preiszuweisungen: await loadPreiszuweisungen(),
                preiserheber: await loadPreiserheber(),
                erhebungsmonat,
            };
        }
        case 'pmsProblems': {
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

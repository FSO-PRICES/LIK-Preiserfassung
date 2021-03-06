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
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { flatten } from 'lodash';
import { concat } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';

import { Models as P, parseErhebungsarten, PreismeldungBag, preismeldungId, preismeldungRefId } from '@lik-shared';

import * as report from '../actions/report';
import { blockIfNotLoggedIn } from '../common/effects-extensions';
import {
    dbNames,
    getAllDocumentsForPrefixFromDb,
    getAllDocumentsFromDbName,
    getDatabase,
} from '../common/pouchdb-utils';
import {
    getAllDocumentsForPrefixFromUserDbs,
    loadAllPreiserheber,
    loadAllPreismeldestellen,
} from '../common/user-db-values';
import * as fromRoot from '../reducers';

@Injectable()
export class ReportingEffects {
    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadReportData$ = this.actions$.pipe(
        ofType('LOAD_REPORT_DATA'),
        blockIfNotLoggedIn(this.store),
        flatMap(action =>
            concat(
                [{ type: 'LOAD_REPORT_DATA_EXECUTING' }],
                loadDataForReport(action.payload)
                    .then(payload => ({ type: 'LOAD_REPORT_DATA_SUCCESS', payload } as report.Action))
                    .then(x => {
                        return x;
                    }),
            ),
        ),
    );
}

async function loadDataForReport(reportType: report.ReportTypes): Promise<report.LoadReportSuccess> {
    const erhebungsmonat = (await (await getDatabase(dbNames.preismeldungen)).get<P.Erhebungsmonat>('erhebungsmonat'))
        .monthAsString;
    const preismeldestellen: P.Preismeldestelle[] = await loadAllPreismeldestellen().toPromise();

    const loadAlreadyExported = async () =>
        await getAllDocumentsFromDbName<any>(dbNames.exports)
            .pipe(map(docs => flatten(docs.map(doc => (doc.preismeldungIds as string[]) || []))))
            .toPromise();
    const loadRefPreismeldungen = async () =>
        await getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(
            await getDatabase(dbNames.preismeldungen),
            preismeldungRefId(),
        );
    const loadPreismeldungen = async () =>
        await getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>(preismeldungId()).toPromise();
    const loadPreiserheber = async () => await loadAllPreiserheber().toPromise();
    const loadPreiszuweisungen = async () =>
        await getAllDocumentsFromDbName<P.Preiszuweisung>(dbNames.preiszuweisungen).toPromise();

    const refPreismeldungen = await loadRefPreismeldungen();

    switch (reportType) {
        case 'monthly': {
            const alreadyExported = await loadAlreadyExported();
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
                    exported: alreadyExported.find(pmId => pmId === pm._id) != null,
                })) as PreismeldungBag[],
                erhebungsmonat,
                refPreismeldungen,
            };
        }
        case 'organisation': {
            return {
                reportType,
                preismeldestellen: preismeldestellen.map(pms => ({
                    pms,
                    erhebungsarten: parseErhebungsarten(pms.erhebungsart),
                })),
                preismeldungen: await loadPreismeldungen(),
                preiszuweisungen: await loadPreiszuweisungen(),
                preiserheber: await loadPreiserheber(),
                alreadyExported: await loadAlreadyExported(),
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

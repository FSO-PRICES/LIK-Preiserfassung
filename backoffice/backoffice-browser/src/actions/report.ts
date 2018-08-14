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

import { Models as P, PreismeldungBag } from 'lik-shared';

export const LOAD_REPORT_DATA = 'LOAD_REPORT_DATA';
export const LOAD_REPORT_DATA_EXECUTING = 'LOAD_REPORT_DATA_EXECUTING';
export const LOAD_REPORT_DATA_SUCCESS = 'LOAD_REPORT_DATA_SUCCESS';

export type ReportTypes = 'monthly' | 'organisation' | 'pmsProblems';

export type MonthlyReportData = {
    reportType: 'monthly';
    preismeldestellen: { pms: P.Preismeldestelle; erhebungsarten: P.Erhebungsarten }[];
    preismeldungen: PreismeldungBag[];
    refPreismeldungen: P.PreismeldungReference[];
    erhebungsmonat: string;
};

export type OrganisationReportData = {
    reportType: 'organisation';
    preiserheber: P.Erheber[];
    preismeldestellen: P.Preismeldestelle[];
    preismeldungen: P.Preismeldung[];
    preiszuweisungen: P.Preiszuweisung[];
    erhebungsmonat: string;
};

export type PmsProblemeReportData = {
    reportType: 'pmsProblems';
    preismeldestellen: P.Preismeldestelle[];
    erhebungsmonat: string;
};

export type LoadReportSuccess = {
    reportType: ReportTypes;
} & (MonthlyReportData | OrganisationReportData | PmsProblemeReportData);

export type Action =
    | { type: typeof LOAD_REPORT_DATA }
    | { type: typeof LOAD_REPORT_DATA_EXECUTING }
    | { type: typeof LOAD_REPORT_DATA_SUCCESS; payload: LoadReportSuccess };

export const createLoadReportDataAction = (reportType: ReportTypes): Action => ({
    type: LOAD_REPORT_DATA,
    payload: reportType,
});
export const createLoadReportDataExecutingAction = (): Action => ({ type: LOAD_REPORT_DATA_EXECUTING });
export const createLoadReportDataSuccessAction = (payload: LoadReportSuccess): Action => ({
    type: LOAD_REPORT_DATA_SUCCESS,
    payload,
});

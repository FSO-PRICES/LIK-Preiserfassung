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

import * as report from '../actions/report';

import { groupBy } from 'lodash';
import { Models as P } from 'lik-shared';
import { prepareMonthlyData, prepareOrganisationData, preparePmsProblemeData } from '../common/report-functions';

export type MonthlyReport = {
    zeitpunkt: {
        erhebungsmonat: string;
        erstellungsdatum: string;
    };

    preismeldungen: {
        total: number;
        erfasst: number;
        new: number;
    };

    erhebungsart: {
        'N/A': number;
        internetZentral: number;
        normalerhebung: number;
    };

    bearbeitungsCode: {
        'N/A': number;
        '0': number;
        '99': number;
        '1': number;
        '2': number;
        '3': number;
        '7': number;
        '44': number;
        '101': number;
        Aktion: number;
    };

    preisentwicklungen: {
        stabil: number;
        gestiegen: number;
        aktionsende: number;
        gesunken: number;
        aktionAusverkauf: number;
    };

    erhebungsartDetailPm: { [art in keyof P.Erhebungsarten]: number } & { total: number };
    erhebungsartDetailPms: { [art in keyof P.Erhebungsarten]: number } & { total: number };
};

export type OrganisationReport = {
    zeitpunkt: {
        erhebungsmonat: string;
        erstellungsdatum: string;
    };

    erhebungsregionen: {
        [ort: string]: {
            pm: number;
            pms: number;
        };
    };

    preiserheber: {
        [name: string]: {
            pm: number;
            pms: number;
        };
    };

    preismeldungen: {
        [pms: string]: {
            pm: number;
            peName: string;
        };
    };
};

export type PmsProblemeReport = {
    zeitpunkt: {
        erhebungsmonat: string;
        erstellungsdatum: string;
    };

    pmsGeschlossen: {
        name: string;
        grund: string;
        zusatzinfo: string;
    }[];
};

export interface State {
    isExecuting: boolean;
    monthly: MonthlyReport;
    organisation: OrganisationReport;
    pmsProblems: PmsProblemeReport;
}

const initialState: State = {
    isExecuting: false,
    monthly: null,
    organisation: null,
    pmsProblems: null,
};

export function reducer(state = initialState, action: report.Action): State {
    switch (action.type) {
        case report.LOAD_REPORT_DATA_EXECUTING: {
            return {
                ...initialState,
                isExecuting: true,
            };
        }
        case report.LOAD_REPORT_DATA_SUCCESS: {
            const reportHandlers: { [Type in report.ReportTypes]: (payload: report.LoadReportSuccess) => any } = {
                monthly: prepareMonthlyData,
                organisation: prepareOrganisationData,
                pmsProblems: preparePmsProblemeData,
            };
            const reportType = action.payload.reportType;
            return {
                ...state,
                [reportType]: reportHandlers[reportType](action.payload),
                isExecuting: false,
            };
        }
        default:
            return state;
    }
}

export const getReportData = (state: State) => state;
export const getReportIsExecuting = (state: State) => state.isExecuting;
export const getMonthlyReportData = (state: State) => state.monthly;
export const getOrganisationReportData = (state: State) => state.organisation;
export const getPmsProblemeReportData = (state: State) => state.pmsProblems;

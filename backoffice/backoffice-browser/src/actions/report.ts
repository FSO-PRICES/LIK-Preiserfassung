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
    alreadyExported: string[];
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

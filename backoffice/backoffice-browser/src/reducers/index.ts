import { createSelector } from 'reselect';
import { compose } from '@ngrx/core/compose';
import { combineReducers, ActionReducer } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
import { storeLogger } from 'ngrx-store-logger';

import * as P from 'lik-shared';
import { environment } from '../environments/environment';

import * as fromCockpit from './cockpit';
import * as fromControlling from './controlling';
import * as fromError from './error';
import * as fromExporter from './exporter';
import * as fromImporter from './importer';
import * as fromLanguage from './language';
import * as fromLogin from './login';
import * as fromOnOffline from './onoffline';
import * as fromPreiserheber from './preiserheber';
import * as fromPreismeldestelle from './preismeldestelle';
import * as fromReport from './report';
import { fromWarenkorb, fromPreismeldungen } from 'lik-shared';
import * as fromPreiszuweisung from './preiszuweisung';
import * as fromSetting from './setting';
import * as fromFilterOptions from './filter-options';

export interface AppState {
    cockpit: fromCockpit.State;
    controlling: fromControlling.State;
    errors: fromError.State;
    exporter: fromExporter.State;
    importer: fromImporter.State;
    languages: fromLanguage.State;
    login: fromLogin.State;
    onoffline: fromOnOffline.State;
    preiserhebers: fromPreiserheber.State;
    preismeldestellen: fromPreismeldestelle.State;
    preismeldungen: fromPreismeldungen.State;
    preiszuweisungen: fromPreiszuweisung.State;
    report: fromReport.State;
    settings: fromSetting.State;
    warenkorb: fromWarenkorb.State;
    filterOptions: fromFilterOptions.State;
}

const reducers = {
    cockpit: fromCockpit.reducer,
    controlling: fromControlling.reducer,
    errors: fromError.reducer,
    exporter: fromExporter.reducer,
    importer: fromImporter.reducer,
    languages: fromLanguage.reducer,
    login: fromLogin.reducer,
    onoffline: fromOnOffline.reducer,
    preiserhebers: fromPreiserheber.reducer,
    preismeldestellen: fromPreismeldestelle.reducer,
    preismeldungen: fromPreismeldungen.reducer,
    preiszuweisungen: fromPreiszuweisung.reducer,
    report: fromReport.reducer,
    settings: fromSetting.reducer,
    warenkorb: fromWarenkorb.reducer,
    filterOptions: fromFilterOptions.reducer,
};

const developmentReducer: ActionReducer<AppState> = compose(storeLogger(), storeFreeze, combineReducers)(reducers);
const productionReducer: ActionReducer<AppState> = combineReducers(reducers);

export function reducer(state: AppState, action: any): AppState {
    if (environment.production) {
        return productionReducer(state, action);
    } else {
        return developmentReducer(state, action);
    }
}

export const getControllingState = (state: AppState) => state.controlling;
export const getStichtagPreismeldungenUpdated = createSelector(
    getControllingState,
    fromControlling.getStichtagPreismeldungenUpdated
);
export const getControllingReportData = createSelector(getControllingState, fromControlling.getControllingReportData);
export const getControllingRawCachedData = createSelector(
    getControllingState,
    fromControlling.getControllingRawCachedData
);
export const getControllingReportExecuting = createSelector(
    getControllingState,
    fromControlling.getControllingReportExecuting
);

export const getPreiserheberState = (state: AppState) => state.preiserhebers;
export const getPreiserhebers = createSelector(getPreiserheberState, fromPreiserheber.getAll);
export const getCurrentPreiserheber = createSelector(getPreiserheberState, fromPreiserheber.getCurrentPreiserheber);

export const getPreismeldestelleState = (state: AppState) => state.preismeldestellen;
export const getPreismeldestellen = createSelector(getPreismeldestelleState, fromPreismeldestelle.getAll);
export const getCurrentPreismeldestelle = createSelector(
    getPreismeldestelleState,
    fromPreismeldestelle.getCurrentPreismeldestelle
);
export const getErhebungsregionen = createSelector(getPreismeldestelleState, fromPreismeldestelle.getErhebungsregionen);

export const getPreiszuweisungState = (state: AppState) => state.preiszuweisungen;
export const getPreiszuweisungen = createSelector(getPreiszuweisungState, fromPreiszuweisung.getAll);
export const getCurrentPreiszuweisung = createSelector(
    getPreiszuweisungState,
    fromPreiszuweisung.getCurrentPreiszuweisung
);

export const getSettingState = (state: AppState) => state.settings;
export const getSettings = createSelector(getSettingState, fromSetting.getSettings);
export const getCurrentSettings = createSelector(getSettingState, fromSetting.getCurrentSettings);
export const getIsFullscreen = createSelector(getSettingState, fromSetting.getIsFullscreen);

export const getPreismeldungenState = (state: AppState) => state.preismeldungen;
export const getPreismeldungen = createSelector(getPreismeldungenState, fromPreismeldungen.getAll);
const getCurrentPreismeldung = createSelector(getPreismeldungenState, fromPreismeldungen.getCurrentPreismeldung);
export const getPreismeldungenStatus = createSelector(
    getPreismeldungenState,
    fromPreismeldungen.getPreismeldungenStatus
);
export const getPreismeldungenCurrentPmsNummer = createSelector(
    getPreismeldungenState,
    fromPreismeldungen.getPreismeldungenCurrentPmsNummer
);

export const getLoginState = (state: AppState) => state.login;
export const getIsLoggedIn = createSelector(getLoginState, fromLogin.getIsLoggedIn);
export const getLoggedInUser = createSelector(getLoginState, fromLogin.getLoggedInUser);
export const getLoginError = createSelector(getLoginState, fromLogin.getLoginError);

export const getLastErrors = (state: AppState) => state.errors;
export const getResetPasswordError = (state: AppState) => state.errors.passwordReset;

export const getLanguagesState = (state: AppState) => state.languages;
export const getLanguages = createSelector(getLanguagesState, fromLanguage.getLanguages);
export const getLanguagesList = createSelector(getLanguagesState, fromLanguage.getLanguagesList);

export const getImporterState = (state: AppState) => state.importer;
export const getImporterParsedWarenkorb = createSelector(getImporterState, fromImporter.getParsedWarenkorb);
export const getImportedWarenkorb = createSelector(getImporterState, fromImporter.getImportedWarenkorb);
export const getImportedWarenkorbAt = createSelector(getImporterState, fromImporter.getImportedWarenkorbAt);
export const getWarenkorbErhebungsmonat = createSelector(getImporterState, fromImporter.getWarenkorbErhebungsmonat);

export const getImporterParsedPreismeldestellen = createSelector(
    getImporterState,
    fromImporter.getParsedPreismeldestellen
);
export const getImportedPreismeldestellen = createSelector(getImporterState, fromImporter.getImportedPreismeldestellen);
export const getImportedPreismeldestellenAt = createSelector(
    getImporterState,
    fromImporter.getImportedPreismeldestellenAt
);
export const getPreismeldestellenErhebungsmonat = createSelector(
    getImporterState,
    fromImporter.getPreismeldestellenErhebungsmonat
);

export const getImporterParsedPreismeldungen = createSelector(getImporterState, fromImporter.getParsedPreismeldungen);
export const getImportedPreismeldungen = createSelector(getImporterState, fromImporter.getImportedPreismeldungen);
export const getImportedPreismeldungenAt = createSelector(getImporterState, fromImporter.getImportedPreismeldungenAt);
export const getPreismeldungenErhebungsmonat = createSelector(
    getImporterState,
    fromImporter.getPreismeldungenErhebungsmonat
);

export const getImportedAllDataAt = createSelector(getImporterState, fromImporter.getImportedAllDataAt);

export const getExporterState = (state: AppState) => state.exporter;
export const getExportedPreismeldungen = createSelector(getExporterState, fromExporter.getExportedPreismeldungen);
export const getExportedPreismeldestellen = createSelector(getExporterState, fromExporter.getExportedPreismeldestellen);
export const getExportedPreiserheber = createSelector(getExporterState, fromExporter.getExportedPreiserheber);

export const getCockpitState = (state: AppState) => state.cockpit;
export const getCockpitReportData = createSelector(getCockpitState, fromCockpit.getCockpitReportData);
export const getCockpitIsExecuting = createSelector(getCockpitState, fromCockpit.getCockpitIsExecuting);

export const getReportState = (state: AppState) => state.report;
export const getReportData = createSelector(getReportState, fromReport.getReportData);
export const getMonthlyReportData = createSelector(getReportState, fromReport.getMonthlyReportData);
export const getOrganisationReportData = createSelector(getReportState, fromReport.getOrganisationReportData);
export const getPmsProblemeReportData = createSelector(getReportState, fromReport.getPmsProblemeReportData);
export const getReportIsExecuting = createSelector(getReportState, fromReport.getReportIsExecuting);

export const getWarenkorbState = (state: AppState) => state.warenkorb;

export const getOnOfflineState = (state: AppState) => state.onoffline;
export const getIsOffline = createSelector(getOnOfflineState, fromOnOffline.getIsOffline);

export const getCurrentPreismeldungViewBag = createSelector(
    getCurrentPreismeldung,
    (currentPreismeldungBag): P.CurrentPreismeldungViewBag => {
        function isReadonly() {
            if (!currentPreismeldungBag) return false;
            return !currentPreismeldungBag.preismeldung.uploadRequestedAt || currentPreismeldungBag.exported;
        }
        return !currentPreismeldungBag
            ? null
            : {
                  ...currentPreismeldungBag,
                  isReadonly: isReadonly(),
              };
    }
);

export const getFilterOptionsState = (state: AppState) => state.filterOptions;
export const getCurrentPreismeldungListFilter = createSelector(
    getFilterOptionsState,
    fromFilterOptions.getCurrentPreismeldungListFilter
);

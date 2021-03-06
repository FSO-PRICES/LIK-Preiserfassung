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

import { MetaReducer } from '@ngrx/store';

import { storeLogger } from 'ngrx-store-logger';
import { createSelector } from 'reselect';

import * as P from '@lik-shared';
import { fromPreismeldungen, fromWarenkorb } from '@lik-shared';

import { environment } from '../environments/environment';
import * as fromCockpit from './cockpit';
import * as fromControlling from './controlling';
import * as fromError from './error';
import * as fromExporter from './exporter';
import * as fromFilterOptions from './filter-options';
import * as fromImporter from './importer';
import * as fromLanguage from './language';
import * as fromLogin from './login';
import * as fromOnOffline from './onoffline';
import * as fromPreiserheber from './preiserheber';
import * as fromPreismeldestelle from './preismeldestelle';
import * as fromPreismeldungenStatus from './preismeldungen-status';
import * as fromPreiszuweisung from './preiszuweisung';
import * as fromReport from './report';
import * as fromWritePermission from './write-permission';
import * as fromSetting from './setting';

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
    preismeldungenStatus: fromPreismeldungenStatus.State;
    preiszuweisungen: fromPreiszuweisung.State;
    report: fromReport.State;
    settings: fromSetting.State;
    warenkorb: fromWarenkorb.State;
    writePermission: fromWritePermission.State;
    filterOptions: fromFilterOptions.State;
}

export const reducers = {
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
    preismeldungenStatus: fromPreismeldungenStatus.reducer,
    preiszuweisungen: fromPreiszuweisung.reducer,
    report: fromReport.reducer,
    settings: fromSetting.reducer,
    warenkorb: fromWarenkorb.reducer,
    writePermission: fromWritePermission.reducer,
    filterOptions: fromFilterOptions.reducer,
};

export const metaReducers: MetaReducer<AppState>[] = [...(!environment.production ? [storeLogger()] : [])];

export const getControllingState = (state: AppState) => state.controlling;
export const getStichtagPreismeldungenUpdated = createSelector(
    getControllingState,
    fromControlling.getStichtagPreismeldungenUpdated,
);
export const getControllingReportData = createSelector(
    getControllingState,
    fromControlling.getControllingReportData,
);
export const getControllingRawCachedData = createSelector(
    getControllingState,
    fromControlling.getControllingRawCachedData,
);
export const getControllingReportExecuting = createSelector(
    getControllingState,
    fromControlling.getControllingReportExecuting,
);

export const getPreiserheberState = (state: AppState) => state.preiserhebers;
export const getPreiserhebers = createSelector(
    getPreiserheberState,
    fromPreiserheber.getAll,
);
export const getCurrentPreiserheber = createSelector(
    getPreiserheberState,
    fromPreiserheber.getCurrentPreiserheber,
);

export const getPreismeldestelleState = (state: AppState) => state.preismeldestellen;
export const getPreismeldestellen = createSelector(
    getPreismeldestelleState,
    fromPreismeldestelle.getAll,
);
export const getCurrentPreismeldestelle = createSelector(
    getPreismeldestelleState,
    fromPreismeldestelle.getCurrentPreismeldestelle,
);
export const getErhebungsregionen = createSelector(
    getPreismeldestelleState,
    fromPreismeldestelle.getErhebungsregionen,
);

export const getPreiszuweisungState = (state: AppState) => state.preiszuweisungen;
export const getPreiszuweisungen = createSelector(
    getPreiszuweisungState,
    fromPreiszuweisung.getAll,
);
export const getCurrentPreiszuweisung = createSelector(
    getPreiszuweisungState,
    fromPreiszuweisung.getCurrentPreiszuweisung,
);

export const getSettingState = (state: AppState) => state.settings;
export const getSettings = createSelector(
    getSettingState,
    fromSetting.getSettings,
);
export const getCurrentSettings = createSelector(
    getSettingState,
    fromSetting.getCurrentSettings,
);
export const getSedexSettings = createSelector(
    getSettingState,
    fromSetting.getSedexSettings,
);
export const getIsFullscreen = createSelector(
    getSettingState,
    fromSetting.getIsFullscreen,
);
export const getHasExportedDatabases = createSelector(
    getSettingState,
    fromSetting.getHasExportedDatabases,
);
export const getHasImportedDatabases = createSelector(
    getSettingState,
    fromSetting.getHasImportedDatabases,
);

export const getPreismeldungenState = (state: AppState) => state.preismeldungen;
export const getPreismeldungen = createSelector(
    getPreismeldungenState,
    fromPreismeldungen.getAll,
);
const getCurrentPreismeldung = createSelector(
    getPreismeldungenState,
    fromPreismeldungen.getCurrentPreismeldung,
);
export const getPreismeldungenStatus = createSelector(
    getPreismeldungenState,
    fromPreismeldungen.getPreismeldungenStatus,
);
export const getPreismeldungenCurrentPmsNummer = createSelector(
    getPreismeldungenState,
    fromPreismeldungen.getPreismeldungenCurrentPmsNummer,
);

export const getPreismeldungenStatusState = (state: AppState) => state.preismeldungenStatus;
export const getPreismeldungenStatusMap = createSelector(
    getPreismeldungenStatusState,
    fromPreismeldungenStatus.getPreismeldungenStatusMap,
);
export const getPreismeldungenStatusMapMissingCount = createSelector(
    getPreismeldungenStatusState,
    fromPreismeldungenStatus.getPreismeldungenStatusMapMissingCount,
);
export const getPreismeldungenStatusMapUpdatedCount = createSelector(
    getPreismeldungenStatusState,
    fromPreismeldungenStatus.getPreismeldungenStatusMapUpdatedCount,
);
export const getArePreismeldungenStatusInitializing = createSelector(
    getPreismeldungenStatusState,
    fromPreismeldungenStatus.getAreStatusInitializing,
);

export const getLoginState = (state: AppState) => state.login;
export const getIsLoggedIn = createSelector(
    getLoginState,
    fromLogin.getIsLoggedIn,
);
export const getLoggedInUser = createSelector(
    getLoginState,
    fromLogin.getLoggedInUser,
);
export const getLoginError = createSelector(
    getLoginState,
    fromLogin.getLoginError,
);

export const getLastErrors = (state: AppState) => state.errors;
export const getResetPasswordError = (state: AppState) => state.errors.passwordReset;

export const getLanguagesState = (state: AppState) => state.languages;
export const getLanguages = createSelector(
    getLanguagesState,
    fromLanguage.getLanguages,
);
export const getLanguagesList = createSelector(
    getLanguagesState,
    fromLanguage.getLanguagesList,
);

export const getImporterState = (state: AppState) => state.importer;
export const getImporterParsedWarenkorb = createSelector(
    getImporterState,
    fromImporter.getParsedWarenkorb,
);
export const getImportedWarenkorb = createSelector(
    getImporterState,
    fromImporter.getImportedWarenkorb,
);
export const getImportedWarenkorbAt = createSelector(
    getImporterState,
    fromImporter.getImportedWarenkorbAt,
);
export const getWarenkorbErhebungsmonat = createSelector(
    getImporterState,
    fromImporter.getWarenkorbErhebungsmonat,
);

export const getImporterParsedPreismeldestellen = createSelector(
    getImporterState,
    fromImporter.getParsedPreismeldestellen,
);
export const getImportedPreismeldestellen = createSelector(
    getImporterState,
    fromImporter.getImportedPreismeldestellen,
);
export const getImportedPreismeldestellenAt = createSelector(
    getImporterState,
    fromImporter.getImportedPreismeldestellenAt,
);
export const getPreismeldestellenErhebungsmonat = createSelector(
    getImporterState,
    fromImporter.getPreismeldestellenErhebungsmonat,
);

export const getImporterParsedPreismeldungen = createSelector(
    getImporterState,
    fromImporter.getParsedPreismeldungen,
);
export const getImportedPreismeldungen = createSelector(
    getImporterState,
    fromImporter.getImportedPreismeldungen,
);
export const getImportedPreismeldungenAt = createSelector(
    getImporterState,
    fromImporter.getImportedPreismeldungenAt,
);
export const getPreismeldungenErhebungsmonat = createSelector(
    getImporterState,
    fromImporter.getPreismeldungenErhebungsmonat,
);

export const getImportedAllDataAt = createSelector(
    getImporterState,
    fromImporter.getImportedAllDataAt,
);
export const getImportError = createSelector(
    getImporterState,
    fromImporter.getImportError,
);

export const getExporterState = (state: AppState) => state.exporter;
export const getExportedPreismeldungen = createSelector(
    getExporterState,
    fromExporter.getExportedPreismeldungen,
);
export const getExportedPreismeldestellen = createSelector(
    getExporterState,
    fromExporter.getExportedPreismeldestellen,
);
export const getExportedPreiserheber = createSelector(
    getExporterState,
    fromExporter.getExportedPreiserheber,
);

export const getCockpitState = (state: AppState) => state.cockpit;
export const getCockpitReportData = createSelector(
    getCockpitState,
    fromCockpit.getCockpitReportData,
);
export const getCockpitIsExecuting = createSelector(
    getCockpitState,
    fromCockpit.getCockpitIsExecuting,
);
export const getCockpitSelectedPreiserheber = createSelector(
    getCockpitState,
    fromCockpit.getSelectedPreiserheber,
);

export const getReportState = (state: AppState) => state.report;
export const getReportData = createSelector(
    getReportState,
    fromReport.getReportData,
);
export const getMonthlyReportData = createSelector(
    getReportState,
    fromReport.getMonthlyReportData,
);
export const getOrganisationReportData = createSelector(
    getReportState,
    fromReport.getOrganisationReportData,
);
export const getPmsProblemeReportData = createSelector(
    getReportState,
    fromReport.getPmsProblemeReportData,
);
export const getReportIsExecuting = createSelector(
    getReportState,
    fromReport.getReportIsExecuting,
);

export const getWarenkorbState = (state: AppState) => state.warenkorb;
export const getWarenkorb = createSelector(
    getWarenkorbState,
    fromWarenkorb.getWarenkorb,
);

export const getOnOfflineState = (state: AppState) => state.onoffline;
export const getIsOffline = createSelector(
    getOnOfflineState,
    fromOnOffline.getIsOffline,
);
export const getMinVersion = createSelector(
    getOnOfflineState,
    fromOnOffline.getMinVersion,
);
export const getCanConnectToDatabase = createSelector(
    getOnOfflineState,
    fromOnOffline.getCanConnectToDatabase,
);

export const getWritePermissionState = (state: AppState) => state.writePermission;
export const hasWritePermission = createSelector(
    getWritePermissionState,
    fromWritePermission.hasWritePermission,
);
export const canToggleWritePermission = createSelector(
    getWritePermissionState,
    fromWritePermission.canToggleWritePermission,
);

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
    },
);

export const getFilterOptionsState = (state: AppState) => state.filterOptions;
export const getCurrentPreismeldungListFilter = createSelector(
    getFilterOptionsState,
    fromFilterOptions.getCurrentPreismeldungListFilter,
);

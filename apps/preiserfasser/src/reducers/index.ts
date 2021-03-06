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
import { isBefore } from 'date-fns';
import { storeLogger } from 'ngrx-store-logger';
import { createSelector } from 'reselect';

import * as P from '@lik-shared';
import { environment } from '../environments/environment';

import { fromPreismeldungen, fromWarenkorb } from '@lik-shared';
import * as fromAppConfig from './app-config';
import * as fromDatabase from './database';
import * as fromErhebungsInfo from './erhebungsinfo';
import * as fromError from './error';
import * as fromLanguages from './languages';
import * as fromLogin from './login';
import * as fromPdf from './pdf';
import * as fromPreiserheber from './preiserheber';
import * as fromPreismeldestellen from './preismeldestellen';
import * as fromSettings from './setting';
import * as fromStatistics from './statistics';
import * as fromTime from './time';

export interface AppState {
    appConfig: fromAppConfig.State;
    database: fromDatabase.State;
    erhebungsInfo: fromErhebungsInfo.State;
    error: fromError.State;
    languages: fromLanguages.State;
    login: fromLogin.State;
    preiserheber: fromPreiserheber.State;
    preismeldestellen: fromPreismeldestellen.State;
    preismeldungen: fromPreismeldungen.State;
    settings: fromSettings.State;
    statistics: fromStatistics.State;
    time: fromTime.State;
    warenkorb: fromWarenkorb.State;
    pdf: fromPdf.State;
}

export const reducers = {
    error: fromError.reducer,
    appConfig: fromAppConfig.reducer,
    database: fromDatabase.reducer,
    erhebungsInfo: fromErhebungsInfo.reducer,
    languages: fromLanguages.reducer,
    login: fromLogin.reducer,
    preiserheber: fromPreiserheber.reducer,
    preismeldestellen: fromPreismeldestellen.reducer,
    preismeldungen: fromPreismeldungen.reducer,
    settings: fromSettings.reducer,
    statistics: fromStatistics.reducer,
    time: fromTime.reducer,
    warenkorb: fromWarenkorb.reducer,
    pdf: fromPdf.reducer,
};

export const metaReducers: MetaReducer<AppState>[] = [...(!environment.production ? [storeLogger()] : [])];

export const getAppConfigState = (state: AppState) => state.appConfig;
export const getIsDesktop = createSelector(
    getAppConfigState,
    fromAppConfig.getIsDesktop,
);

export const getPreismeldestellenState = (state: AppState) => state.preismeldestellen;
export const getPreismeldestellen = createSelector(
    getPreismeldestellenState,
    fromPreismeldestellen.getAll,
);
export const getCurrentPreismeldestelle = createSelector(
    getPreismeldestellenState,
    fromPreismeldestellen.getCurrentPreismeldestelle,
);

export const getPreismeldungenState = (state: AppState) => state.preismeldungen;
export const getPreismeldungen = createSelector(
    getPreismeldungenState,
    fromPreismeldungen.getAll,
);
export const getPreismeldungenIsInRecordMode = createSelector(
    getPreismeldungenState,
    fromPreismeldungen.getPreismeldungenIsInRecordMode,
);
const getCurrentPreismeldung = createSelector(
    getPreismeldungenState,
    fromPreismeldungen.getCurrentPreismeldung,
);
export const getPriceCountStatuses = createSelector(
    getPreismeldungenState,
    fromPreismeldungen.getPriceCountStatuses,
);
export const getPreismeldungenCurrentPmsNummer = createSelector(
    getPreismeldungenState,
    fromPreismeldungen.getPreismeldungenCurrentPmsNummer,
);
export const getMarkedPreismeldungen = createSelector(
    getPreismeldungenState,
    fromPreismeldungen.getMarkedPreismeldungen,
);

export const getTimeState = (state: AppState) => state.time;
export const getCurrentTime = createSelector(
    getTimeState,
    fromTime.getCurrentTime,
);
export const getCurrentDate = createSelector(
    getTimeState,
    fromTime.getCurrentDate,
);

export const getLanguagesState = (state: AppState) => state.languages;
export const getLanguages = createSelector(
    getLanguagesState,
    fromLanguages.getLanguages,
);
export const getLanguagesList = createSelector(
    getLanguagesState,
    fromLanguages.getLanguagesList,
);
export const getLanguageCodes = createSelector(
    getLanguagesState,
    fromLanguages.getLanguageCodes,
);
export const getCurrentLanguage = createSelector(
    getLanguagesState,
    fromLanguages.getCurrentLangugage,
);

export const getWarenkorbState = (state: AppState) => state.warenkorb;
export const getWarenkorb = createSelector(
    getWarenkorbState,
    fromWarenkorb.getWarenkorb,
);

export const getSettingsState = (state: AppState) => state.settings;
export const getSettings = createSelector(
    getSettingsState,
    fromSettings.getSettings,
);
export const getCurrentSettings = createSelector(
    getSettingsState,
    fromSettings.getCurrentSettings,
);

export const getPreiserheberState = (state: AppState) => state.preiserheber;
export const getPreiserheber = createSelector(
    getPreiserheberState,
    fromPreiserheber.getPreiserheber,
);
export const getCurrentPreiserheber = createSelector(
    getPreiserheberState,
    fromPreiserheber.getCurrentPreiserheber,
);

export const getStatisticsState = (state: AppState) => state.statistics;
export const getPreismeldungenStatistics = createSelector(
    getStatisticsState,
    fromStatistics.getPreismeldungenStatistics,
);
export const getErhebungsmonat = createSelector(
    getStatisticsState,
    fromStatistics.getErhebungsmonat,
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

export const getErhebungsInfo = (state: AppState) => state.erhebungsInfo;

export const getCurrentPreismeldungViewBag = createSelector(
    getCurrentPreismeldung,
    getCurrentDate,
    (currentPreismeldungBag, currentDate): P.CurrentPreismeldungViewBag => {
        function isReadonly() {
            if (!currentPreismeldungBag) return false;
            if (!!currentPreismeldungBag.preismeldung.uploadRequestedAt) return true;
            if (!currentPreismeldungBag.refPreismeldung) return false;
            const dateRegex = /(\d+)\.(\d+)\.(\d+)/;
            const parsed = dateRegex.exec(currentPreismeldungBag.refPreismeldung.erhebungsAnfangsDatum);
            if (!parsed) return false;
            const erhebungsAnfangsDatum = new Date(+parsed[3], +parsed[2] - 1, +parsed[1] - 1);
            return isBefore(currentDate, erhebungsAnfangsDatum);
        }
        return !currentPreismeldungBag
            ? null
            : {
                  ...currentPreismeldungBag,
                  isReadonly: isReadonly(),
              };
    },
);

export const getPdfState = (state: AppState) => state.pdf;
export const getCreatedPmsPdf = createSelector(
    getPdfState,
    fromPdf.getCreatedPmsPdf,
);

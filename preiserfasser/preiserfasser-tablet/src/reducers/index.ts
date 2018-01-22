import { createSelector } from 'reselect';
import { compose } from '@ngrx/core/compose';
import { combineReducers, ActionReducer } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
import { storeLogger } from 'ngrx-store-logger';
import { isBefore } from 'date-fns';

import { environment } from '../environments/environment';
import * as P from 'lik-shared';

import * as fromAppConfig from './app-config';
import * as fromDatabase from './database';
import * as fromErhebungsInfo from './erhebungsinfo';
import * as fromLanguages from './languages';
import * as fromLogin from './login';
import * as fromPreiserheber from './preiserheber';
import * as fromPreismeldestellen from './preismeldestellen';
import { fromWarenkorb, fromPreismeldungen } from 'lik-shared';
import * as fromSettings from './setting';
import * as fromStatistics from './statistics';
import * as fromTime from './time';
import * as fromPdf from './pdf';

export interface AppState {
    appConfig: fromAppConfig.State;
    database: fromDatabase.State;
    erhebungsInfo: fromErhebungsInfo.State;
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

const reducers = {
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

const developmentReducer: ActionReducer<AppState> = compose(storeLogger(), storeFreeze, combineReducers)(reducers);
const productionReducer: ActionReducer<AppState> = combineReducers(reducers);

export function reducer(state: AppState, action: any): AppState {
    if (environment.production) {
        return productionReducer(state, action);
    } else {
        return developmentReducer(state, action);
    }
}

export const getAppConfigState = (state: AppState) => state.appConfig;
export const getIsDesktop = createSelector(getAppConfigState, fromAppConfig.getIsDesktop);

export const getPreismeldestellenState = (state: AppState) => state.preismeldestellen;
export const getPreismeldestellen = createSelector(getPreismeldestellenState, fromPreismeldestellen.getAll);
export const getCurrentPreismeldestelle = createSelector(
    getPreismeldestellenState,
    fromPreismeldestellen.getCurrentPreismeldestelle
);

export const getPreismeldungenState = (state: AppState) => state.preismeldungen;
export const getPreismeldungen = createSelector(getPreismeldungenState, fromPreismeldungen.getAll);
const getCurrentPreismeldung = createSelector(getPreismeldungenState, fromPreismeldungen.getCurrentPreismeldung);
export const getPriceCountStatuses = createSelector(getPreismeldungenState, fromPreismeldungen.getPriceCountStatuses);
export const getPreismeldungenCurrentPmsNummer = createSelector(
    getPreismeldungenState,
    fromPreismeldungen.getPreismeldungenCurrentPmsNummer
);

export const getTimeState = (state: AppState) => state.time;
export const getCurrentTime = createSelector(getTimeState, fromTime.getCurrentTime);

export const getLanguagesState = (state: AppState) => state.languages;
export const getLanguages = createSelector(getLanguagesState, fromLanguages.getLanguages);
export const getLanguagesList = createSelector(getLanguagesState, fromLanguages.getLanguagesList);
export const getLanguageCodes = createSelector(getLanguagesState, fromLanguages.getLanguageCodes);
export const getCurrentLanguage = createSelector(getLanguagesState, fromLanguages.getCurrentLangugage);

export const getWarenkorb = (state: AppState) => state.warenkorb;

export const getSettingsState = (state: AppState) => state.settings;
export const getSettings = createSelector(getSettingsState, fromSettings.getSettings);
export const getCurrentSettings = createSelector(getSettingsState, fromSettings.getCurrentSettings);

export const getPreiserheberState = (state: AppState) => state.preiserheber;
export const getPreiserheber = createSelector(getPreiserheberState, fromPreiserheber.getPreiserheber);
export const getCurrentPreiserheber = createSelector(getPreiserheberState, fromPreiserheber.getCurrentPreiserheber);

export const getStatisticsState = (state: AppState) => state.statistics;
export const getPreismeldungenStatistics = createSelector(
    getStatisticsState,
    fromStatistics.getPreismeldungenStatistics
);
export const getErhebungsmonat = createSelector(getStatisticsState, fromStatistics.getErhebungsmonat);

export const getLoginState = (state: AppState) => state.login;
export const getIsLoggedIn = createSelector(getLoginState, fromLogin.getIsLoggedIn);
export const getLoggedInUser = createSelector(getLoginState, fromLogin.getLoggedInUser);

export const getErhebungsInfo = (state: AppState) => state.erhebungsInfo;

export const getCurrentPreismeldungViewBag = createSelector(
    getCurrentPreismeldung,
    getCurrentTime,
    (currentPreismeldungBag, currentTime): P.CurrentPreismeldungViewBag => {
        function isReadonly() {
            if (!currentPreismeldungBag) return false;
            if (!!currentPreismeldungBag.preismeldung.uploadRequestedAt) return true;
            if (!currentPreismeldungBag.refPreismeldung) return false;
            const dateRegex = /(\d+)\.(\d+)\.(\d+)/;
            const parsed = dateRegex.exec(currentPreismeldungBag.refPreismeldung.erhebungsAnfangsDatum);
            if (!parsed) return false;
            const erhebungsAnfangsDatum = new Date(+parsed[3], +parsed[2] - 1, +parsed[1] - 1);
            return isBefore(currentTime, erhebungsAnfangsDatum) ? true : false;
        }
        return !currentPreismeldungBag
            ? null
            : {
                ...currentPreismeldungBag,
                isReadonly: isReadonly(),
            };
    }
);

export const getPdfState = (state: AppState) => state.pdf;
export const getCreatedPmsPdf = createSelector(getPdfState, fromPdf.getCreatedPmsPdf);

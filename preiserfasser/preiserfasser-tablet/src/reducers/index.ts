import { createSelector } from 'reselect';
import { compose } from '@ngrx/core/compose';
import { combineReducers, ActionReducer } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
import { storeLogger } from 'ngrx-store-logger';

import { environment } from '../environments/environment';
import * as fromPreismeldestellen from './preismeldestellen';
import * as fromPreiserheber from './preiserheber';
import * as fromAppConfig from './app-config';
import * as fromPreismeldungen from './preismeldungen';
import * as fromTime from './time';
import * as fromDatabase from './database';
import * as fromLanguages from './languages';
import * as fromWarenkorb from './warenkorb';
import * as fromSettings from './setting';
import * as fromStatistics from './statistics';

export interface AppState {
    appConfig: fromAppConfig.State;
    database: fromDatabase.State;
    languages: fromLanguages.State;
    preiserheber: fromPreiserheber.State;
    preismeldestellen: fromPreismeldestellen.State;
    preismeldungen: fromPreismeldungen.State;
    time: fromTime.State;
    warenkorb: fromWarenkorb.State;
    settings: fromSettings.State;
    statistics: fromStatistics.State;
}

const reducers = {
    appConfig: fromAppConfig.reducer,
    database: fromDatabase.reducer,
    languages: fromLanguages.reducer,
    preiserheber: fromPreiserheber.reducer,
    preismeldestellen: fromPreismeldestellen.reducer,
    preismeldungen: fromPreismeldungen.reducer,
    time: fromTime.reducer,
    warenkorb: fromWarenkorb.reducer,
    settings: fromSettings.reducer,
    statistics: fromStatistics.reducer,
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
export const getCurrentPreismeldestelle = createSelector(getPreismeldestellenState, fromPreismeldestellen.getCurrentPreismeldestelle);

export const getPreismeldungenState = (state: AppState) => state.preismeldungen;
export const getPreismeldungen = createSelector(getPreismeldungenState, fromPreismeldungen.getAll);
export const getCurrentPreismeldung = createSelector(getPreismeldungenState, fromPreismeldungen.getCurrentPreismeldung);
export const getPriceCountStatuses = createSelector(getPreismeldungenState, fromPreismeldungen.getPriceCountStatuses);
export const getPreismeldungenCurrentPmsNummer = createSelector(getPreismeldungenState, fromPreismeldungen.getPreismeldungenCurrentPmsNummer);

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
export const getCurrentPreiserheber = createSelector(getPreiserheberState , fromPreiserheber.getCurrentPreiserheber);

export const getStatisticsState = (state: AppState) => state.statistics;
export const getPreismeldungenStatistics = createSelector(getStatisticsState, fromStatistics.getPreismeldungenStatistics);
export const getErhebungsmonat = createSelector(getStatisticsState, fromStatistics.getErhebungsmonat);

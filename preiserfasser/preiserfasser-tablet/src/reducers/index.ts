import { createSelector } from 'reselect';
import { compose } from '@ngrx/core/compose';
import { combineReducers, ActionReducer } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
import { storeLogger } from "ngrx-store-logger";

import { environment } from '../environments/environment';
import * as fromPreismeldestellen from './preismeldestellen';
import * as fromAppConfig from './app-config';
import * as fromPreismeldungen from './preismeldungen';
import * as fromTime from './time';
import * as fromDatabase from './database';
import * as fromLanguages from './languages';

export interface AppState {
    database: fromDatabase.State;
    appConfig: fromAppConfig.State;
    preismeldestellen: fromPreismeldestellen.State;
    preismeldungen: fromPreismeldungen.State;
    time: fromTime.State;
    languages: fromLanguages.State;
}

const reducers = {
    database: fromDatabase.reducer,
    appConfig: fromAppConfig.reducer,
    preismeldestellen: fromPreismeldestellen.reducer,
    preismeldungen: fromPreismeldungen.reducer,
    time: fromTime.reducer,
    languages: fromLanguages.reducer
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
export const getSelectedPreismeldestelle = createSelector(getPreismeldestellenState, fromPreismeldestellen.getSelected);

export const getPreismeldungenState = (state: AppState) => state.preismeldungen;
export const getPreismeldungen = createSelector(getPreismeldungenState, fromPreismeldungen.getAll);
export const getCurrentPreismeldung = createSelector(getPreismeldungenState, fromPreismeldungen.getCurrentPreismeldung);

export const getTimeState = (state: AppState) => state.time;
export const getCurrentTime = createSelector(getTimeState, fromTime.getCurrentTime);

export const getLanguagesState = (state: AppState) => state.languages;
export const getLanguages = createSelector(getLanguagesState, fromLanguages.getCurrentLangugage);
export const getCurrentLanguage = createSelector(getLanguagesState, fromLanguages.getCurrentLangugage);

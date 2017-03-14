import { createSelector } from 'reselect';
import { compose } from '@ngrx/core/compose';
import { combineReducers, ActionReducer } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
import { storeLogger } from 'ngrx-store-logger';

import { environment } from '../environments/environment';
import * as fromPreiserheber from './preiserheber';
import * as fromPreismeldestelle from './preismeldestelle';
import * as fromPreismeldung from './preismeldung';
import * as fromPreiszuweisung from './preiszuweisung';
import * as fromSetting from './setting';
import * as fromLogin from './login';

export interface AppState {
    settings: fromSetting.State;
    preiserhebers: fromPreiserheber.State;
    preismeldestellen: fromPreismeldestelle.State;
    preismeldungen: fromPreismeldung.State;
    preiszuweisungen: fromPreiszuweisung.State;
    login: fromLogin.State;
}

const reducers = {
    settings: fromSetting.reducer,
    preiserhebers: fromPreiserheber.reducer,
    preismeldestellen: fromPreismeldestelle.reducer,
    preismeldungen: fromPreismeldung.reducer,
    preiszuweisungen: fromPreiszuweisung.reducer,
    login: fromLogin.reducer,
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

export const getPreiserheberState = (state: AppState) => state.preiserhebers;
export const getPreiserhebers = createSelector(getPreiserheberState, fromPreiserheber.getAll);
export const getCurrentPreiserheber = createSelector(getPreiserheberState, fromPreiserheber.getCurrentPreiserheber);


export const getPreismeldestelleState = (state: AppState) => state.preismeldestellen;
export const getPreismeldestellen = createSelector(getPreismeldestelleState, fromPreismeldestelle.getAll);
export const getCurrentPreismeldestelle = createSelector(getPreismeldestelleState, fromPreismeldestelle.getCurrentPreismeldestelle);


export const getPreiszuweisungState = (state: AppState) => state.preiszuweisungen;
export const getPreiszuweisungen = createSelector(getPreiszuweisungState, fromPreiszuweisung.getAll);
export const getCurrentPreiszuweisung = createSelector(getPreiszuweisungState, fromPreiszuweisung.getCurrentPreiszuweisung);


export const getSettingState = (state: AppState) => state.settings;
export const getSettings = createSelector(getSettingState, fromSetting.getSettings);
export const getCurrentSettings = createSelector(getSettingState, fromSetting.getCurrentSettings);


export const getPreismeldungenState = (state: AppState) => state.preismeldungen;
export const getPreismeldungen = createSelector(getPreismeldungenState, fromPreismeldung.getAll);
export const getPreismeldungenAreLoaded = createSelector(getPreismeldungenState, fromPreismeldung.getIsLoaded);


export const getIsLoggedIn = (state: AppState) => state.login.isLoggedIn;

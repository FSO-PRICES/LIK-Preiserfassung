import { createSelector } from 'reselect';
import { compose } from '@ngrx/core/compose';
import { combineReducers, ActionReducer } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
import { storeLogger } from "ngrx-store-logger";

import { environment } from '../environments/environment';
import * as fromPreismeldestellen from './preismeldestellen';
import * as fromAppConfig from './app-config';

export interface AppState {
    appConfig: fromAppConfig.State;
    preismeldestellen: fromPreismeldestellen.State;
}

const reducers = {
    appConfig: fromAppConfig.reducer,
    preismeldestellen: fromPreismeldestellen.reducer
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

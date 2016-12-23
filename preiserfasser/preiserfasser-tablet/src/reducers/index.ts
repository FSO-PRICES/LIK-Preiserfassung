import { createSelector } from 'reselect';
import { compose } from '@ngrx/core/compose';
import { combineReducers, ActionReducer } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
import { storeLogger } from "ngrx-store-logger";

import { environment } from '../environments/environment';
import * as fromPreismeldestellen from './preismeldestellen';
import * as fromAppConfig from './app-config';
import * as fromProducts from './products';

export interface AppState {
    appConfig: fromAppConfig.State;
    preismeldestellen: fromPreismeldestellen.State;
    products: fromProducts.State
}

const reducers = {
    appConfig: fromAppConfig.reducer,
    preismeldestellen: fromPreismeldestellen.reducer,
    products: fromProducts.reducer
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

export const getProductsState = (state: AppState) => state.products;
export const getProducts = createSelector(getProductsState, fromProducts.getAll);

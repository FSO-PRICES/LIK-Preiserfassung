import { createSelector } from 'reselect';
import { compose } from '@ngrx/core/compose';
import { combineReducers, ActionReducer } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
import { storeLogger } from "ngrx-store-logger";

import { environment } from '../environments/environment';
import * as fromPreiserheber from './preiserheber';

export interface AppState {
    preiserhebers: fromPreiserheber.State;
}

const reducers = {
    preiserhebers: fromPreiserheber.reducer,
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

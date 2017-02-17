import { createSelector } from 'reselect';
import { compose } from '@ngrx/core/compose';
import { combineReducers, ActionReducer } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
import { storeLogger } from 'ngrx-store-logger';

import { environment } from '../environments/environment';
import * as fromPreiserheber from './preiserheber';
import * as fromPreismeldestelle from './preismeldestelle';

export interface AppState {
    preiserhebers: fromPreiserheber.State;
    preismeldestellen: fromPreismeldestelle.State;
}

const reducers = {
    preiserhebers: fromPreiserheber.reducer,
    preismeldestellen: fromPreismeldestelle.reducer,
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

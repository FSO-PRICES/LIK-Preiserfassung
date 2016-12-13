import { compose } from '@ngrx/core/compose';
import { combineReducers } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
import { storeLogger } from "ngrx-store-logger";

import { environment } from '../environments/environment';
import * as preismeldestelle from './preismeldestelle';

export interface State {
    preismeldestellen: preismeldestelle.State
}

const reducers = {
    preismeldestellen: preismeldestelle.reducer
};

export function reducer(state: State, action: any) {
    if (environment.production) {
        return combineReducers(reducers)(state, action);
    } else {
        // return compose(storeLogger(), storeFreeze, combineReducers)(reducers);
        return compose(storeLogger(), storeFreeze, combineReducers)(reducers)(state, action);
    }
}

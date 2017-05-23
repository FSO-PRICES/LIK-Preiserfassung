import * as time from '../actions/time';
import { assign } from 'lodash';
import { startOfDay, differenceInMilliseconds, addMilliseconds } from 'date-fns';

export interface State {
    currentTime: Date;
    mockDate: Date;
    erhebungsMonat: Date;
}

const initialState: State = {
    currentTime: new Date(),
    mockDate: null,
    // mockDate: new Date(2017, 1, 10),
    erhebungsMonat: null
};

export function reducer(state = initialState, action: time.Actions): State {
    switch (action.type) {
        case 'TIME_SET': {
            const diff = !state.mockDate ? 0 : differenceInMilliseconds(state.mockDate, startOfDay(action.payload));
            return assign({}, state, { currentTime: addMilliseconds(action.payload, diff) });
        }

        default:
            return state;
    }
}

export const getCurrentTime = (state: State) => state.currentTime;

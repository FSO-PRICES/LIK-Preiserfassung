import * as time from '../actions/time';
import { assign } from 'lodash';
import { startOfDay, differenceInMilliseconds, addMilliseconds, isEqual } from 'date-fns';

export interface State {
    currentTime: Date;
    currentDate: Date;
    mockDate: Date;
    erhebungsMonat: Date;
}

const today = new Date();
const initialState: State = {
    currentTime: today,
    currentDate: startOfDay(today),
    mockDate: null,
    // mockDate: new Date(2017, 1, 10),
    erhebungsMonat: null,
};

export function reducer(state = initialState, action: time.Actions): State {
    switch (action.type) {
        case 'TIME_SET': {
            const date = action.payload;
            const diff = !state.mockDate ? 0 : differenceInMilliseconds(state.mockDate, startOfDay(date));
            const startOfDate = startOfDay(date);
            return {
                ...state,
                currentTime: addMilliseconds(date, diff),
                currentDate: isEqual(startOfDate, state.currentDate) ? state.currentDate : startOfDate,
            };
        }

        default:
            return state;
    }
}

export const getCurrentTime = (state: State) => state.currentTime;
export const getCurrentDate = (state: State) => state.currentDate;

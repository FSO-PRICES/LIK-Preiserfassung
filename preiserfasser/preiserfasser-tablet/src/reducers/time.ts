import * as time from '../actions/time';

export interface State {
    currentTime: Date;
}

const initialState: State = {
    currentTime: new Date()
};

export function reducer(state = initialState, action: time.Actions): State {
    switch (action.type) {
        case 'TIME_SET':
            return { currentTime: action.payload };

        default:
            return state;
    }
}

export const getCurrentTime = (state: State) => state.currentTime;

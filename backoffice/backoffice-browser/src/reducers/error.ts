import * as error from '../actions/error';

export interface State {
    passwordReset: string;
};

const initialState: State = {
    passwordReset: null
};

export function reducer(state = initialState, action: error.Action): State {
    switch (action.type) {
        case 'PASSWORD_RESET_SUCCESS': {
            return Object.assign({}, state, { passwordReset: null });
        }
        case 'PASSWORD_RESET_FAIL': {
            return Object.assign({}, state, { passwordReset: action.payload });
        }
        default:
            return state;
    }
}

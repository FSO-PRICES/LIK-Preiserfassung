import * as appConfig from '../actions/database';

export interface State {
    databaseExists?: boolean;
    isDatabaseSyncing: boolean;
}

const initialState: State = {
    databaseExists: null,
    isDatabaseSyncing: false
};

export function reducer(state = initialState, action: appConfig.Actions): State {
    switch (action.type) {
        case 'SET_DATABASE_EXISTS':
            return Object.assign({}, state, { databaseExists: action.payload });

        case 'SET_IS_DATABASE_SYNCING':
            return Object.assign({}, state, { isDatabaseSyncing: action.payload });

        default:
            return state;
    }
}


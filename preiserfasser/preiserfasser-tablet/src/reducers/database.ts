import * as appConfig from '../actions/database';

export interface State {
    databaseExists?: boolean;
    isDatabaseSyncing: boolean;
    canConnectToDatabase: boolean;
    lastUploadedAt: Date;
}

const initialState: State = {
    databaseExists: null,
    isDatabaseSyncing: false,
    canConnectToDatabase: false,
    lastUploadedAt: null
};

export function reducer(state = initialState, action: appConfig.Actions): State {
    switch (action.type) {
        case 'SET_DATABASE_LAST_UPLOADED_AT':
            return Object.assign({}, state, { lastUploadedAt: action.payload });

        case 'CHECK_CONNECTIVITY_TO_DATABASE':
            return Object.assign({}, state, { canConnectToDatabase: null });

        case 'SET_CONNECTIVITY_STATUS':
            return Object.assign({}, state, { canConnectToDatabase: action.payload });

        case 'DATABASE_SYNC':
        case 'CHECK_DATABASE_EXISTS':
            return Object.assign({}, state, { databaseExists: null });

        case 'SET_DATABASE_EXISTS':
            return Object.assign({}, state, { databaseExists: action.payload });

        case 'SET_IS_DATABASE_SYNCING':
            return Object.assign({}, state, { isDatabaseSyncing: action.payload });

        default:
            return state;
    }
}


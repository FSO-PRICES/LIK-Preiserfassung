import * as database from '../actions/database';

export interface State {
    databaseExists?: boolean;
    isDatabaseSyncing: boolean;
    canConnectToDatabase: boolean;
    lastUploadedAt: Date;
    syncError: string;
}

const initialState: State = {
    databaseExists: null,
    isDatabaseSyncing: false,
    canConnectToDatabase: false,
    lastUploadedAt: null,
    syncError: null
};

export function reducer(state = initialState, action: database.Actions): State {
    switch (action.type) {
        case 'SET_DATABASE_LAST_UPLOADED_AT':
            return Object.assign({}, state, { lastUploadedAt: action.payload });

        case 'RESET_CONNECTIVITY_TO_DATABASE':
            return Object.assign({}, state, { canConnectToDatabase: null });

        case 'SET_CONNECTIVITY_STATUS':
            return Object.assign({}, state, { canConnectToDatabase: action.payload });

        case 'SET_DATABASE_IS_SYNCING':
            return Object.assign({}, state, { isDatabaseSyncing: true });

        case 'SYNC_DATABASE_FAILURE':
            return Object.assign({}, state, { isDatabaseSyncing: false, syncError: action.payload });

        case 'SYNC_DATABASE_SUCCESS':
            return Object.assign({}, state, { databaseExists: true, isDatabaseSyncing: false, syncError: null });

        case 'CHECK_DATABASE_EXISTS':
            return Object.assign({}, state, { databaseExists: null });

        case 'SET_DATABASE_EXISTS':
            return Object.assign({}, state, { databaseExists: action.payload });

        default:
            return state;
    }
}


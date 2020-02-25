import * as database from '../actions/database';

export interface State {
    databaseExists?: boolean;
    isDatabaseSyncing: SyncState;
    canConnectToDatabase: boolean | null;
    isCompatibleToDatabase: boolean | null;
    lastUploadedAt: Date;
    lastSyncedAt: Date;
    syncError: string;
}

export enum SyncState {
    none = 0,
    syncing = 1,
    ready = 2,
    error = 3,
}

const initialState: State = {
    databaseExists: null,
    isDatabaseSyncing: SyncState.none,
    canConnectToDatabase: null,
    isCompatibleToDatabase: null,
    lastUploadedAt: null,
    lastSyncedAt: null,
    syncError: null,
};

export function reducer(state = initialState, action: database.Actions): State {
    switch (action.type) {
        case 'SET_DATABASE_LAST_UPLOADED_AT':
            return { ...state, lastUploadedAt: action.payload };

        case 'RESET_CONNECTIVITY_TO_DATABASE':
            return { ...state, canConnectToDatabase: null };

        case 'SET_CONNECTIVITY_STATUS':
            return { ...state, canConnectToDatabase: action.payload };

        case 'SET_COMPATIBILITY_STATUS':
            return { ...state, isCompatibleToDatabase: action.payload };

        case 'RESET_DATABASE_SYNC_STATE':
            return { ...state, isDatabaseSyncing: SyncState.none, syncError: null };

        case 'SET_DATABASE_IS_SYNCING':
            return { ...state, isDatabaseSyncing: SyncState.syncing, syncError: null };

        case 'SYNC_DATABASE_FAILURE':
            return { ...state, isDatabaseSyncing: SyncState.error, syncError: action.payload };

        case 'SYNC_DATABASE_SUCCESS':
            return {
                ...state,
                databaseExists: true,
                isDatabaseSyncing: SyncState.ready,
                syncError: null,
                lastSyncedAt: action.payload || state.lastSyncedAt,
            };

        case 'CHECK_DATABASE_EXISTS':
            return { ...state, databaseExists: null };

        case 'SET_DATABASE_EXISTS':
            return { ...state, databaseExists: action.payload };

        case 'LOAD_DATABASE_LAST_SYNCED_AT_SUCCESS':
            return { ...state, lastSyncedAt: action.payload };

        default:
            return state;
    }
}

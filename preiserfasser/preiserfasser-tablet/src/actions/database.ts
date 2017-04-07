export type Actions =
    { type: 'DELETE_DATABASE', payload: null } |
    { type: 'CHECK_CONNECTIVITY_TO_DATABASE', payload: null } |
    { type: 'SET_CONNECTIVITY_STATUS', payload: boolean } |
    { type: 'DATABASE_SYNC', payload: null } |
    { type: 'CHECK_DATABASE_EXISTS', payload: null } |
    { type: 'SET_DATABASE_EXISTS', payload: boolean } |
    { type: 'SET_IS_DATABASE_SYNCING', payload: boolean };

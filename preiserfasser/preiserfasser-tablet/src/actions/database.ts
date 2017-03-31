export type Actions =
    { type: 'DATABASE_SYNC', payload: null } |
    { type: 'SET_DATABASE_EXISTS', payload: boolean } |
    { type: 'SET_IS_DATABASE_SYNCING', payload: boolean };

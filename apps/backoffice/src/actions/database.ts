export type Action =
    { type: 'SET_DATABASE_EXISTS', payload: boolean } |
    { type: 'SET_IS_DATABASE_SYNCING', payload: boolean };
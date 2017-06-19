export type Actions =
    { type: 'DELETE_DATABASE', payload: null } |
    { type: 'DOWNLOAD_DATABASE', payload: { url: string, username: string } } |
    { type: 'UPLOAD_DATABASE', payload: { url: string, username: string } } |
    { type: 'SET_DATABASE_IS_SYNCING', payload: null } |
    { type: 'SYNC_DATABASE', payload: { url: string, username: string } } |
    { type: 'SYNC_DATABASE_SUCCESS', payload: null } |
    { type: 'SYNC_DATABASE_FAILURE', payload: string | any } |
    { type: 'CHECK_CONNECTIVITY_TO_DATABASE', payload: null } |
    { type: 'RESET_CONNECTIVITY_TO_DATABASE', payload: null } |
    { type: 'SET_CONNECTIVITY_STATUS', payload: boolean } |
    { type: 'CHECK_DATABASE_EXISTS', payload: null } |
    { type: 'SET_DATABASE_EXISTS', payload: boolean } |
    { type: 'CHECK_DATABASE_LAST_UPLOADED_AT', payload: null } |
    { type: 'SET_DATABASE_LAST_UPLOADED_AT', payload: Date };

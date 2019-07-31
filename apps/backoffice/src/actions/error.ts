export type Action =
    { type: 'PASSWORD_RESET_FAIL', payload: string } |
    { type: 'PASSWORD_RESET_SUCCESS', payload: null };

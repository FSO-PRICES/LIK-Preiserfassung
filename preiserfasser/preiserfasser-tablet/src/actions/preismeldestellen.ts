import * as P  from '../common-models';

export type Actions =
    { type: 'PREISMELDESTELLEN_LOAD_SUCCESS', payload: P.Models.Preismeldestelle[] } |
    { type: 'PREISMELDESTELLE_SELECT', payload: string };

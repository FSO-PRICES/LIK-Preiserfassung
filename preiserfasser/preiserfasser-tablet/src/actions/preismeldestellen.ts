import * as P  from '../common-models';

export type Actions =
    { type: 'PREISMELDESTELLEN_LOAD_SUCCESS', payload: P.Models.Preismeldestelle[] } |
    { type: 'PREISMELDUNGEN_LOAD_SUCCESS', payload: { pms: P.Models.Preismeldestelle } } |
    { type: 'PREISMELDESTELLE_SELECT', payload: string };

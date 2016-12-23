import { Preismeldestelle }  from '../common-models';

export type Actions =
    { type: 'PREISMELDESTELLEN_LOAD_SUCCESS', payload: Preismeldestelle[] } |
    { type: 'PREISMELDESTELLE_SELECT', payload: string };

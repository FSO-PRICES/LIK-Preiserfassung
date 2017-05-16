import { Models as P } from 'lik-shared';

export type Action =
    { type: 'EXPORT_PREISMELDUNGEN' } |
    { type: 'EXPORT_PREISMELDUNGEN_RESET', payload: null } |
    { type: 'EXPORT_PREISMELDUNGEN_SUCCESS', payload: number } |
    { type: 'EXPORT_PREISMELDESTELLEN' } |
    { type: 'EXPORT_PREISMELDESTELLEN_RESET', payload: null } |
    { type: 'EXPORT_PREISMELDESTELLEN_SUCCESS', payload: number } |
    { type: 'EXPORT_PREISERHEBER', payload: ({ preiserheber: P.Erheber, pmsNummers: string[] })[] } |
    { type: 'EXPORT_PREISERHEBER_RESET', payload: null } |
    { type: 'EXPORT_PREISERHEBER_SUCCESS', payload: number };

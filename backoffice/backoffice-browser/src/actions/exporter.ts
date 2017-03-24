import { Models as P } from 'lik-shared';

export type Action =
    { type: 'EXPORT_PREISMELDUNGEN', payload: P.CompletePreismeldung[] } |
    { type: 'EXPORT_PREISMELDUNGEN_SUCCESS', payload: number };

export namespace Type {
    export const preismeldungen = 'preismeldungen';
}

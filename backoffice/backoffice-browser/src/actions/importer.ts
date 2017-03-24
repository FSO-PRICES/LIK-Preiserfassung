import { Models as P } from 'lik-shared';

export type Action =
    { type: 'PARSE_FILE', payload: { file: File, parseType: string } } |
    { type: 'PARSE_FILE_SUCCESS', payload: { data: string[][], parsedType: string } } |
    { type: 'IMPORT_PREISMELDESTELLEN', payload: string[][] } |
    { type: 'IMPORT_PREISMELDESTELLEN_SUCCESS', payload: P.AdvancedPreismeldestelle[] } |
    { type: 'IMPORT_PREISMELDUNGEN', payload: string[][] } |
    { type: 'IMPORT_PREISMELDUNGEN_SUCCESS', payload: P.PreismeldungReference[] } |
    { type: 'LOAD_LATEST_IMPORTED_AT' } |
    { type: 'LOAD_LATEST_IMPORTED_AT_SUCCESS', payload: { latestImportAt: number, _id: string }[] };

export namespace Type {
    export const preismeldestellen = 'preismeldestellen';
    export const preismeldungen = 'preismeldungen';
}

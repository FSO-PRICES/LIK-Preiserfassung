import { Models as P } from 'lik-shared';

export type Action =
    | { type: 'PARSE_WARENKORB_FILE'; payload: { file: File; language: string } }
    | { type: 'PARSE_WARENKORB_FILE_SUCCESS'; payload: { data: string[][]; language: string } }
    | { type: 'PARSE_FILE'; payload: { file: File; parseType: string } }
    | { type: 'PARSE_FILE_SUCCESS'; payload: { data: string[][]; parsedType: string } }
    | { type: 'CLEAR_PARSED_FILES'; payload: null }
    | { type: 'IMPORT_STARTED'; payload: null }
    | { type: 'IMPORT_WARENKORB_SUCCESS'; payload: P.WarenkorbDocument }
    | { type: 'IMPORT_PREISMELDESTELLEN'; payload: string[][] }
    | { type: 'IMPORT_PREISMELDESTELLEN_SUCCESS'; payload: P.Preismeldestelle[] }
    | { type: 'IMPORT_PREISMELDESTELLEN_FAILURE'; payload: string }
    | { type: 'IMPORT_PREISMELDUNGEN'; payload: string[][] }
    | { type: 'IMPORT_PREISMELDUNGEN_SUCCESS'; payload: P.PreismeldungReference[] }
    | { type: 'LOAD_LATEST_IMPORTED_AT' }
    | { type: 'LOAD_LATEST_IMPORTED_AT_SUCCESS'; payload: { latestImportAt: number; _id: string }[] }
    | { type: 'IMPORTED_ALL_RESET'; payload: null }
    | { type: 'IMPORTED_ALL_SUCCESS'; payload: null }
    | { type: 'IMPORTED_ALL_FAILURE'; payload: string[] }
    | { type: 'LOAD_ERHEBUNGSMONATE'; payload: null }
    | {
          type: 'LOAD_ERHEBUNGSMONATE_SUCCESS';
          payload: {
              warenkorbErhebungsmonat: string;
              preismeldestellenErhebungsmonat: string;
              preismeldungenErhebungsmonat: string;
          };
      };

export namespace Type {
    export const warenkorb = 'warenkorb';
    export const preismeldestellen = 'preismeldestellen';
    export const preismeldungen = 'preismeldungen';
    export const all_data = 'all_data';
}

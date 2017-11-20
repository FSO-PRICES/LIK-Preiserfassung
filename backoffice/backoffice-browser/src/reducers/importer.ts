import * as importer from '../actions/importer';
import { Models as P } from 'lik-shared';

export interface State {
    parsedWarenkorb: {
        de: string[][],
        fr: string[][],
        it: string[][]
    };
    importedWarenkorb: P.WarenkorbDocument;
    importedWarenkorbAt: Date;

    parsedPreismeldestellen: string[][];
    importedPreismeldestellen: P.Preismeldestelle[];
    importedPreismeldestellenAt: Date;

    parsedPreismeldungen: string[][];
    importedPreismeldungen: P.PreismeldungReference[];
    importedPreismeldungenAt: Date;

    warenkorbErhebungsmonat: string;
    preismeldestellenErhebungsmonat: string;
    preismeldungenErhebungsmonat: string;

    importedAllDataAt: Date;
};

const initialState: State = {
    parsedWarenkorb: null,
    importedWarenkorb: null,
    importedWarenkorbAt: null,

    parsedPreismeldestellen: null,
    importedPreismeldestellen: null,
    importedPreismeldestellenAt: null,

    parsedPreismeldungen: null,
    importedPreismeldungen: null,
    importedPreismeldungenAt: null,

    warenkorbErhebungsmonat: null,
    preismeldestellenErhebungsmonat: null,
    preismeldungenErhebungsmonat: null,

    importedAllDataAt: null,
};

export function reducer(state = initialState, action: importer.Action): State {
    switch (action.type) {
        case 'PARSE_WARENKORB_FILE_SUCCESS': {
            let parsedWarenkorb = Object.assign({}, state.parsedWarenkorb);
            parsedWarenkorb[action.payload.language] = action.payload.data;
            return Object.assign({}, state, { parsedWarenkorb, importError: null });
        }

        case 'PARSE_FILE_SUCCESS': {
            const parseMap = {
                preismeldestellen: 'parsedPreismeldestellen',
                preismeldungen: 'parsedPreismeldungen',
            };
            if (!parseMap[action.payload.parsedType]) {
                return state;
            }

            return { ...state, [parseMap[action.payload.parsedType]]: action.payload.data };
        }

        case 'CLEAR_PARSED_FILES': {
            return Object.assign({}, state, { parsedWarenkorb: null, parsedPreismeldestellen: null, parsedPreismeldungen: null });
        }

        case 'IMPORT_STARTED': {
            return {
                ...state,
                importedWarenkorb: null,
                importedPreismeldestellen: null,
                importedPreismeldungen: null,
            };
        }

        case 'IMPORT_WARENKORB_SUCCESS': {
            const { payload } = action;
            return { ...state, importedWarenkorb: payload, importError: null, parsedWarenkorb: null };
        }

        case 'IMPORT_PREISMELDESTELLEN_SUCCESS': {
            const { payload } = action;
            return { ...state, importedPreismeldestellen: payload, importError: null, parsedPreismeldestellen: null };
        }

        case 'IMPORT_PREISMELDESTELLEN_FAILURE': {
            const { payload } = action;
            return { ...state, importedPreismeldestellen: null, importError: payload, parsedPreismeldestellen: null };
        }

        case 'IMPORT_PREISMELDUNGEN_SUCCESS': {
            const { payload } = action;
            return { ...state, importedPreismeldungen: payload, importError: null, parsedPreismeldungen: null };
        }

        case 'LOAD_LATEST_IMPORTED_AT_SUCCESS': {
            const { payload } = action;
            const warenkorb = payload.find(x => x._id === importer.Type.warenkorb);
            const preismeldestellen = payload.find(x => x._id === importer.Type.preismeldestellen);
            const preismeldungen = payload.find(x => x._id === importer.Type.preismeldungen);
            const allData = payload.find(x => x._id === importer.Type.all_data);

            const latestImportedAt = {
                importedWarenkorbAt: !!warenkorb ? parseDate(warenkorb.latestImportAt) : null,
                importedPreismeldestellenAt: !!preismeldestellen ? parseDate(preismeldestellen.latestImportAt) : null,
                importedPreismeldungenAt: !!preismeldungen ? parseDate(preismeldungen.latestImportAt) : null,
                importedAllDataAt: !!allData ? parseDate(allData.latestImportAt) : null
            }
            return Object.assign({}, state, latestImportedAt, { importError: null });
        }

        case 'LOAD_ERHEBUNGSMONATE_SUCCESS': {
            const { warenkorbErhebungsmonat, preismeldestellenErhebungsmonat, preismeldungenErhebungsmonat } = action.payload
            return Object.assign({}, state, { warenkorbErhebungsmonat, preismeldestellenErhebungsmonat, preismeldungenErhebungsmonat })
        }

        default:
            return state;
    }
}

export const getParsedWarenkorb = (state: State) => state.parsedWarenkorb;
export const getImportedWarenkorb = (state: State) => state.importedWarenkorb;
export const getImportedWarenkorbAt = (state: State) => state.importedWarenkorbAt;
export const getWarenkorbErhebungsmonat = (state: State) => state.warenkorbErhebungsmonat;

export const getParsedPreismeldestellen = (state: State) => state.parsedPreismeldestellen;
export const getImportedPreismeldestellen = (state: State) => state.importedPreismeldestellen;
export const getImportedPreismeldestellenAt = (state: State) => state.importedPreismeldestellenAt;
export const getPreismeldestellenErhebungsmonat = (state: State) => state.preismeldestellenErhebungsmonat;

export const getParsedPreismeldungen = (state: State) => state.parsedPreismeldungen;
export const getImportedPreismeldungen = (state: State) => state.importedPreismeldungen;
export const getImportedPreismeldungenAt = (state: State) => state.importedPreismeldungenAt;
export const getPreismeldungenErhebungsmonat = (state: State) => state.preismeldungenErhebungsmonat;

export const getImportedAllDataAt = (state: State) => state.importedAllDataAt;

function parseDate(date: number) {
    return !!date ? new Date(date) : null;
}

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
    importedPreismeldungen: P.Preismeldung[];
    importedPreismeldungenAt: Date;

    importError: string;
    importedAll: { success: boolean, error: string }
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

    importError: null,
    importedAll: null
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

            let parsedData = {};
            parsedData[parseMap[action.payload.parsedType]] = action.payload.data;
            return Object.assign({}, state, parsedData, { importError: null });
        }

        case 'CLEAR_PARSED_FILES': {
            return Object.assign({}, state, { parsedWarenkorb: null, parsedPreismeldestellen: null, parsedPreismeldungen: null });
        }

        case 'IMPORT_WARENKORB_SUCCESS': {
            const { payload } = action;
            return Object.assign({}, state, { importedWarenkorb: payload, importError: null });
        }

        case 'IMPORT_PREISMELDESTELLEN_SUCCESS': {
            const { payload } = action;
            return Object.assign({}, state, { importedPreismeldestellen: payload, importError: null });
        }

        case 'IMPORT_PREISMELDESTELLEN_FAILURE': {
            const { payload } = action;
            return Object.assign({}, state, { importedPreismeldestellen: null, importError: payload });
        }

        case 'IMPORT_PREISMELDUNGEN_SUCCESS': {
            const { payload } = action;
            return Object.assign({}, state, { importedPreismeldungen: payload, importError: null });
        }

        case 'LOAD_LATEST_IMPORTED_AT_SUCCESS': {
            const { payload } = action;
            const warenkorb = payload.find(x => x._id === importer.Type.warenkorb);
            const preismeldestellen = payload.find(x => x._id === importer.Type.preismeldestellen);
            const preismeldungen = payload.find(x => x._id === importer.Type.preismeldungen);

            const latestImportedAt = {
                importedWarenkorbAt: !!warenkorb ? parseDate(warenkorb.latestImportAt) : null,
                importedPreismeldestellenAt: !!preismeldestellen ? parseDate(preismeldestellen.latestImportAt) : null,
                importedPreismeldungenAt: !!preismeldungen ? parseDate(preismeldungen.latestImportAt) : null
            }
            return Object.assign({}, state, latestImportedAt, { importError: null });
        }

        case 'IMPORTED_ALL_RESET': {
            return Object.assign({}, state, { importedAll: initialState.importedAll, importError: null })
        }

        case 'IMPORTED_ALL_SUCCESS': {
            return Object.assign({}, state, { importedAll: { success: true, error: null }, importError: null })
        }

        case 'IMPORTED_ALL_FAILURE': {
            return Object.assign({}, state, { importedAll: { success: false, error: action.payload }, importError: null })
        }

        default:
            return state;
    }
}

export const getParsedWarenkorb = (state: State) => state.parsedWarenkorb;
export const getImportedWarenkorb = (state: State) => state.importedWarenkorb;
export const getImportedWarenkorbAt = (state: State) => state.importedWarenkorbAt;

export const getParsedPreismeldestellen = (state: State) => state.parsedPreismeldestellen;
export const getImportedPreismeldestellen = (state: State) => state.importedPreismeldestellen;
export const getImportedPreismeldestellenAt = (state: State) => state.importedPreismeldestellenAt;

export const getParsedPreismeldungen = (state: State) => state.parsedPreismeldungen;
export const getImportedPreismeldungen = (state: State) => state.importedPreismeldungen;
export const getImportedPreismeldungenAt = (state: State) => state.importedPreismeldungenAt;

export const getImportedAll = (state: State) => state.importedAll;

function parseDate(date: number) {
    return !!date ? new Date(date) : null;
}

import * as importer from '../actions/importer';
import { Models as P } from 'lik-shared';

export interface State {
    parsedPreismeldestellen: string[][];
    importedPreismeldestellen: P.Preismeldestelle[];
    importedPreismeldestellenAt: Date;

    parsedPreismeldungen: string[][];
    importedPreismeldungen: P.Preismeldung[];
    importedPreismeldungenAt: Date;
};

const initialState: State = {
    parsedPreismeldestellen: null,
    importedPreismeldestellen: null,
    importedPreismeldestellenAt: null,

    parsedPreismeldungen: null,
    importedPreismeldungen: null,
    importedPreismeldungenAt: null
};

export function reducer(state = initialState, action: importer.Action): State {
    switch (action.type) {
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
            return Object.assign({}, state, parsedData);
        }

        case 'IMPORT_PREISMELDESTELLEN_SUCCESS': {
            const { payload } = action;
            return Object.assign({}, state, { importedPreismeldestellen: payload });
        }

        case 'IMPORT_PREISMELDUNGEN_SUCCESS': {
            const { payload } = action;
            return Object.assign({}, state, { importedPreismeldungen: payload });
        }

        case 'LOAD_LATEST_IMPORTED_AT_SUCCESS': {
            const { payload } = action;
            const preismeldestellen = payload.find(x => x._id === importer.Type.preismeldestellen);
            const preismeldungen = payload.find(x => x._id === importer.Type.preismeldungen);

            const latestImportedAt = {
                importedPreismeldestellenAt: !!preismeldestellen ? parseDate(preismeldestellen.latestImportAt) : null,
                importedPreismeldungenAt: !!preismeldungen ? parseDate(preismeldungen.latestImportAt) : null
            }
            return Object.assign({}, state, latestImportedAt);
        }

        default:
            return state;
    }
}

export const getParsedPreismeldestellen = (state: State) => state.parsedPreismeldestellen;
export const getImportedPreismeldestellen = (state: State) => state.importedPreismeldestellen;
export const getImportedPreismeldestellenAt = (state: State) => state.importedPreismeldestellenAt;

export const getParsedPreismeldungen = (state: State) => state.parsedPreismeldungen;
export const getImportedPreismeldungen = (state: State) => state.importedPreismeldungen;
export const getImportedPreismeldungenAt = (state: State) => state.importedPreismeldungenAt;

function parseDate(date: number) {
    return !!date ? new Date(date) : null;
}

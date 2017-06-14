import * as exporter from '../actions/exporter';

export interface State {
    exportedPreismeldungen: number;
    exportedPreismeldestellen: number;
    exportedPreiserheber: number;

    preismeldungenError: string;
    preismeldestellenError: string;
    preiserheberError: string;
};

const initialState: State = {
    exportedPreismeldungen: null,
    exportedPreismeldestellen: null,
    exportedPreiserheber: null,

    preismeldungenError: null,
    preismeldestellenError: null,
    preiserheberError: null,
};

export function reducer(state = initialState, action: exporter.Action): State {
    switch (action.type) {
        case 'EXPORT_PREISMELDUNGEN_RESET': {
            return Object.assign({}, state, { exportedPreismeldungen: null, preismeldungenError: null });
        }

        case 'EXPORT_PREISMELDUNGEN_SUCCESS': {
            const { payload } = action;
            return Object.assign({}, state, { exportedPreismeldungen: payload, preismeldungenError: null });
        }

        case 'EXPORT_PREISMELDUNGEN_FAILURE': {
            return Object.assign({}, state, { expportedPreismeldungen: null, preismeldungenError: action.payload })
        }

        case 'EXPORT_PREISMELDESTELLEN_RESET': {
            return Object.assign({}, state, { exportedPreismeldestellen: null, preismeldestellenError: null });
        }

        case 'EXPORT_PREISMELDESTELLEN_SUCCESS': {
            const { payload } = action;
            return Object.assign({}, state, { exportedPreismeldestellen: payload, preismeldestellenError: null });
        }

        case 'EXPORT_PREISMELDESTELLEN_FAILURE': {
            return Object.assign({}, state, { expportedPreismeldestellen: null, preismeldestellenError: action.payload })
        }

        case 'EXPORT_PREISERHEBER_RESET': {
            return Object.assign({}, state, { exportedPreiserheber: null, preiserheberError: null });
        }

        case 'EXPORT_PREISERHEBER_SUCCESS': {
            const { payload } = action;
            return Object.assign({}, state, { exportedPreiserheber: payload, preiserheberError: null });
        }

        case 'EXPORT_PREISERHEBER_FAILURE': {
            return Object.assign({}, state, { expportedPreiserheber: null, preiserheberError: action.payload })
        }

        default:
            return state;
    }
}

export const getExportedPreismeldungen = (state: State) => state.exportedPreismeldungen;
export const getExportedPreismeldestellen = (state: State) => state.exportedPreismeldestellen;
export const getExportedPreiserheber = (state: State) => state.exportedPreiserheber;

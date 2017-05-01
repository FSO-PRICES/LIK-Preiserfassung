import * as exporter from '../actions/exporter';

export interface State {
    exportedPreismeldungen: number;
    exportedPreismeldestellen: number;
    exportedPreiserheber: number;
};

const initialState: State = {
    exportedPreismeldungen: null,
    exportedPreismeldestellen: null,
    exportedPreiserheber: null
};

export function reducer(state = initialState, action: exporter.Action): State {
    switch (action.type) {
        case 'EXPORT_PREISMELDUNGEN_RESET': {
            return Object.assign({}, state, { exportedPreismeldungen: null });
        }

        case 'EXPORT_PREISMELDUNGEN_SUCCESS': {
            const { payload } = action;
            return Object.assign({}, state, { exportedPreismeldungen: payload });
        }

        case 'EXPORT_PREISMELDESTELLEN_RESET': {
            return Object.assign({}, state, { exportedPreismeldestellen: null });
        }

        case 'EXPORT_PREISMELDESTELLEN_SUCCESS': {
            const { payload } = action;
            return Object.assign({}, state, { exportedPreismeldestellen: payload });
        }

        case 'EXPORT_PREISERHEBER_RESET': {
            return Object.assign({}, state, { exportedPreiserheber: null });
        }

        case 'EXPORT_PREISERHEBER_SUCCESS': {
            const { payload } = action;
            return Object.assign({}, state, { exportedPreiserheber: payload });
        }

        default:
            return state;
    }
}

export const getExportedPreismeldungen = (state: State) => state.exportedPreismeldungen;
export const getExportedPreismeldestellen = (state: State) => state.exportedPreismeldestellen;
export const getExportedPreiserheber = (state: State) => state.exportedPreiserheber;

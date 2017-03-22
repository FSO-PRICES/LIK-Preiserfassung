import * as exporter from '../actions/exporter';

export interface State {
    exportedPreismeldungen: number;
};

const initialState: State = {
    exportedPreismeldungen: null
};

export function reducer(state = initialState, action: exporter.Action): State {
    switch (action.type) {
        case 'EXPORT_PREISMELDUNGEN': {
            return Object.assign({}, state, { exportedPreismeldungen: null });
        }

        case 'EXPORT_PREISMELDUNGEN_SUCCESS': {
            const { payload } = action;
            return Object.assign({}, state, { exportedPreismeldungen: payload });
        }

        default:
            return state;
    }
}

export const getExportedPreismeldungen = (state: State) => state.exportedPreismeldungen;

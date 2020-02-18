import { Actions } from '../actions/error';

export interface State {
    [type: string]: string;
}

const initialState: State = {};

export function reducer(state = initialState, action: Actions): State {
    switch (action.type) {
        case 'LOAD_DATABASE_LAST_SYNCED_FAILURE':
        case 'CHECK_DATABASE_FAILURE':
        case 'DELETE_DATABASE_FAILURE':
        case 'LOAD_ERHEBUNGSINFO_FAILURE':
        case 'SAVE_PREISERHEBER_FAILURE':
        case 'PREISMELDESTELLEN_LOAD_FAILURE':
        case 'SAVE_PREISMELDESTELLE_FAILURE':
        case 'PREISMELDUNGEN_LOAD_FAILURE':
        case 'SAVE_PREISMELDUNG_PRICE_FAILURE':
        case 'SAVE_NEW_PREISMELDUNG_PRICE_FAILURE':
        case 'SAVE_PREISMELDUNG_MESSAGES_FAILURE':
        case 'SAVE_PREISMELDUNG_ATTRIBUTES_FAILURE':
        case 'RESET_PREISMELDUNG_FAILURE':
        case 'DELETE_PREISMELDUNG_FAILURE':
        case 'PREISMELDUNGEN_SORT_SAVE_FAILURE':
        case 'PREISMELDUNG_STATISTICS_LOAD_FAILURE':
            state[action.type] = action.payload;
            console.warn('An unhandled error occured:');
            console.error(action.payload);
            return state;
        default:
            return state;
    }
}

export const getIsDesktop = (state: State) => state.isDesktop;

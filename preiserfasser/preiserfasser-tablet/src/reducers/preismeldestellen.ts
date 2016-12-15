import { Preismeldestelle }  from '../common-models';
import * as preismeldestellen from '../actions/preismeldestellen';

export interface State {
    entities: Preismeldestelle[];
}

const initialState: State = {
    entities: []
};

export function reducer(state = initialState, action: preismeldestellen.Actions): State {
    switch (action.type) {
        case 'PREISMELDESTELLEN_LOAD_SUCCESS':
            return { entities: action.payload };

        default:
            return state;
    }
}

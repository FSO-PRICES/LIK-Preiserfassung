import { Preisemeldestelle }  from '../common-models';
import * as preisemeldestelle from '../actions/preismeldestelle';

export interface State {
    entities: Preisemeldestelle[];
}

const initialState: State = {
    entities: []
};

export function reducer(state = initialState, action: preisemeldestelle.Actions): State {
    switch (action.type) {
        case 'PREISEMELDESTELLE_LOAD_SUCCESS':
            return { entities: action.payload };

        default:
            return state;
    }
}

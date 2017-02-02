import { createSelector } from 'reselect';
import { Preismeldestelle }  from '../common-models';
import * as preismeldestellen from '../actions/preismeldestellen';

export interface State {
    pmsNummers: string[];
    entities: { [pmsNummer: string]: Preismeldestelle };
    selectedPmsNummer: string;
}

const initialState: State = {
    pmsNummers: [],
    entities: {},
    selectedPmsNummer: undefined,
};

export function reducer(state = initialState, action: preismeldestellen.Actions): State {
    switch (action.type) {
        case 'PREISMELDESTELLEN_LOAD_SUCCESS': {
            const pmsNummers = action.payload.map(x => x.pmsNummer);
            const entities = action.payload.reduce((entities: { [pmsNummer: string]: Preismeldestelle }, preismeldestelle: Preismeldestelle) => {
                return Object.assign(entities, { [preismeldestelle.pmsNummer]: preismeldestelle });
            }, {});
            return Object.assign({}, state, { pmsNummers, entities });
        }

        case 'PREISMELDESTELLE_SELECT':
            return Object.assign({}, state, { selectedPmsKey: action.payload });

        default:
            return state;
    }
}

export const getEntities = (state: State) => state.entities;
export const getPmsNummers = (state: State) => state.pmsNummers;
export const getSelectedPmsNummer = (state: State) => state.selectedPmsNummer;

export const getSelected = createSelector(getEntities, getSelectedPmsNummer, (entities, selectedPmsNummer) => entities[selectedPmsNummer]);
export const getAll = createSelector(getEntities, getPmsNummers, (entities, pmsNummers) => pmsNummers.map(x => entities[x]));

import { createSelector } from 'reselect';
import { Models as P }  from 'lik-shared';
import * as preismeldestellen from '../actions/preismeldestellen';
import { assign, cloneDeep } from 'lodash';

export type CurrentPreismeldestelle = P.Preismeldestelle & {
    isModified: boolean;
};

export interface State {
    pmsNummers: string[];
    entities: { [pmsNummer: string]: P.Preismeldestelle };
    currentPreismeldestelle: CurrentPreismeldestelle;
}

const initialState: State = {
    pmsNummers: [],
    entities: {},
    currentPreismeldestelle: undefined
};

export function reducer(state = initialState, action: preismeldestellen.Actions): State {
    switch (action.type) {
        case 'PREISMELDESTELLEN_LOAD_SUCCESS': {
            const pmsNummers = action.payload.map(x => x.pmsNummer);
            const entities = action.payload.reduce((agg: { [pmsNummer: string]: P.Preismeldestelle }, preismeldestelle: P.Preismeldestelle) => {
                return assign(agg, { [preismeldestelle.pmsNummer]: preismeldestelle });
            }, {});
            return assign({}, state, { pmsNummers, entities });
        }
        case 'PREISMELDESTELLEN_RESET':
            return assign({}, initialState);

        case 'PREISMELDUNGEN_LOAD_SUCCESS':
            return assign({}, state, { currentPreismeldestelle: action.payload.pms });

        case 'PREISMELDESTELLE_SELECT':
            return assign({}, state, { currentPreismeldestelle: cloneDeep(state.entities[action.payload]) });

        case 'UPDATE_CURRENT_PREISMELDESTELLE': {
            const { payload } = action;

            const valuesFromPayload = {
                name: payload.name,
                street: payload.street,
                town: payload.town,
                postcode: payload.postcode,
                telephone: payload.telephone,
                email: payload.email,
                languageCode: payload.languageCode,
                erhebungsart: payload.erhebungsart,
                erhebungshaeufigkeit: payload.erhebungshaeufigkeit,
                erhebungsartComment: payload.erhebungsartComment,
                zusatzInformationen: payload.zusatzInformationen,
                kontaktpersons: cloneDeep(payload.kontaktpersons),
            };

            const currentPreismeldestelle = assign({},
                state.currentPreismeldestelle,
                valuesFromPayload,
                { isModified: true }
            );

            return Object.assign({}, state, { currentPreismeldestelle });
        }

        case 'SAVE_PREISMELDESTELLE_SUCCESS': {
            const currentPreismeldestelle = Object.assign({}, state.currentPreismeldestelle, action.payload, { isModified: false });
            const preismeldestelleIds = !!state.pmsNummers.find(x => x === currentPreismeldestelle.pmsNummer) ? state.pmsNummers : [...state.pmsNummers, currentPreismeldestelle.pmsNummer];
            return assign({}, state, { currentPreismeldestelle, preismeldestelleIds, entities: assign({}, state.entities, { [currentPreismeldestelle.pmsNummer]: currentPreismeldestelle }) });
        }

        default:
            return state;
    }
}

export const getEntities = (state: State) => state.entities;
export const getPmsNummers = (state: State) => state.pmsNummers;
export const getCurrentPreismeldestelle = (state: State) => state.currentPreismeldestelle;

export const getAll = createSelector(getEntities, getPmsNummers, (entities, pmsNummers) => pmsNummers.map(x => entities[x]));

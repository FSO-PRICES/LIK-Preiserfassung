import { createSelector } from 'reselect';
import { Models as P } from 'lik-shared';
import * as preismeldestellen from '../actions/preismeldestellen';
import { assign, cloneDeep, isEqual } from 'lodash';

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
            return { ...state, currentPreismeldestelle: { ...action.payload.pms, isModified: false } };

        case 'PREISMELDESTELLE_SELECT':
            return { ...state, currentPreismeldestelle: { ...cloneDeep(state.entities[action.payload]), isModified: false } };

        case 'UPDATE_CURRENT_PREISMELDESTELLE': {
            const { payload } = action;

            const isKontaktPersonSame = (a, b) => !!a && !!b
                && a.firstName === b.firstName
                && a.surname === b.surname
                && a.personFunction === b.personFunction
                && a.languageCode === b.languageCode
                && a.telephone === b.telephone
                && a.mobile === b.mobile
                && a.fax === b.fax
                && a.email === b.email;

            if (payload.name === state.currentPreismeldestelle.name
                && payload.supplement === state.currentPreismeldestelle.supplement
                && payload.street === state.currentPreismeldestelle.street
                && payload.supplement === state.currentPreismeldestelle.supplement
                && payload.postcode === state.currentPreismeldestelle.postcode
                && payload.town === state.currentPreismeldestelle.town
                && payload.telephone === state.currentPreismeldestelle.telephone
                && payload.email === state.currentPreismeldestelle.email
                && payload.languageCode === state.currentPreismeldestelle.languageCode
                && payload.erhebungsart === state.currentPreismeldestelle.erhebungsart
                && payload.pmsGeschlossen === state.currentPreismeldestelle.pmsGeschlossen
                && payload.erhebungsartComment === state.currentPreismeldestelle.erhebungsartComment
                && payload.zusatzInformationen === state.currentPreismeldestelle.zusatzInformationen
                && isKontaktPersonSame(payload.kontaktpersons[0], state.currentPreismeldestelle.kontaktpersons[0])
                && isKontaktPersonSame(payload.kontaktpersons[1], state.currentPreismeldestelle.kontaktpersons[1])) {
                return state;
            }
            const valuesFromPayload = {
                name: payload.name,
                supplement: payload.supplement,
                street: payload.street,
                postcode: payload.postcode,
                town: payload.town,
                telephone: payload.telephone,
                email: payload.email,
                languageCode: payload.languageCode,
                erhebungsart: payload.erhebungsart,
                pmsGeschlossen: payload.pmsGeschlossen,
                erhebungsartComment: payload.erhebungsartComment,
                zusatzInformationen: payload.zusatzInformationen,
                kontaktpersons: cloneDeep(payload.kontaktpersons)
            };

            const currentPreismeldestelle = { ...state.currentPreismeldestelle, ...valuesFromPayload, isModified: true };
            return { ...state, currentPreismeldestelle };
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

import { Models as P } from 'lik-shared';
import { assign, groupBy, cloneDeep } from 'lodash';
import { createSelector } from 'reselect';

import * as preismeldung from '../actions/preismeldung';

export type CurrentPreismeldung = P.Preismeldung & {
    isModified: boolean;
    isSaved: boolean;
};

export interface PreismeldungBag {
    pmId: string;
    refPreismeldung?: P.PreismeldungReference;
    preismeldung: P.Preismeldung;
    warenkorbPosition: P.WarenkorbLeaf;
    priceCountStatus: {
        text: string;
        ok: boolean
    };
}

export interface State {
    preismeldungIds: string[];
    entities: { [id: string]: PreismeldungBag };
    currentPreismeldung: CurrentPreismeldung;
    unexportedPreismeldungen: P.CompletePreismeldung[];
    areUnexportedLoaded: boolean;
};

const initialState: State = {
    preismeldungIds: [],
    entities: {},
    currentPreismeldung: undefined,
    unexportedPreismeldungen: [],
    areUnexportedLoaded: false
};

export function reducer(state = initialState, action: preismeldung.Action): State {
    switch (action.type) {
        case 'PREISMELDUNG_LOAD_UNEXPORTED': {
            return assign({}, state, { areUnexportedLoaded: false });
        }

        case 'PREISMELDUNG_LOAD_UNEXPORTED_SUCCESS': {
            return assign({}, state, { unexportedPreismeldungen: action.payload, areUnexportedLoaded: true });
        }

        case 'PREISMELDUNG_LOAD_FOR_PMS_SUCCESS': {
            const { payload } = action;
            const preismeldungenGrouped = groupBy(payload.preismeldungen, 'epNummer');

            const preismeldungBags = payload.preismeldungen
                .map<PreismeldungBag>(preismeldung => {
                    const warenkorbPosition = payload.warenkorbDoc.products.find(p => p.gliederungspositionsnummer === preismeldung.epNummer) as P.WarenkorbLeaf;
                    return assign({}, {
                        pmId: preismeldung._id,
                        preismeldung,
                        refPreismeldung: payload.refPreismeldungen.find(rpm => rpm.pmId === preismeldung._id),
                        warenkorbPosition,
                        priceCountStatus: {
                            text: `${preismeldungenGrouped[warenkorbPosition.gliederungspositionsnummer].length}/${warenkorbPosition.anzahlPreiseProPMS}`,
                            ok: preismeldungenGrouped[warenkorbPosition.gliederungspositionsnummer].length >= warenkorbPosition.anzahlPreiseProPMS
                        }
                    });
                });

            const preismeldungIds = preismeldungBags.map(x => x.pmId);
            const entities = preismeldungBags.reduce((agg: { [_id: string]: PreismeldungBag }, preismeldung: PreismeldungBag) => assign(agg, { [preismeldung.pmId]: preismeldung }), {});
            return assign({}, state, { preismeldungIds, entities });
        }

        case 'CLEAR_PREISMELDUNG_FOR_PMS': {
            return assign({}, state, { entities: {}, preismeldungIds: [] });
        }

        case 'SELECT_PREISMELDUNG': {
            const currentPreismeldung = action.payload == null ? null : Object.assign({}, cloneDeep(state.entities[action.payload].preismeldung), { isModified: false });
            return assign({}, state, { currentPreismeldung });
        }

        case 'UPDATE_CURRENT_PREISMELDUNG': {
            const { payload } = action;

            const valuesFromPayload = {
                bermerkungenAnsBfs: payload.bermerkungenAnsBfs,
            };

            const currentPreismeldung = assign({},
                state.currentPreismeldung,
                valuesFromPayload,
                { isModified: true }
            );

            return Object.assign({}, state, { currentPreismeldung });
        }

        case 'SAVE_PREISMELDUNG_SUCCESS': {
            const currentPreismeldung = Object.assign({}, state.currentPreismeldung, action.payload, { isModified: false, isSaved: true });
            const preismeldungIds = !!state.preismeldungIds.find(x => x === currentPreismeldung._id) ? state.preismeldungIds : [...state.preismeldungIds, currentPreismeldung._id];
            const currentBag = cloneDeep(state.entities[currentPreismeldung._id]);
            currentBag.preismeldung = currentPreismeldung;
            return assign({}, state, { currentPreismeldung, preismeldungIds, entities: assign({}, state.entities, { [currentPreismeldung._id]: currentBag }) });
        }

        default:
            return state;
    }
}

export const getEntities = (state: State) => state.entities;
export const getPreismeldungIds = (state: State) => state.preismeldungIds;
export const getCurrentPreismeldung = (state: State) => state.currentPreismeldung;
export const getUnexportedPreismeldungen = (state: State) => state.unexportedPreismeldungen;
export const getAreUnexportedLoaded = (state: State) => state.areUnexportedLoaded;

export const getAll = createSelector(getEntities, getPreismeldungIds, (entities, preismeldungIds) => preismeldungIds.map(x => entities[x]));

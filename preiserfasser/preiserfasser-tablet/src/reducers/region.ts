import { Models as P } from 'lik-shared';

import * as region from '../actions/region';
import { assign } from 'lodash';
import { createSelector } from 'reselect';

export interface State {
    regionIds: string[];
    entities: { [id: string]: P.Region };
};

const initialState: State = {
    regionIds: [],
    entities: {},
};

export function reducer(state = initialState, action: region.Action): State {
    switch (action.type) {
        case 'REGION_LOAD_SUCCESS': {
            const { payload } = action;
            const regionn = payload.map<P.Region>(region => Object.assign({}, region));
            const regionIds = regionn.map(p => p._id);
            const entities = regionn.reduce((entities: { [_id: string]: P.Region }, region: P.Region) => {
                return Object.assign(entities, { [region._id]: region });
            }, {});
            return assign({}, state, { regionIds, entities, currentRegion: undefined });
        }

        default:
            return state;
    }
}

export const getEntities = (state: State) => state.entities;
export const getRegionIds = (state: State) => state.regionIds;

export const getAll = createSelector(getEntities, getRegionIds, (entities, regionIds) => regionIds.map(x => entities[x]));

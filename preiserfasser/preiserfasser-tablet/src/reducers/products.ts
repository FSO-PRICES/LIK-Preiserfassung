import { createSelector } from 'reselect';
import { Product }  from '../common-models';
import * as products from '../actions/products';

export interface State {
    productIds: string[];
    entities: { [pmsKey: string]: Product };
    selectedPmsKey: string;
}

const initialState: State = {
    productIds: [],
    entities: {},
    selectedPmsKey: undefined,
};

// NOTE: only products for currently viewed Preismeldestelle are loaded into State

export function reducer(state = initialState, action: products.Actions): State {
    switch (action.type) {
        case 'PRODUCTS_LOAD_SUCCESS': {
            const productIds = action.payload.map(x => (x as any)._id);
            const entities = action.payload.reduce((entities: { [_id: string]: Product }, product: Product) => {
                return Object.assign(entities, { [(product as any)._id]: product });
            }, {});
            return Object.assign({}, state, { productIds, entities });
        }

        case 'PRODUCTS_CLEAR': {
            return Object.assign({}, state, { productIds: [], entities: {} });
        }

        default:
            return state;
    }
}

export const getEntities = (state: State) => state.entities;
export const getProductIds = (state: State) => state.productIds;

export const getAll = createSelector(getEntities, getProductIds, (entities, productIds) => productIds.map(x => entities[x]));

export interface Product {
    id: string;
    name: string;
}

export type ProductAction =
    { type: 'ADD_PRODUCT'; payload: Product; } |
    { type: 'UPDATE_PRODUCT'; payload: Product; };

export function productReducer(state: Product[] = [], action: ProductAction): Product[] {
    switch (action.type) {
        case 'ADD_PRODUCT':
            return [...state, action.payload];
        case 'UPDATE_PRODUCT':
            return state.map(x => x.id === action.payload.id ? action.payload : x);
        default:
            return state;
    }
}

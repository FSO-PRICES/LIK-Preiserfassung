export interface NameTranslation {
    [lang: string]: string;
}

export interface Product {
    code: string;
    parent: string;
    level: string;
    name: NameTranslation;
    parentName: NameTranslation;
    grandparentName: NameTranslation;
}

export type ProductAction =
    { type: 'ADD_PRODUCT'; payload: Product; } |
    { type: 'UPDATE_PRODUCT'; payload: Product; };

export function productReducer(state: Product[] = [], action: ProductAction): Product[] {
    switch (action.type) {
        case 'ADD_PRODUCT':
            return [...state, action.payload];
        case 'UPDATE_PRODUCT':
            return state.map(x => x.code === action.payload.code ? action.payload : x);
        default:
            return state;
    }
}

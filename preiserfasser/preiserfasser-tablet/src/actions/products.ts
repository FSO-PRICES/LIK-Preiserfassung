import { Product }  from '../common-models';

export type Actions =
    { type: 'PRODUCTS_LOAD_FOR_PMS', payload: number } |
    { type: 'PRODUCTS_LOAD_SUCCESS', payload: Product[] } |
    { type: 'PRODUCTS_CLEAR' } |
    { type: 'SELECT_PRODUCT', payload: string };



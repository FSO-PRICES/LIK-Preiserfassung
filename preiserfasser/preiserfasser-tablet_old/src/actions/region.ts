import { Models as P } from '../common-models';

export type Action =
    { type: 'REGION_LOAD_SUCCESS', payload: P.Region[] } |
    { type: 'REGION_LOAD', payload: null };

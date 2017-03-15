import { Models as P } from '../common-models';

export type Actions =
    { type: 'REGION_LOAD_SUCCESS', payload: { regionen: P.Region[] } } |
    { type: 'REGION_LOAD', payload: null } |
    { type: 'SAVE_REGION_SUCCESS', payload: { createNew: boolean, region: P.Region } } |
    { type: 'SAVE_REGION', payload: boolean } |
    { type: 'SELECT_REGION', payload: string } |
    { type: 'CREATE_REGION', payload: null } |
    { type: 'UPDATE_CURRENT_REGION', payload: P.Region };

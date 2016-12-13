import { Preisemeldestelle }  from '../common-models';

export type Actions =
    { type: 'PREISEMELDESTELLE_LOAD_SUCCESS', payload: Preisemeldestelle[] };

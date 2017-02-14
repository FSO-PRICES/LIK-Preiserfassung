import { Erheber } from '../../../../common/models';

export type Actions =
    { type: 'PREISERHEBER_LOAD_SUCCESS', payload: { preiserhebers: Erheber[] } } |
    { type: 'SAVE_PREISMELDUNG_PRICE_SUCCESS', payload: { preiserheber: Erheber } };

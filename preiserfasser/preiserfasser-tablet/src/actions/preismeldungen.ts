import * as P from '../common-models';

export interface PreismeldungPricePayload {
    currentPeriodPrice: string;
    currentPeriodQuantity: string;
    reductionType: string;
    currentPeriodProcessingCode: string;
    artikelNummer: string;
    artikelText: string;
}

export type SavePreismeldungPricePayloadType = 'JUST_SAVE' | 'SAVE_AND_MOVE_TO_NEXT';

export type Actions =
    { type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload: number } |
    { type: 'PREISMELDUNGEN_LOAD_SUCCESS', payload: { warenkorbDoc: any, refPreismeldungen: P.PreismeldungReference[], preismeldungen: P.Preismeldung[] } } |
    { type: 'PREISMELDUNGEN_CLEAR' } |
    { type: 'SELECT_PREISMELDUNG', payload: string } |
    { type: 'UPDATE_PREISMELDUNG_PRICE', payload: PreismeldungPricePayload } |
    { type: 'SAVE_PREISMELDUNG_PRICE_SUCCESS', payload: { preismeldung: P.Preismeldung, saveAction: SavePreismeldungPricePayloadType } };

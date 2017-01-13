import { Preismeldung } from '../common-models';

export interface PreismeldungPricePayload {
    currentPeriodPrice: string;
    currentPeriodQuantity: string;
    reductionType: string;
    processingCode: string;
    artikelNummer: string;
    artikelText: string;
}

export type Actions =
    { type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload: number } |
    { type: 'PREISMELDUNGEN_LOAD_SUCCESS', payload: Preismeldung[] } |
    { type: 'PREISMELDUNGEN_CLEAR' } |
    { type: 'SELECT_PREISMELDUNG', payload: string } |
    { type: 'UPDATE_PREISMELDUNG_PRICE', payload: PreismeldungPricePayload } |
    { type: 'SAVE_PREISMELDUNG_PRICE' };

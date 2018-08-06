import { Models as P } from '../common-models';

export type Action =
    | { type: 'PDF_RESET_PMS'; payload: null }
    | { type: 'CREATE_PMS_PDF'; payload: { preismeldestelle: P.Preismeldestelle; erhebungsmonat: string } }
    | { type: 'PDF_CREATED_PMS'; payload: string | null }
    | { type: 'PDF_CREATION_FAILED'; payload: any };

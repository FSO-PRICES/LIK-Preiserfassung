export interface PreismeldestelleProperties {
    pmsKey: string;
    name: string;
    supplement: string;
    street: string;
    postcode: string;
    town: string;
    telephone: string;
    email: string;
    languageCode: string;
}

export interface ErheberProperties {
    firstName: string;
    surname: string;
    personFunction: string;
    languageCode: string;
    telephone: string;
    email: string;
}

export interface PreismeldungProperties {
    pmsKey: string;
    erhebungspositionsnummer: string;
    laufnummer: string;
    preisT: number;
    mengeT: number;
    aktionsCode: boolean;
    ausverkauf: boolean;
    preisGueltigSeit: Date;
    artikelText: string;
    artikelNummer: string;
    basispreise: number;
    basismenge: number;
    sonderpreis: number;
    fehlendepreisCode: string;
    bemerkungen: string;
    tableInformationen: string;
    preiseVorReduktion: number;
    mengeVorReduktion: number;
    preiseReiheIstZuBeenden: boolean;
    produktMerkmal1: string;
    produktMerkmal2: string;
    produktMerkmal3: string;
    produktMerkmal4: string;
    produktMerkmal5: string;

    currentPeriodPrice: number;
    currentPeriodQuantity: number;
    currentPeriodIsAktion: boolean;
    currentPeriodIsAusverkauf: boolean;
    currentPeriodProcessingCode: string;
    percentageLastPeriodToCurrentPeriod: number;
}

export interface CouchProperties {
    _id: string;
    _rev: string;
}

export type Preismeldestelle = PreismeldestelleProperties & CouchProperties;
export type Erheber = ErheberProperties & CouchProperties;
export type Preismeldung = PreismeldungProperties & CouchProperties;

export const pmsUriRoute = 'preismeldestelle/:pmsKey';
export interface PmsUri {
    pmsKey: string;
}

export const preismeldungUriRoute = 'preismeldung/:pmsKey/position/:positionNumber/sequence/:sequenceNumber';
export interface PreismeldungUri {
    pmsKey: string;
    positionNumber: string;
    sequenceNumber: string;
}

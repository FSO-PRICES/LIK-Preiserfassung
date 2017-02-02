export interface ErheberProperties {
    firstName: string;
    surname: string;
    personFunction: string;
    languageCode: string;
    telephone: string;
    email: string;
}

export const pmsUriRoute = 'pms/:pmsNummer';
export interface PmsUri {
    pmsNummer: string;
}

export interface PreismeldestelleProperties {
    pmsNummer: string;
    name: string;
    supplement: string;
    street: string;
    postcode: string;
    town: string;
    telephone: string;
    email: string;
    languageCode: string;
}

export const preismeldungReferenceUriRoute = 'pm-ref/:pmsNummer/ep/:epNummer/lauf/:laufnummer';
export const preismeldungUriRoute = 'pm/:pmsNummer/ep/:epNummer/lauf/:laufnummer';
export interface PreismeldungUri {
    pmsNummer: string;
    epNummer: string;
    laufnummer: string;
}

interface _PreismeldungReferenceProperties {
    pmId: string;

    preisGueltigSeitDatum: string;
    fehlendePreiseR: string;
    istPreisreiheZuBeenden: boolean;

    zeitbereichPos: number;
    sortierungsnummer: number;

    productMerkmale: string[];

    preis: number;
    menge: number;
    isAktion: boolean;
    isAusverkauf: boolean;
    artikelnummer: string;
    artikeltext: string;

    bermerkungenVomBfs: string;
}

export type PreismeldungReferenceProperties = PreismeldungUri & _PreismeldungReferenceProperties;

interface _PreismeldungProperties {
    preis: number;
    menge: number;
    aktion: boolean;
    ausverkauf: boolean;
    artikelnummer: string;
    artikeltext: string;
    bermerkungenAnsBfs: string;

    percentageLastPeriodToCurrentPeriod?: number;

    modifiedAt: string;
    bearbeitungscode: number;

    istAbgebucht: boolean;

    uploadRequestedAt: string;
}

export type PreismeldungProperties = PreismeldungUri & _PreismeldungProperties;

export interface CouchProperties {
    _id: string;
    _rev: string;
}

export type Preismeldestelle = PreismeldestelleProperties & CouchProperties;
export type Erheber = ErheberProperties & CouchProperties;
export type PreismeldungReference = PreismeldungReferenceProperties & CouchProperties;
export type Preismeldung = PreismeldungProperties & CouchProperties;

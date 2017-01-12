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

export interface ProductProperties {
    pmsKey: string;
    erhebungspositionsnummer: string;
    laufnummer: string;
    preisT: number;
    mengeT: number;
    aktionsCode: boolean;
    ausverkauf: boolean;
    preisGueltigSeit: Date;
    text: string;
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

    // new period properties
    currentPrice: number;
    currentQuantity: number;
}

export interface CouchProperties {
    _id: string;
    _rev: string;
}

export type Preismeldestelle = PreismeldestelleProperties & CouchProperties;
export type Erheber = ErheberProperties & CouchProperties;
export type Product = ProductProperties & CouchProperties;

export const pmsUriRoute = 'preismeldestelle/:pmsKey';
export interface PmsUri {
    pmsKey: string;
}

export const productUriRoute = 'pms-product/:pmsKey/position/:positionNumber/sequence/:sequenceNumber';
export interface ProductUri {
    pmsKey: string;
    positionNumber: string;
    sequenceNumber: string;
}

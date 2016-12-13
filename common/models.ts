export interface Preisemeldestelle {
    pmsKey: number;
    name: string;
    supplement: string;
    street: string;
    postcode: string;
    town: string;
    telephone: string;
    email: string;
    languageCode: string;
}

export interface Erheber {
    firstName: string;
    surname: string;
    personFunction: string;
    languageCode: string;
    telephone: string;
    email: string;
}

export interface Product {
    pmsKey: number;
    erhebungspositionsnummer: number;
    laufnummer: number;
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
}

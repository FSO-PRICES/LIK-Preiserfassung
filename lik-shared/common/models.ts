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

export interface KontaktPerson {
    firstName: string;
    surname: string;
    personFunction: string;
    languageCode: string;
    telephone: string;
    mobile: string;
    fax: string;
    email: string;
}

export interface AdvancedPresimeldestelleProperties {
    kontaktpersons: KontaktPerson[];
    erhebungsart: string;
    erhebungshaeufigkeit: string;
    erhebungsartComment: string;
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
    basisPreis: number;
    basisMenge: number;
    aktion: boolean;
    ausverkauf: boolean;
    artikelnummer: string;
    artikeltext: string;

    bermerkungenVomBfs: string;
}

export type PreismeldungReferenceProperties = PreismeldungUri & _PreismeldungReferenceProperties;

export type Bearbeitungscode = 0 | 1 | 7 | 44 | 100 | 101;

interface _PreismeldungProperties {
    preis?: string;
    menge?: string;
    preisNormal?: string;
    mengeNormal?: string;
    preisVPNormalNeuerArtikel?: string;
    mengeVPNormalNeuerArtikel?: string;

    aktion: boolean;
    ausverkauf: boolean;

    artikelnummer: string;
    artikeltext: string;

    bermerkungenAnsBfs: string;

    percentageDPToLVP?: number;
    percentageDPToVPNeuerArtikel?: number;
    percentageVPNeuerArtikelToVPAlterArtikel?: number;

    modifiedAt: string;
    bearbeitungscode: Bearbeitungscode;

    istAbgebucht: boolean;

    uploadRequestedAt: string;
}

export type PreismeldungProperties = PreismeldungUri & _PreismeldungProperties;

export interface CouchProperties {
    _id: string;
    _rev: string;
}

export type Preismeldestelle = PreismeldestelleProperties & CouchProperties;
export type AdvancedPreismeldestelle = PreismeldestelleProperties & AdvancedPresimeldestelleProperties & CouchProperties;
export type Erheber = ErheberProperties & CouchProperties;
export type PreismeldungReference = PreismeldungReferenceProperties & CouchProperties;
export type Preismeldung = PreismeldungProperties & CouchProperties;

export type PmsToPeMap = {erheber: Erheber, preismeldestellen: Preismeldestelle[]}[]

export interface PropertyTranslation {
    de: string;
    fr: string;
    it: string;
}

export interface WarenkorbTreeItemBase {
    gliederungspositionsnummer: string;
    parentGliederungspositionsnummer: string
    produktecode: string;
    gliederungspositionstyp: number;
    tiefencode: number;
    positionsbezeichnung: PropertyTranslation;
    periodizitaetscode: PropertyTranslation;
    beispiele: PropertyTranslation;
    info: PropertyTranslation;
}

export interface WarenkorbBranch extends WarenkorbTreeItemBase {
    type: 'BRANCH';
}

export enum PeriodizitaetMonat {
    None = 0,
    Januar = 1 << 0,
    Februar = 1 << 1,
    Maerz = 1 << 2,
    April = 1 << 3,
    May = 1 << 4,
    Juni = 1 << 5,
    Juli = 1 << 6,
    August = 1 << 7,
    September = 1 << 8,
    Oktober = 1 << 9,
    November = 1 << 10,
    Dezember = 1 << 11
}

export interface WarenkorbLeaf extends WarenkorbTreeItemBase {
    type: 'LEAF';
    standardmenge: number;
    standardeinheit: PropertyTranslation;
    erhebungstyp: string;
    anzahlPreiseProPMS: number;
    periodizitaetMonat: PeriodizitaetMonat;
    abweichungPmUG2: number;
    abweichungPmOG2: number;
    produktmerkmal1: PropertyTranslation;
    produktmerkmal2: PropertyTranslation;
    produktmerkmal3: PropertyTranslation;
    produktmerkmal4: PropertyTranslation;
    produktmerkmal5: PropertyTranslation;
    produktmerkmal6: PropertyTranslation;
}

export type WarenkorbTreeItem = WarenkorbBranch | WarenkorbLeaf;

export type WarenkorbHierarchicalTreeItem = (WarenkorbBranch & { children: WarenkorbHierarchicalTreeItem[] }) | WarenkorbLeaf;

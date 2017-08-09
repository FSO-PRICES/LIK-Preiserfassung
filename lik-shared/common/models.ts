export interface ErheberProperties {
    peNummer: number;
    username: string;
    firstName: string;
    surname: string;
    erhebungsregion: string;
    languageCode: string;
    telephone: string;
    mobilephone: string;
    email: string;
    fax: string;
    webseite: string;
    street: string;
    postcode: string;
    town: string;
}

export const pmsUriRoute = 'pms/:pmsNummer';
export const pmsPreismeldungenSortUriRoute = 'pms-sort/:pmsNummer';
export interface PmsUri {
    pmsNummer: string;
}

export interface PreismeldestelleProperties {
    pmsNummer: string;
    preissubsystem: number; // LIK = 2
    name: string;
    supplement: string;
    zusatzInformationen: string;
    street: string;
    postcode: string;
    town: string;
    telephone: string;
    email: string;
    languageCode: string;
    kontaktpersons: KontaktPerson[];
    erhebungsregion: string;
    erhebungsart: string;
    pmsGeschlossen: pmsGeschlossenType;
    erhebungsartComment: string;
}

export interface PmsPreismeldungenSortProperties {
    sortOrder: { pmId: string; sortierungsnummer: number }[];
}

export interface KontaktPerson {
    oid: string; // Set by presta (null if new to presta)
    firstName: string;
    surname: string;
    personFunction: string;
    languageCode: string;
    telephone: string;
    mobile: string;
    fax: string;
    email: string;
}

export type pmsGeschlossenType = 0 | 1 | 2 | 3 | 4;

export interface ErhebungsmonatProperties {
    _id: 'erhebongsmonat';
    monthAsString: string;
}

export const preismeldungReferenceUriRoute = 'pm-ref/:pmsNummer/ep/:epNummer/lauf/:laufnummer';
export const preismeldungUriRoute = 'pm/:pmsNummer/ep/:epNummer/lauf/:laufnummer';
export const preismeldungPmsPrefixUriRoute = 'pm/:pmsNummer';
export interface PreismeldungUri {
    pmsNummer: string;
    epNummer: string;
    laufnummer: string;
}

// tslint:disable-next-line:class-name
interface _PreismeldungReferenceProperties {
    pmId: string;

    preissubsystem: number;
    schemanummer: number;

    preisGueltigSeitDatum: string;
    fehlendePreiseR: string;
    istPreisreiheZuBeenden?: boolean;

    sortierungsnummer: number;
    erhebungsZeitpunkt: Erhebungszeitpunkt;
    erhebungsAnfangsDatum: string;
    erhebungsEndDatum: string;
    internetLink: string;

    productMerkmale: string[];

    preis: number;
    menge: number;
    basisPreis: number;
    basisMenge: number;
    preisVorReduktion: number;
    mengeVorReduktion: number;
    datumVorReduktion: string;

    aktion: boolean;
    artikelnummer: string;
    artikeltext: string;

    notiz: string;
    bemerkungen: string;
}

export type PreismeldungReferenceProperties = PreismeldungUri & _PreismeldungReferenceProperties;

export type Bearbeitungscode = 0 | 1 | 2 | 3 | 7 | 44 | 99 | 101;
export const bearbeitungscodeDescriptions = {
    0: '0',
    1: '1',
    2: '2',
    3: '3',
    7: '7',
    44: 'S',
    99: '99',
    101: 'R'
};

export type Erhebungszeitpunkt = 1 | 2 | 10 | 20 | 99;

export interface PreismeldungPercentages {
    d_DPToVP: PercentageWithWarning;
    d_DPToVPVorReduktion: PercentageWithWarning;
    d_DPToVPK: PercentageWithWarning;
    d_VPKToVPAlterArtikel: PercentageWithWarning;
    d_VPKToVPVorReduktion: PercentageWithWarning;
    d_DPVorReduktionToVPVorReduktion: PercentageWithWarning;
    d_DPVorReduktionToVP: PercentageWithWarning;
}

// tslint:disable-next-line:class-name
interface __PreismeldungProperties {
    preis?: string;
    menge?: string;
    preisVPK?: string;
    mengeVPK?: string;
    fehlendePreiseR: string;
    preisVorReduktion?: string;
    mengeVorReduktion?: string;
    datumVorReduktion?: string;

    aktion: boolean;

    artikelnummer: string;
    artikeltext: string;
    internetLink: string;

    notiz: string;
    kommentar: string;
    bemerkungen: string;

    productMerkmale: string[];

    modifiedAt: string;
    bearbeitungscode: Bearbeitungscode;

    istAbgebucht: boolean;

    erhebungsZeitpunkt?: number;

    uploadRequestedAt: string;
}

type _PreismeldungProperties = __PreismeldungProperties & PreismeldungPercentages;

export interface PercentageWithWarning {
    percentage: number;
    warning: boolean;
    textzeil: string;
}

export type PreismeldungProperties = PreismeldungUri & _PreismeldungProperties;

export type DbErhebungsorgannummerProperties = { value: string };

export interface CouchProperties {
    _id: string;
    _rev: string;
}

export const ExpectedDbSchemaVersion = 2;

export type DbErhebungsorgannummer = DbErhebungsorgannummerProperties & CouchProperties;
export type DbSchemaVersion = { version: number } & CouchProperties;
export type Erhebungsmonat = ErhebungsmonatProperties & CouchProperties;
export type Preismeldestelle = PreismeldestelleProperties & CouchProperties;
export type PmsPreismeldungenSort = PmsPreismeldungenSortProperties & CouchProperties;
export type Erheber = ErheberProperties & CouchProperties;
export type PreismeldungReference = PreismeldungReferenceProperties & CouchProperties;
export type Preismeldung = PreismeldungProperties & CouchProperties;

export type PmsToPeMap = { erheber: Erheber, preismeldestellen: Preismeldestelle[] }[];

export interface PropertyTranslation {
    de: string;
    en: string;
    fr: string;
    it: string;
}

export interface WarenkorbTreeItemBase {
    gliederungspositionsnummer: string;
    parentGliederungspositionsnummer: string;
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
    erhebungsschemaperiode: string;
    periodizitaetMonat: PeriodizitaetMonat;
    abweichungPmUG2: number;
    abweichungPmOG2: number;
    negativeLimite: number;
    positiveLimite: number;
    negativeLimite_1: number;
    positiveLimite_1: number;
    negativeLimite_7: number;
    positiveLimite_7: number;
    nichtEmpfohleneBc: number[];
    erhebungszeitpunkte: number;
    productMerkmale: PropertyTranslation[];
}

export type WarenkorbTreeItem = WarenkorbBranch | WarenkorbLeaf;

export type WarenkorbHierarchicalTreeItem = (WarenkorbBranch & { children: WarenkorbHierarchicalTreeItem[] }) | WarenkorbLeaf;

export interface WarenkorbDocumentProperties {
    products: (WarenkorbBranch | WarenkorbLeaf)[];
}

export type WarenkorbDocument = WarenkorbDocumentProperties & CouchProperties;

export interface CouchSecurity {
    admins?: { names?: string[], roles?: string[] };
    members?: { names?: string[], roles?: string[] };
}

export interface PreiszuweisungProperties {
    preiserheberId: string;
    preismeldestellenNummern: string[];
}

export type Preiszuweisung = PreiszuweisungProperties & CouchProperties;

export interface SettingProperties {
    version: string;
    serverConnection: {
        url: string;
    };
    general: {
        erhebungsorgannummer: string;
    };
}

export type Setting = SettingProperties & CouchProperties;

export interface LanguageProperties {
    languageCode: string;
    name: string;
}

export type Language = LanguageProperties;
export interface LanguageDictionary {
    [name: string]: Language;
}

export const Languages: LanguageDictionary = {
    'Deutsch': { languageCode: 'de', name: 'Deutsch' },
    'Französisch': { languageCode: 'fr', name: 'Französisch' },
    'Italienisch': { languageCode: 'it', name: 'Italienisch' },
    'Englisch': { languageCode: 'en', name: 'Englisch' }
};

export interface LastSyncedAtProperties {
    value: string;
}

export type LastSyncedAt = LastSyncedAtProperties & CouchProperties;

export interface RegionProperties {
    name: string;
}

export type Region = RegionProperties & CouchProperties;

export interface Credentials {
    username: string;
    password: string;
}

export type CompletePreismeldung = Preismeldung & PmsPreismeldungenSort;

export interface User {
    username: string;
}

export interface Preissubsystem {
    id: number;
    name: string;
}

export interface Erhebungsart {
    erhebungsart_tablet: boolean,
    erhebungsart_telefon: boolean,
    erhebungsart_email: boolean,
    erhebungsart_internet: boolean,
    erhebungsart_papierlisteVorOrt: boolean,
    erhebungsart_papierlisteAbgegeben: boolean
}

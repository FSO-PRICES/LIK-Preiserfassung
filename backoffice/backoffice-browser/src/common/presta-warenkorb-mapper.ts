import { Models as P } from 'lik-shared';
import * as _ from 'lodash';
import { mapValues, values, keys } from 'lodash';
import { bearbeitungscodeDescriptions, PropertyTranslation } from '../../../../lik-shared/common/models';
import * as csvParser from 'js-csvparser';


const indexes = {
    erhebungsschemaperiode: 0,
    erhebungsschemanummer: 1,
    gliederungspositionsnummer: 2,
    produktecode: 3,
    gliederungspositionstyp: 4,
    tiefencode: 5,
    positionsbezeichnung: 6,
    periodizitaetscode: 7,
    standardmenge: 8,
    standardeinheit: 9,
    erhebungstyp: 10,
    anzahlPreiseProPMS: 11,
    beispiele: 12,
    info: 13,
    periodizitaetMonat1: 14,
    periodizitaetMonat2: 15,
    periodizitaetMonat3: 16,
    periodizitaetMonat4: 17,
    periodizitaetMonat5: 18,
    periodizitaetMonat6: 19,
    periodizitaetMonat7: 20,
    periodizitaetMonat8: 21,
    periodizitaetMonat9: 22,
    periodizitaetMonat10: 23,
    periodizitaetMonat11: 24,
    periodizitaetMonat12: 25,
    abweichungPmUG2: 26,
    abweichungPmOG2: 27,
    negativeLimite: 28,
    positiveLimite: 29,
    negativeLimite_1: 30,
    positiveLimite_1: 31,
    negativeLimite_7: 32,
    positiveLimite_7: 33,
    nichtEmpfohleneBc: 34,
    erhebungszeitpunkte: 35,
    produktmerkmale: 36
};


export function buildTree(data: { de: string[][], fr: string[][], it: string[][] }): P.WarenkorbTreeItem[] {
    const lastDepthGliederungspositionsnummers: { [index: number]: P.WarenkorbTreeItem } = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null };

    const treeItems: P.WarenkorbTreeItem[] = [];
    for (let i = 0; i < data.de.length; i++) {
        const thisLine = data.de[i];
        const treeItem: P.WarenkorbTreeItem & { _id: string } = {
            _id: thisLine[indexes.gliederungspositionsnummer],
            type: 'LEAF',
            gliederungspositionsnummer: thisLine[indexes.gliederungspositionsnummer],
            parentGliederungspositionsnummer: null,
            produktecode: parseProduktecode(thisLine[indexes.produktecode]),
            gliederungspositionstyp: parseGliederungspositionstyp(thisLine[indexes.gliederungspositionstyp]),
            tiefencode: parseTiefenCode(thisLine[indexes.tiefencode]),
            positionsbezeichnung: translationsToStringOrNull(thisLine[indexes.positionsbezeichnung], data.fr[i][indexes.positionsbezeichnung], data.it[i][indexes.positionsbezeichnung]),
            erhebungsschemaperiode: parseNumber(thisLine[indexes.erhebungsschemaperiode], 'erhebungsschemaperiode'),
            periodizitaetscode: translationsToStringOrNull(thisLine[indexes.periodizitaetscode], data.fr[i][indexes.periodizitaetscode], data.it[i][indexes.periodizitaetscode]),
            standardmenge: parseStandardmenge(thisLine[indexes.standardmenge]),
            standardeinheit: translationsToStringOrNull(thisLine[indexes.standardeinheit], data.fr[i][indexes.standardeinheit], data.it[i][indexes.standardeinheit]),
            erhebungstyp: thisLine[indexes.erhebungstyp],
            anzahlPreiseProPMS: parseAnzahlPreiseProPMS(thisLine[indexes.anzahlPreiseProPMS]),
            beispiele: translationsToStringOrNull(parseBeispiel(thisLine[indexes.beispiele]), parseBeispiel(data.fr[i][indexes.beispiele]), parseBeispiel(data.it[i][indexes.beispiele])),
            info: translationsToStringOrNull(parseInfo(thisLine[indexes.info]), parseInfo(data.fr[i][indexes.info]), parseInfo(data.it[i][indexes.info])),
            periodizitaetMonat: parsePeriodizitaet([
                thisLine[indexes.periodizitaetMonat1],
                thisLine[indexes.periodizitaetMonat2],
                thisLine[indexes.periodizitaetMonat3],
                thisLine[indexes.periodizitaetMonat4],
                thisLine[indexes.periodizitaetMonat5],
                thisLine[indexes.periodizitaetMonat6],
                thisLine[indexes.periodizitaetMonat7],
                thisLine[indexes.periodizitaetMonat8],
                thisLine[indexes.periodizitaetMonat9],
                thisLine[indexes.periodizitaetMonat10],
                thisLine[indexes.periodizitaetMonat11],
                thisLine[indexes.periodizitaetMonat12]
            ]),
            abweichungPmUG2: parseAbweichung(thisLine[indexes.abweichungPmUG2]),
            abweichungPmOG2: parseAbweichung(thisLine[indexes.abweichungPmOG2]),
            negativeLimite: parseNumberOrNull(thisLine[indexes.negativeLimite]),
            positiveLimite: parseNumberOrNull(thisLine[indexes.positiveLimite]),
            negativeLimite_1: parseNumberOrNull(thisLine[indexes.negativeLimite_1]),
            positiveLimite_1: parseNumberOrNull(thisLine[indexes.positiveLimite_1]),
            negativeLimite_7: parseNumberOrNull(thisLine[indexes.negativeLimite_7]),
            positiveLimite_7: parseNumberOrNull(thisLine[indexes.positiveLimite_7]),
            nichtEmpfohleneBc: parseBearbeitungscode(thisLine[indexes.nichtEmpfohleneBc]),
            erhebungszeitpunkte: 1,
            productMerkmale: prepareProduktmerkmale({ de: thisLine[indexes.produktmerkmale], fr: data.fr[i][indexes.produktmerkmale], it: data.it[i][indexes.produktmerkmale] })
        };
        treeItems.push(treeItem);
        const parent: P.WarenkorbTreeItem = lastDepthGliederungspositionsnummers[treeItem.tiefencode - 1];
        if (!!parent) {
            if (parent.type === 'LEAF') {
                delete parent.standardmenge;
                delete parent.standardeinheit;
                delete parent.erhebungstyp;
                delete parent.anzahlPreiseProPMS;
            }
            parent.type = 'BRANCH';
            treeItem.parentGliederungspositionsnummer = parent.gliederungspositionsnummer;
            treeItem._id = `${(<any>parent)._id}/${treeItem.gliederungspositionsnummer}`;
        }
        lastDepthGliederungspositionsnummers[treeItem.tiefencode] = treeItem;
    }

    return treeItems;
}

function parseProduktecode(s: string) {
    const cleanedString = s.replace(/^\s*(.*?)\s*$/, '$1');
    return (!cleanedString.length) ? null : cleanedString;
}

const parseInfo = parseOutQuotes;
const parseBeispiel = parseOutQuotes;
function parseOutQuotes(s: string) {
    const cleanedString = s.replace(/^\"?(.*?)\"?$/, '$1');
    return (!cleanedString.length) ? null : cleanedString;
}

const parseGliederungspositionstyp = (s: string) => parseNumber(s, 'gliederungspositionstyp');
const parseTiefenCode = (s: string) => parseNumber(s, 'tiefencode');

const parseNumberOrNull = (s: string) => {
    const number = parseInt(s, 10);
    return isNaN(number) ? null : number;
};

const parseStandardmenge = parseNumberOrNull;
const parseAnzahlPreiseProPMS = parseNumberOrNull;

function parseNumber(s: string, propertyName: string) {
    const number = parseInt(s, 10);
    if (isNaN(number)) throw new Error(`Invalid ${propertyName}: '${s}'`);
    return number;
}

function createHierarchyRecursive(parent: P.WarenkorbTreeItem, currentItemIndex: number, treeItems: P.WarenkorbTreeItem[]): P.WarenkorbHierarchicalTreeItem {
    if (parent.type === 'LEAF') return parent;

    const children = [];
    let currentItem = treeItems[currentItemIndex];
    for (var i = currentItemIndex; i < treeItems.length && !!currentItem && currentItem.tiefencode > parent.tiefencode; i++) {
        if (currentItem.tiefencode === parent.tiefencode + 1) {
            children.push(createHierarchyRecursive(currentItem, i + 1, treeItems));
        }
        currentItem = treeItems[i + 1];
    }
    return _.assign({}, parent, { children });
}

function countHierarchicalItems(item: P.WarenkorbHierarchicalTreeItem): number {
    if (item.type === 'LEAF') return 1;
    return item.children.reduce((agg, v) => agg + countHierarchicalItems(v), 1);
}

function countHierarchicalLeaves(item: P.WarenkorbHierarchicalTreeItem): number {
    if (item.type === 'LEAF') return 1;
    return item.children.reduce((agg, v) => agg + countHierarchicalLeaves(v), 0);
}

function countHierarchicalBranches(item: P.WarenkorbHierarchicalTreeItem): number {
    if (item.type === 'LEAF') return 0;
    return item.children.reduce((agg, v) => agg + countHierarchicalBranches(v), 1);
}

function parseBoolean(s: string) {
    return s.toLocaleLowerCase() === 'x';
}

function parsePeriodizitaet(periodizitaten: string[]) {
    return periodizitaten.reduce((prev, curr, index) => {
        return prev |= parseBoolean(curr) ? <P.PeriodizitaetMonat>(1 << index) : P.PeriodizitaetMonat.None;
    }, P.PeriodizitaetMonat.None)
}

const parseAbweichung = parseNumberOrNull;

function parseStringOrEmpty(s: string) {
    return !!s ? s.toString() : '';
}

function translationsToStringOrNull(de: string, fr: string, it: string) {
    return !!de || !!fr || !!it ?
        { de: parseStringOrEmpty(de), fr: parseStringOrEmpty(fr), it: parseStringOrEmpty(it) } :
        null;
}

function prepareProduktmerkmale(rawMerkmale: { de: string, fr: string, it: string }): PropertyTranslation[] {
    const merkmale = mapValues(rawMerkmale, text => !text ? [] : parseSingleCsvText(text)) as any;
    const merkmaleList = [];
    Object.keys(merkmale).map(language => {
        merkmale[language].map((merkmal, i) => merkmaleList[i] = Object.assign({}, merkmaleList[i], { [language]: merkmal || null }));
    });

    return merkmaleList;
}

function parseBearbeitungscode(bearbeitungcodes) {
    const getCodeNumber = (code) => {
        const index = values(bearbeitungscodeDescriptions).indexOf(code);
        return index !== -1 ? keys(bearbeitungcodes)[index] : code;
    };

    return parseSingleCsvText(bearbeitungcodes).map(getCodeNumber);
}

function parseSingleCsvText(text: string): string[] {
    return csvParser(text, { delimiter: ';' }).data[0] || [];
}

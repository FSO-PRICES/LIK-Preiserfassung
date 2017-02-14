import * as _ from 'lodash';

import { WarenkorbTreeItem, WarenkorbHierarchicalTreeItem, PeriodizitaetMonat } from '../../../../common/models';

const indexes = {
    gliederungspositionsnummer: 1,
    produktecode: 2,
    gliederungspositionstyp: 3,
    tiefencode: 4,
    positionsbezeichnung: 5,
    periodizitaetscode: 6,
    standardmenge: 7,
    standardeinheit: 8,
    erhebungstyp: 9,
    anzahlPreiseProPMS: 10,
    beispiele: 11,
    info: 12,
    periodizitaetMonat1: 13,
    periodizitaetMonat2: 14,
    periodizitaetMonat3: 15,
    periodizitaetMonat4: 16,
    periodizitaetMonat5: 17,
    periodizitaetMonat6: 18,
    periodizitaetMonat7: 19,
    periodizitaetMonat8: 20,
    periodizitaetMonat9: 21,
    periodizitaetMonat10: 22,
    periodizitaetMonat11: 23,
    periodizitaetMonat12: 24,
    abweichungPmUG2: 25,
    abweichungPmOG2: 26,
    produktmerkmal1: 27,
    produktmerkmal2: 28,
    produktmerkmal3: 29,
    produktmerkmal4: 30,
    produktmerkmal5: 31,
    produktmerkmal6: 32
};


export function buildTree(data: { de: string[][], fr: string[][], it: string[][] }): WarenkorbTreeItem[] {
    const lastDepthGliederungspositionsnummers: { [index: number]: WarenkorbTreeItem } = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null };

    const treeItems: WarenkorbTreeItem[] = [];
    for (let i = 0; i < data.de.length; i++) {
        const thisLine = data.de[i];
        const treeItem: WarenkorbTreeItem = {
            type: 'LEAF',
            gliederungspositionsnummer: thisLine[indexes.gliederungspositionsnummer],
            parentGliederungspositionsnummer: null,
            produktecode: parseProduktecode(thisLine[indexes.produktecode]),
            gliederungspositionstyp: parseGliederungspositionstyp(thisLine[indexes.gliederungspositionstyp]),
            tiefencode: parseTiefenCode(thisLine[indexes.tiefencode]),
            positionsbezeichnung: translationsToStringOrNull(thisLine[indexes.positionsbezeichnung], data.fr[i][indexes.positionsbezeichnung], data.it[i][indexes.positionsbezeichnung]),
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
            produktmerkmal1: translationsToStringOrNull(thisLine[indexes.produktmerkmal1], data.fr[i][indexes.produktmerkmal1], data.it[i][indexes.produktmerkmal1]),
            produktmerkmal2: translationsToStringOrNull(thisLine[indexes.produktmerkmal2], data.fr[i][indexes.produktmerkmal2], data.it[i][indexes.produktmerkmal2]),
            produktmerkmal3: translationsToStringOrNull(thisLine[indexes.produktmerkmal3], data.fr[i][indexes.produktmerkmal3], data.it[i][indexes.produktmerkmal3]),
            produktmerkmal4: translationsToStringOrNull(thisLine[indexes.produktmerkmal4], data.fr[i][indexes.produktmerkmal4], data.it[i][indexes.produktmerkmal4]),
            produktmerkmal5: translationsToStringOrNull(thisLine[indexes.produktmerkmal5], data.fr[i][indexes.produktmerkmal5], data.it[i][indexes.produktmerkmal5]),
            produktmerkmal6: translationsToStringOrNull(thisLine[indexes.produktmerkmal6], data.fr[i][indexes.produktmerkmal6], data.it[i][indexes.produktmerkmal6])
        };
        treeItems.push(treeItem);
        const parent = lastDepthGliederungspositionsnummers[treeItem.tiefencode - 1];
        if (!!parent) {
            if (parent.type === 'LEAF') {
                delete parent.standardmenge;
                delete parent.standardeinheit;
                delete parent.erhebungstyp;
                delete parent.anzahlPreiseProPMS;
            }
            parent.type = 'BRANCH';
            treeItem.parentGliederungspositionsnummer = parent.gliederungspositionsnummer;
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
    const number = parseInt(s);
    return isNaN(number) ? null : number;
};

const parseStandardmenge = parseNumberOrNull;
const parseAnzahlPreiseProPMS = parseNumberOrNull;

function parseNumber(s: string, propertyName: string) {
    const number = parseInt(s);
    if (isNaN(number)) throw new Error(`Invalid ${propertyName}: '${s}'`);
    return number;
}

function createHierarchy(treeItems: WarenkorbTreeItem[]): WarenkorbHierarchicalTreeItem {
    return createHierarchyRecursive(treeItems[0], 1, treeItems);
}

function createHierarchyRecursive(parent: WarenkorbTreeItem, currentItemIndex: number, treeItems: WarenkorbTreeItem[]): WarenkorbHierarchicalTreeItem {
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

function countHierarchicalItems(item: WarenkorbHierarchicalTreeItem): number {
    if (item.type === 'LEAF') return 1;
    return item.children.reduce((agg, v) => agg + countHierarchicalItems(v), 1);
}

function countHierarchicalLeaves(item: WarenkorbHierarchicalTreeItem): number {
    if (item.type === 'LEAF') return 1;
    return item.children.reduce((agg, v) => agg + countHierarchicalLeaves(v), 0);
}

function countHierarchicalBranches(item: WarenkorbHierarchicalTreeItem): number {
    if (item.type === 'LEAF') return 0;
    return item.children.reduce((agg, v) => agg + countHierarchicalBranches(v), 1);
}

function parseBoolean(s: string) {
    return s.toLocaleLowerCase() === 'x';
}

function parsePeriodizitaet(periodizitaten: string[]) {
    return periodizitaten.reduce((prev, curr, index) => {
        return prev |= parseBoolean(curr) ? <PeriodizitaetMonat>(1 << index) : PeriodizitaetMonat.None;
    }, PeriodizitaetMonat.None)
}

const parseAbweichung = parseNumberOrNull;

function parseStringOrEmpty(s: string) {
    return !!s ? s.toString() : "";
}

function translationsToStringOrNull(de: string, fr: string, it: string) {
    return !!de || !!fr || !!it ?
        { de: parseStringOrEmpty(de), fr: parseStringOrEmpty(fr), it: parseStringOrEmpty(it) } :
        null;
}

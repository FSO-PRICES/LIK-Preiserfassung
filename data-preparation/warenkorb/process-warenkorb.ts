import * as os from 'os';
import * as encoding from 'encoding';
import * as _ from 'lodash';

import { readFile, writeFile, } from '../promisified';
import { bufferToCells } from '../utils';

readFile('./warenkorb/data/Erhebungsschema_DE.csv').then(bufferToCells)
    .then(de => readFile('./warenkorb/data/Erhebungsschema_FR.csv').then(bufferToCells).then(fr => ({ de, fr })))
    .then(x => readFile('./warenkorb/data/Erhebungsschema_IT.csv').then(bufferToCells).then(it => ({ de: x.de, fr: x.fr, it })))
    .then(data => {
        const treeItems = buildTree(data);
        var hierarchy = createHierarchy(treeItems);
        // console.log('number of items', countHierarchicalItems(hierarchy));
        // console.log('number of leaves', countHierarchicalLeaves(hierarchy));
        // console.log('number of branches', countHierarchicalBranches(hierarchy));
        return writeFile('./warenkorb/flat.json', JSON.stringify(treeItems), { encoding: 'UTF-8' })
            .then(() => writeFile('./warenkorb/hierarchy.json', JSON.stringify(hierarchy), { encoding: 'UTF-8' }));
    });

interface PropertyTranslation {
    de: string;
    fr: string;
    it: string;
}

interface TreeItemBase {
    gliederungspositionsnummer: string;
    parentGliederungspositionsnummer: string
    produktecode: string;
    gliederungspositionstyp: number;
    tiefencode: number;
    bezeichnung: PropertyTranslation;
    periodizitaetscode: PropertyTranslation;
    beispiel: PropertyTranslation;
    info: PropertyTranslation;
    periodizitaetJan: boolean;
    periodizitaetFeb: boolean;
    periodizitaetMaerz: boolean;
    periodizitaetApril: boolean;
    periodizitaetMai: boolean;
    periodizitaetJuni: boolean;
    periodizitaetJuli: boolean;
    periodizitaetAug: boolean;
    periodizitaetSept: boolean;
    periodizitaetOkt: boolean;
    periodizitaetNov: boolean;
    periodizitaetDez: boolean;
    abweichungPmUG2: number;
    abweichungPmOG2: number;
    champSupplementaire1: PropertyTranslation;
    champSupplementaire2: PropertyTranslation;
    champSupplementaire3: PropertyTranslation;
    champSupplementaire4: PropertyTranslation;
    champSupplementaire5: PropertyTranslation;
}

interface Branch extends TreeItemBase {
    type: 'BRANCH';
}

interface Leaf extends TreeItemBase {
    type: 'LEAF';
    standardmenge: number;
    standardeinheit: PropertyTranslation;
    erhebungstyp: string;
    anzahlPreiseProPMS: number;
}

type TreeItem = Branch | Leaf;

type HierarchicalTreeItem = (Branch & { children: HierarchicalTreeItem[] }) | Leaf;

const indexes = {
    gliederungspositionsnummer: 1,
    produktecode: 2,
    gliederungspositionstyp: 3,
    tiefencode: 4,
    bezeichnung: 5,
    periodizitaetscode: 6,
    standardmenge: 7,
    standardeinheit: 8,
    erhebungstyp: 9,
    anzahlPreiseProPMS: 10,
    beispiel: 11,
    info: 12,
    periodizitaetJan: 13,
    periodizitaetFeb: 14,
    periodizitaetMaerz: 15,
    periodizitaetApril: 16,
    periodizitaetMai: 17,
    periodizitaetJuni: 18,
    periodizitaetJuli: 19,
    periodizitaetAug: 20,
    periodizitaetSept: 21,
    periodizitaetOkt: 22,
    periodizitaetNov: 23,
    periodizitaetDez: 24,
    abweichungPmUG2: 25,
    abweichungPmOG2: 26,
    champSupplementaire1: 27,
    champSupplementaire2: 28,
    champSupplementaire3: 29,
    champSupplementaire4: 30,
    champSupplementaire5: 31
};

function buildTree(data: { de: string[][], fr: string[][], it: string[][] }): TreeItem[] {
    const lastDepthGliederungspositionsnummers: { [index: number]: TreeItem } = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null };

    const treeItems: TreeItem[] = [];
    for (let i = 0; i < data.de.length; i++) {
        const thisLine = data.de[i];
        const treeItem: TreeItem = {
            type: 'LEAF',
            gliederungspositionsnummer: thisLine[indexes.gliederungspositionsnummer],
            parentGliederungspositionsnummer: null,
            produktecode: parseProduktecode(thisLine[indexes.produktecode]),
            gliederungspositionstyp: parseGliederungspositionstyp(thisLine[indexes.gliederungspositionstyp]),
            tiefencode: parseTiefenCode(thisLine[indexes.tiefencode]),
            bezeichnung: { de: thisLine[indexes.bezeichnung], fr: data.fr[i][indexes.bezeichnung], it: data.it[i][indexes.bezeichnung] },
            periodizitaetscode: { de: thisLine[indexes.periodizitaetscode], fr: data.fr[i][indexes.periodizitaetscode], it: data.it[i][indexes.periodizitaetscode] },
            standardmenge: parseStandardmenge(thisLine[indexes.standardmenge]),
            standardeinheit: { de: thisLine[indexes.standardeinheit], fr: data.fr[i][indexes.standardeinheit], it: data.it[i][indexes.standardeinheit] },
            erhebungstyp: thisLine[indexes.erhebungstyp],
            anzahlPreiseProPMS: parseAnzahlPreiseProPMS(thisLine[indexes.anzahlPreiseProPMS]),
            beispiel: { de: parseBeispiel(thisLine[indexes.beispiel]), fr: parseBeispiel(data.fr[i][indexes.beispiel]), it: parseBeispiel(data.it[i][indexes.beispiel]) },
            info: { de: parseInfo(thisLine[indexes.info]), fr: parseInfo(data.fr[i][indexes.info]), it: parseInfo(data.it[i][indexes.info]) },
            periodizitaetJan: parsePeriodizitaet(thisLine[indexes.periodizitaetJan]),
            periodizitaetFeb: parsePeriodizitaet(thisLine[indexes.periodizitaetFeb]),
            periodizitaetMaerz: parsePeriodizitaet(thisLine[indexes.periodizitaetMaerz]),
            periodizitaetApril: parsePeriodizitaet(thisLine[indexes.periodizitaetApril]),
            periodizitaetMai: parsePeriodizitaet(thisLine[indexes.periodizitaetMai]),
            periodizitaetJuni: parsePeriodizitaet(thisLine[indexes.periodizitaetJuni]),
            periodizitaetJuli: parsePeriodizitaet(thisLine[indexes.periodizitaetJuli]),
            periodizitaetAug: parsePeriodizitaet(thisLine[indexes.periodizitaetAug]),
            periodizitaetSept: parsePeriodizitaet(thisLine[indexes.periodizitaetSept]),
            periodizitaetOkt: parsePeriodizitaet(thisLine[indexes.periodizitaetOkt]),
            periodizitaetNov: parsePeriodizitaet(thisLine[indexes.periodizitaetNov]),
            periodizitaetDez: parsePeriodizitaet(thisLine[indexes.periodizitaetDez]),
            abweichungPmUG2: parseAbweichung(thisLine[indexes.abweichungPmUG2]),
            abweichungPmOG2: parseAbweichung(thisLine[indexes.abweichungPmOG2]),
            champSupplementaire1: { de: thisLine[indexes.champSupplementaire1], fr: data.fr[i][indexes.champSupplementaire1], it: data.it[i][indexes.champSupplementaire1] },
            champSupplementaire2: { de: thisLine[indexes.champSupplementaire2], fr: data.fr[i][indexes.champSupplementaire2], it: data.it[i][indexes.champSupplementaire2] },
            champSupplementaire3: { de: thisLine[indexes.champSupplementaire3], fr: data.fr[i][indexes.champSupplementaire3], it: data.it[i][indexes.champSupplementaire3] },
            champSupplementaire4: { de: thisLine[indexes.champSupplementaire4], fr: data.fr[i][indexes.champSupplementaire4], it: data.it[i][indexes.champSupplementaire4] },
            champSupplementaire5: { de: thisLine[indexes.champSupplementaire5], fr: data.fr[i][indexes.champSupplementaire5], it: data.it[i][indexes.champSupplementaire5] }
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

function createHierarchy(treeItems: TreeItem[]): HierarchicalTreeItem {
    return createHierarchyRecursive(treeItems[0], 1, treeItems);
}

function createHierarchyRecursive(parent: TreeItem, currentItemIndex: number, treeItems: TreeItem[]): HierarchicalTreeItem {
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

function countHierarchicalItems(item: HierarchicalTreeItem): number {
    if (item.type === 'LEAF') return 1;
    return item.children.reduce((agg, v) => agg + countHierarchicalItems(v), 1);
}

function countHierarchicalLeaves(item: HierarchicalTreeItem): number {
    if (item.type === 'LEAF') return 1;
    return item.children.reduce((agg, v) => agg + countHierarchicalLeaves(v), 0);
}

function countHierarchicalBranches(item: HierarchicalTreeItem): number {
    if (item.type === 'LEAF') return 0;
    return item.children.reduce((agg, v) => agg + countHierarchicalBranches(v), 1);
}

const parsePeriodizitaet = parseBoolean;

function parseBoolean(s: string) {
    return s.toLocaleLowerCase() === 'x';
}

const parseAbweichung = parseNumberOrNull;

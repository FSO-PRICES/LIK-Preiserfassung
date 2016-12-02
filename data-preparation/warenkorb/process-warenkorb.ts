import * as os from 'os';
import * as fs from 'fs';
import * as encoding from 'encoding';
import * as bluebird from 'bluebird';
import * as _ from 'lodash';

interface ReadFileSignature {
    (filename: string): bluebird<Buffer>;
    (filename: string, encoding: string): bluebird<string>;
    (filename: string, options: { encoding: string; flag?: string; }): bluebird<string>;
    (filename: string, options: { flag?: string; }): bluebird<Buffer>;
}

interface WriteFileSignature {
    (filename: string, data: any): bluebird<{}>;
    (filename: string, data: any, options: { encoding?: string; mode?: number; flag?: string; }): bluebird<{}>;
    (filename: string, data: any, options: { encoding?: string; mode?: string; flag?: string; }): bluebird<{}>;
}


const readFile = <ReadFileSignature>bluebird.promisify(fs.readFile);
const writeFile = <WriteFileSignature>bluebird.promisify(fs.writeFile);

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
    info: 12
}

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
            info: { de: parseInfo(thisLine[indexes.info]), fr: parseInfo(data.fr[i][indexes.info]), it: parseInfo(data.it[i][indexes.info]) }
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

function bufferToCells(buffer: Buffer) {
    const s: string = encoding.convert(buffer, 'UTF-8', 'Latin_1').toString();
    const lines = s.split('\u000a');
    return _.drop(lines.filter(x => x.length)).map(x => x.split(';'));
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

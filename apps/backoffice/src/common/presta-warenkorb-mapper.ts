import { keys, mapValues, values } from 'lodash';

import { Models as P } from '@lik-shared';

import { parseCsvText } from '../common/file-extensions';

type LanguageIndexes = { de: number; fr: number; it: number };

const indexes = {
    erhebungsschemaperiode: 0,
    erhebungsschemanummer: 1,
    gliederungspositionsnummer: 2,
    produktecode: 3,
    gliederungspositionstyp: 4,
    tiefencode: 5,
    positionsbezeichnung: { de: 6, fr: 7, it: 8 },
    periodizitaetscode: { de: 9, fr: 10, it: 11 },
    standardmenge: 12,
    standardeinheit: { de: 13, fr: 14, it: 15 },
    erhebungstyp: 16,
    anzahlPreiseProPMS: 17,
    beispiele: { de: 18, fr: 19, it: 20 },
    info: { de: 21, fr: 22, it: 23 },
    periodizitaetMonat1: 24,
    periodizitaetMonat2: 25,
    periodizitaetMonat3: 26,
    periodizitaetMonat4: 27,
    periodizitaetMonat5: 28,
    periodizitaetMonat6: 29,
    periodizitaetMonat7: 30,
    periodizitaetMonat8: 31,
    periodizitaetMonat9: 32,
    periodizitaetMonat10: 33,
    periodizitaetMonat11: 34,
    periodizitaetMonat12: 35,
    abweichungPmUG2: 36,
    abweichungPmOG2: 37,
    negativeLimite: 38,
    positiveLimite: 39,
    negativeLimite_1: 40,
    positiveLimite_1: 41,
    negativeLimite_7: 42,
    positiveLimite_7: 43,
    nichtEmpfohleneBc: 44,
    erhebungszeitpunkte: 45,
    produktmerkmale: { de: 46, fr: 47, it: 48 },
};

export function buildTree(data: string[][]) {
    const lastDepthGliederungspositionsnummers: { [index: number]: P.WarenkorbTreeItem } = {
        1: null,
        2: null,
        3: null,
        4: null,
        5: null,
        6: null,
        7: null,
        8: null,
    };

    const treeItems: P.WarenkorbTreeItem[] = [];
    for (let i = 0; i < data.length; i++) {
        try {
            const thisLine = data[i];
            const treeItem: P.WarenkorbTreeItem & { _id: string } = {
                _id: thisLine[indexes.gliederungspositionsnummer],
                index: i,
                type: 'LEAF',
                erhebungsschemaperiode: thisLine[indexes.erhebungsschemaperiode],
                gliederungspositionsnummer: thisLine[indexes.gliederungspositionsnummer],
                parentGliederungspositionsnummer: null,
                produktecode: parseProduktecode(thisLine[indexes.produktecode]),
                gliederungspositionstyp: parseGliederungspositionstyp(thisLine[indexes.gliederungspositionstyp]),
                tiefencode: parseTiefenCode(thisLine[indexes.tiefencode]),
                positionsbezeichnung: translationsToStringOrNull(thisLine, indexes.positionsbezeichnung),
                periodizitaetscode: translationsToStringOrNull(thisLine, indexes.periodizitaetscode),
                standardmenge: parseStandardmenge(thisLine[indexes.standardmenge]),
                standardeinheit: translationsToStringOrNull(thisLine, indexes.standardeinheit),
                erhebungstyp: thisLine[indexes.erhebungstyp],
                anzahlPreiseProPMS: parseAnzahlPreiseProPMS(thisLine[indexes.anzahlPreiseProPMS]),
                beispiele: translationsToStringOrNull(thisLine, indexes.beispiele),
                info: translationsToStringOrNull(thisLine, indexes.info),
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
                    thisLine[indexes.periodizitaetMonat12],
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
                erhebungszeitpunkte: parseNumberOrNull(thisLine[indexes.erhebungszeitpunkte]),
                productMerkmale: prepareProduktmerkmale(thisLine, indexes.produktmerkmale),
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
        } catch (error) {
            throw new Error(`Warenkorb Import Fehler (Zeile #${i + 1}): ${error.message}`);
        }
    }

    const erhebungsmonat = data[0] ? data[0][indexes.erhebungsschemaperiode] : '';
    return { warenkorb: treeItems, erhebungsmonat };
}

function parseProduktecode(s: string) {
    const cleanedString = s.replace(/^\s*(.*?)\s*$/, '$1');
    return !cleanedString.length ? null : cleanedString;
}

const parseInfo = parseOutQuotes;
const parseBeispiel = parseOutQuotes;
function parseOutQuotes(s: string) {
    const cleanedString = s.replace(/^\"?(.*?)\"?$/, '$1');
    return !cleanedString.length ? null : cleanedString;
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

// TODO: Remove if rly not needed
// function createHierarchyRecursive(
//     parent: P.WarenkorbTreeItem,
//     currentItemIndex: number,
//     treeItems: P.WarenkorbTreeItem[],
// ): P.WarenkorbHierarchicalTreeItem {
//     if (parent.type === 'LEAF') return parent;

//     const children = [];
//     let currentItem = treeItems[currentItemIndex];
//     for (
//         let i = currentItemIndex;
//         i < treeItems.length && !!currentItem && currentItem.tiefencode > parent.tiefencode;
//         i++
//     ) {
//         if (currentItem.tiefencode === parent.tiefencode + 1) {
//             children.push(createHierarchyRecursive(currentItem, i + 1, treeItems));
//         }
//         currentItem = treeItems[i + 1];
//     }
//     return assign({}, parent, { children });
// }

// function countHierarchicalItems(item: P.WarenkorbHierarchicalTreeItem): number {
//     if (item.type === 'LEAF') return 1;
//     return item.children.reduce((agg, v) => agg + countHierarchicalItems(v), 1);
// }

// function countHierarchicalLeaves(item: P.WarenkorbHierarchicalTreeItem): number {
//     if (item.type === 'LEAF') return 1;
//     return item.children.reduce((agg, v) => agg + countHierarchicalLeaves(v), 0);
// }

// function countHierarchicalBranches(item: P.WarenkorbHierarchicalTreeItem): number {
//     if (item.type === 'LEAF') return 0;
//     return item.children.reduce((agg, v) => agg + countHierarchicalBranches(v), 1);
// }

function parseBoolean(s: string) {
    return s.toLocaleLowerCase() === 'x';
}

function parsePeriodizitaet(periodizitaten: string[]) {
    return periodizitaten.reduce((prev, curr, index) => {
        return (prev |= parseBoolean(curr) ? <P.PeriodizitaetMonat>(1 << index) : P.PeriodizitaetMonat.None);
    }, P.PeriodizitaetMonat.None);
}

const parseAbweichung = parseNumberOrNull;

// TODO: Remove if rly not needed
// function parseStringOrEmpty(s: string) {
//     return !!s ? s.toString() : '';
// }

function translationsToStringOrNull(line: string[], langIndexes: LanguageIndexes): P.PropertyTranslation {
    const langKeys = Object.keys(langIndexes);
    return langKeys.some(lang => !!line[langIndexes[lang]])
        ? langKeys.reduce((translations, lang) => ({ ...translations, [lang]: line[langIndexes[lang]] }), {
              en: null,
          } as P.PropertyTranslation)
        : null;
}

function prepareProduktmerkmale(line: string[], langIndexes: LanguageIndexes): P.PropertyTranslation[] {
    const merkmale = mapValues(langIndexes, i => (!!line[i] ? parseSingleCsvText(line[i]) : []));
    const merkmaleList = [];
    Object.keys(merkmale).map(language => {
        merkmale[language].map((merkmal, i) => (merkmaleList[i] = { ...merkmaleList[i], [language]: merkmal || null }));
    });

    return merkmaleList;
}

function parseBearbeitungscode(bearbeitungcodes) {
    const getCodeNumber = code => {
        const index = values(P.bearbeitungscodeDescriptions).indexOf(code);
        return index !== -1 ? +keys(P.bearbeitungscodeDescriptions)[index] : code;
    };

    return parseSingleCsvText(bearbeitungcodes).map(getCodeNumber);
}

function parseSingleCsvText(text: string): string[] {
    return parseCsvText(text)[0] || [];
}

import { sortBy } from 'lodash';
import * as P from '../models';

export type WarenkorbInfo = {
    warenkorbItem: P.Models.WarenkorbTreeItem;
    hasChildren: boolean;
    leafCount: number;
    sortString: string;
    erhoben: number;
    soll: number;
};

export interface WarenkorbUiItem {
    isExpanded: boolean;
    isMarked: boolean;
    showBFS: boolean;
    canSelect: boolean;
    notInSeason: boolean;
    depth: number;
    filteredLeafCount: number;
    warenkorbInfo: P.WarenkorbInfo;
}

export type State = {
    warenkorb: P.Models.WarenkorbTreeItem[];
    warenkorbViewModel: WarenkorbInfo[];
    hiddenWarenkorbUiItems: WarenkorbUiItem[];
};

const initialState: State = {
    warenkorb: [],
    warenkorbViewModel: [],
    hiddenWarenkorbUiItems: [],
};

type Actions =
    | { type: 'LOAD_WARENKORB_SUCCESS'; payload: P.Models.WarenkorbTreeItem[] }
    | { type: 'LOAD_WARENKORB_FAIL'; payload: null }
    | { type: 'WARENKORB_RESET'; payload: null }
    | { type: 'HIDE_WARENKORB_UI_ITEM'; payload: WarenkorbUiItem }
    | { type: 'RESET_WARENKORB_VIEW'; payload: null };

export function reducer(state = initialState, action: Actions): State {
    switch (action.type) {
        case 'LOAD_WARENKORB_SUCCESS': {
            return {
                ...state,
                warenkorb: action.payload,
                warenkorbViewModel: sortAndTransformWarenkorb(action.payload, state.hiddenWarenkorbUiItems),
            };
        }

        case 'LOAD_WARENKORB_FAIL':
        case 'WARENKORB_RESET': {
            return initialState;
        }

        case 'HIDE_WARENKORB_UI_ITEM': {
            const hiddenWarenkorbUiItems = [...state.hiddenWarenkorbUiItems, action.payload];
            return {
                ...state,
                warenkorbViewModel: sortAndTransformWarenkorb(state.warenkorb, hiddenWarenkorbUiItems),
                hiddenWarenkorbUiItems,
            };
        }

        case 'RESET_WARENKORB_VIEW': {
            return {
                ...state,
                warenkorbViewModel: sortAndTransformWarenkorb(state.warenkorb, []),
                hiddenWarenkorbUiItems: [],
            };
        }

        default:
            return state;
    }
}

export const getWarenkorb = (state: State) => state.warenkorbViewModel;

type Item = {
    warenkorbItem: P.Models.WarenkorbTreeItem;
    hasChildren: boolean;
    leafCount: number;
    addLeafToParent: Function;
    sortString: string;
};

type ItemWithSollIst = {
    warenkorbItem: P.Models.WarenkorbTreeItem;
    erhoben: number;
    soll: number;
    addPmCount: (erhoben: number, soll: number) => void;
};

function sortAndTransformWarenkorb(
    warenkorb: P.Models.WarenkorbTreeItem[],
    hiddenWarenkorbUiItems: WarenkorbUiItem[],
): WarenkorbInfo[] {
    const hidden = hiddenWarenkorbUiItems.map(h => h.warenkorbInfo.warenkorbItem.gliederungspositionsnummer);
    const filtered = hiddenWarenkorbUiItems.length > 0 ? warenkorb.filter(filterHiddenWithReated(hidden)) : warenkorb;
    const result: (() => WarenkorbInfo & { sortString: string })[] = [];
    const gpMap: Record<string, Item> = {};
    filtered.forEach(w => {
        const item: Item = {
            warenkorbItem: w,
            hasChildren: false,
            leafCount: 0,
            addLeafToParent: () => {
                const parent = gpMap[item.warenkorbItem.parentGliederungspositionsnummer];
                if (parent) {
                    parent.leafCount++;
                    parent.addLeafToParent();
                }
            },
            sortString: gpMap[w.parentGliederungspositionsnummer]
                ? `${
                      gpMap[w.parentGliederungspositionsnummer].sortString
                  }_${w.gliederungspositionsnummer.toString().padStart(5, '0')}`
                : w.gliederungspositionsnummer.toString().padStart(5, '0'),
        };
        if (gpMap[w.parentGliederungspositionsnummer]) {
            gpMap[w.parentGliederungspositionsnummer].hasChildren = true;
        }
        if (w.type === 'LEAF') {
            item.addLeafToParent();
        }
        gpMap[w.gliederungspositionsnummer] = item;
        result.push(() => {
            const x = gpMap[w.gliederungspositionsnummer];
            return {
                warenkorbItem: x.warenkorbItem,
                hasChildren: x.hasChildren,
                leafCount: x.leafCount,
                sortString: x.sortString,
                erhoben: 0,
                soll: 0,
            };
        });
    });
    return sortBy(result.map(r => r()), r => r.sortString);
}

export function addPmCountToWarenkorb(
    warenkorb: WarenkorbInfo[],
    preismeldungen: P.PreismeldungBag[],
): WarenkorbInfo[] {
    const result: (() => WarenkorbInfo)[] = [];
    const gpMap: Record<string, ItemWithSollIst> = {};
    const erhobenMap: Record<string, number> = preismeldungen.reduce(
        (acc, bag) => ({
            ...acc,
            [bag.preismeldung.epNummer]:
                (acc[bag.preismeldung.epNummer] || 0) + (bag.preismeldung.bearbeitungscode !== 0 ? 1 : 0),
        }),
        {},
    );
    warenkorb.forEach(w => {
        const item: ItemWithSollIst = {
            warenkorbItem: w.warenkorbItem,
            erhoben: 0,
            soll: 0,
            addPmCount: (erhoben, soll) => {
                const parent = gpMap[item.warenkorbItem.parentGliederungspositionsnummer];
                if (parent) {
                    parent.erhoben += erhoben;
                    parent.soll += soll;
                    parent.addPmCount(erhoben, soll);
                }
            },
        };
        const epNummer = w.warenkorbItem.gliederungspositionsnummer;
        if (w.warenkorbItem.type === 'LEAF') {
            item.erhoben = erhobenMap[epNummer] || 0;
            item.soll = w.warenkorbItem.anzahlPreiseProPMS;
            item.addPmCount(item.erhoben, item.soll);
        }
        gpMap[epNummer] = item;
        result.push(() => {
            const info = gpMap[epNummer];
            return {
                ...w,
                erhoben: info.erhoben,
                soll: info.soll,
            };
        });
    });
    return sortBy(result.map(r => r()), r => r.sortString);
}

const filterHiddenWithReated = (hidden: string[]) => {
    let previousMatchedTiefencode: number = null;
    return (item: P.Models.WarenkorbTreeItem) => {
        const isHidden = hidden.indexOf(item.gliederungspositionsnummer) !== -1;
        if (previousMatchedTiefencode !== null && item.tiefencode > previousMatchedTiefencode) {
            return false;
        }
        if (isHidden) {
            previousMatchedTiefencode = item.tiefencode;
        } else {
            previousMatchedTiefencode = null;
        }
        return !isHidden;
    };
};

import { Component, Input, Output, EventEmitter, OnChanges, SimpleChange, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslateService } from 'ng2-translate';
import { assign } from 'lodash';

import { ReactiveComponent, PefDialogService, pefContains } from 'lik-shared';
import { DialogNewPmBearbeitungsCodeComponent } from '../../../common/components/dialog-new-pm-bearbeitungs-code/dialog-new-pm-bearbeitungs-code';

import * as P from '../../../common-models';

import { PefDialogYesNoComponent } from 'lik-shared';

type WarenkorbUiItem = {
    isExpanded: boolean;
    depth: number;
    preismeldungCount: number;
    filteredLeafCount: number;
    warenkorbInfo: P.WarenkorbInfo
};

@Component({
    selector: 'choose-from-warenkorb',
    templateUrl: 'choose-from-warenkorb.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChooseFromWarenkorbComponent extends ReactiveComponent implements OnChanges {
    @Input() warenkorb: P.Models.WarenkorbTreeItem[];
    @Input() preismeldungen: P.PreismeldungBag[];
    @Input() currentLanguage: string;
    @Output('closeChooseFromWarenkorb') closeChooseFromWarenkorb$: Observable<{ warenkorbPosition: P.Models.WarenkorbLeaf, bearbeitungscode: P.Models.Bearbeitungscode }>;

    private warenkorbUiItems$: Observable<WarenkorbUiItem[]>;
    public numberOfEp$: Observable<number>;

    public warenkorbItemClicked$ = new EventEmitter<WarenkorbUiItem>();
    public warenkorbItemEpExpand$ = new EventEmitter<WarenkorbUiItem>();
    public selectWarenkorbItem$ = new EventEmitter<WarenkorbUiItem>();
    public closeClicked$ = new EventEmitter();
    public searchString$ = new EventEmitter<string>();
    public currentLanguage$ = this.observePropertyCurrentValue<string>('currentLanguage');

    constructor(private pefDialogService: PefDialogService, translateService: TranslateService) {
        super();

        const warenkobUiItems$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('warenkorb')
            .combineLatest(this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen').filter(x => !!x && !!x.length), (warenkorb: P.WarenkorbInfo[], preismeldungen: P.PreismeldungBag[]) => {
                return warenkorb.map(warenkorbInfo => ({
                    isExpanded: false,
                    depth: warenkorbInfo.warenkorbItem.tiefencode,
                    preismeldungCount: preismeldungen.filter(y => y.preismeldung.epNummer === warenkorbInfo.warenkorbItem.gliederungspositionsnummer).length,
                    filteredLeafCount: warenkorbInfo.leafCount,
                    warenkorbInfo
                }));
            }).delay(100);

        const warenkobUiItemsFiltered$ = warenkobUiItems$
            .combineLatest(this.searchString$.debounceTime(500).startWith(null), this.currentLanguage$, (warenkobUiItems: WarenkorbUiItem[], searchString: string, currentLanguage: string) => {
                if (searchString === null) return warenkobUiItems;
                const filtered = warenkobUiItems
                    .filter(x => x.warenkorbInfo.warenkorbItem.type === 'BRANCH'
                        || (x.warenkorbInfo.warenkorbItem.type === 'LEAF' && pefContains(searchString, x, [y => y.warenkorbInfo.warenkorbItem.positionsbezeichnung[currentLanguage], y => !y.warenkorbInfo.warenkorbItem.beispiele ? null : y.warenkorbInfo.warenkorbItem.beispiele[currentLanguage]])));
                return filtered.map(x => assign({}, x, { filteredLeafCount: x.warenkorbInfo.warenkorbItem.type === 'LEAF' ? 0 : this.findDescendantsOfWarenkorbItem(filtered, x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer).filter(y => y.warenkorbInfo.warenkorbItem.type === 'LEAF').length }));
            })
            .publishReplay(1).refCount();

        type ClickType = { action: 'EXPAND' | 'EXPAND_ALL', warenkorbItemClicked: WarenkorbUiItem };

        this.warenkorbUiItems$ = this.warenkorbItemClicked$.filter(x => x.warenkorbInfo.warenkorbItem.type === 'BRANCH').map(x => ({ action: 'EXPAND', warenkorbItemClicked: x }))
            .merge(this.warenkorbItemEpExpand$.map(x => ({ action: 'EXPAND_ALL', warenkorbItemClicked: x })))
            .startWith(null)
            .combineLatest(warenkobUiItemsFiltered$, (clickType: ClickType, warenkorb: WarenkorbUiItem[]) => ({ clickType, warenkorb }))
            .scan((agg, v) => {
                if (v.clickType == null) return v.warenkorb.filter(x => x.warenkorbInfo.warenkorbItem.tiefencode === 2);
                const clickedGliederungspositionsnummer = v.clickType.warenkorbItemClicked.warenkorbInfo.warenkorbItem.gliederungspositionsnummer;
                if (v.clickType.warenkorbItemClicked.isExpanded) {
                    const descendants = this.findDescendantsOfWarenkorbItem(v.warenkorb, clickedGliederungspositionsnummer).map(x => x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer);
                    return v.warenkorb.filter(x => agg.some(y => y.warenkorbInfo.warenkorbItem.gliederungspositionsnummer === x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer) && !descendants.some(y => y === x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer))
                        .map(x => x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer === clickedGliederungspositionsnummer ? assign({}, x, { isExpanded: false }) : x);
                }
                if (v.clickType.action === 'EXPAND') {
                    return v.warenkorb
                        .filter(x => agg.some(y => y.warenkorbInfo.warenkorbItem.gliederungspositionsnummer === x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer) || x.warenkorbInfo.warenkorbItem.parentGliederungspositionsnummer === clickedGliederungspositionsnummer)
                        .map(x => agg.find(y => y.warenkorbInfo.warenkorbItem.gliederungspositionsnummer === x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer) || x)
                        .map(x => x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer === clickedGliederungspositionsnummer ? assign({}, x, { isExpanded: true }) : x);
                }
                else {
                    const descendants = this.findDescendantsOfWarenkorbItem(v.warenkorb, clickedGliederungspositionsnummer).filter(x => x.warenkorbInfo.warenkorbItem.type === 'LEAF').map(x => x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer);
                    return v.warenkorb
                        .filter(x => agg.some(y => y.warenkorbInfo.warenkorbItem.gliederungspositionsnummer === x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer) || descendants.some(y => y === x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer))
                        .map(x => agg.find(y => y.warenkorbInfo.warenkorbItem.gliederungspositionsnummer === x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer) || assign({}, x, { depth: v.clickType.warenkorbItemClicked.depth + 1 }))
                        .map(x => x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer === clickedGliederungspositionsnummer ? assign({}, x, { isExpanded: true }) : x);
                }
            }, <WarenkorbUiItem[]>[]);

        this.numberOfEp$ = warenkobUiItemsFiltered$.map(x => x.filter(y => y.warenkorbInfo.warenkorbItem.type === 'LEAF').length).startWith(0);

        const dialogSufficientPreismeldungen$ = Observable.defer(() => pefDialogService.displayDialog(PefDialogYesNoComponent, translateService.instant('dialogText_sufficientPreismeldungen')).map(x => x.data));
        const dialogNewPmbearbeitungsCode$ = Observable.defer(() => pefDialogService.displayDialog(DialogNewPmBearbeitungsCodeComponent, {}).map(x => x.data));

        this.closeChooseFromWarenkorb$ = this.selectWarenkorbItem$.flatMap(warenkorbUiItem => (warenkorbUiItem.preismeldungCount >= (warenkorbUiItem.warenkorbInfo.warenkorbItem as P.Models.WarenkorbLeaf).anzahlPreiseProPMS ? dialogSufficientPreismeldungen$ : Observable.of('YES')).map(x => ({ answer: x, warenkorbUiItem })))
            .filter(x => x.answer === 'YES')
            .map(x => x.warenkorbUiItem.warenkorbInfo.warenkorbItem)
            .flatMap(warenkorbPosition => dialogNewPmbearbeitungsCode$.filter(dialogReturnValue => dialogReturnValue.action === 'OK').map(dialogReturnValue => ({ warenkorbPosition, bearbeitungscode: dialogReturnValue.bearbeitungscode })))
            .merge(this.closeClicked$.mapTo(null));
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    iconMap = {
        1: 'navigation_food',
        2: 'navigation_alcohol_tobacco',
        3: 'navigation_clothing',
        4: 'navigation_living_energy',
        5: 'navigation_furniture',
        6: 'navigation_health',
        7: 'navigation_traffic',
        8: 'navigation_messages',
        9: 'navigation_leisure',
        10: 'navigation_teaching',
        11: 'navigation_restaurants_hotels',
        12: 'navigation_services'
    };

    findDescendantsOfWarenkorbItem(warenkorb: WarenkorbUiItem[], gliederungspositionsnummer: string): WarenkorbUiItem[] {
        return warenkorb.filter(x => x.warenkorbInfo.warenkorbItem.parentGliederungspositionsnummer === gliederungspositionsnummer)
            .reduce((agg, v) => [...agg, v, ...this.findDescendantsOfWarenkorbItem(warenkorb, v.warenkorbInfo.warenkorbItem.gliederungspositionsnummer)], []);
    }
}

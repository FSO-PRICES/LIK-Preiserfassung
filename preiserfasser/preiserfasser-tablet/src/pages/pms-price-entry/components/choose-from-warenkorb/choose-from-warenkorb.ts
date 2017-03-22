import { Component, Input, Output, EventEmitter, OnChanges, SimpleChange } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslateService } from 'ng2-translate';
import { assign, sortBy } from 'lodash';

import { ReactiveComponent, PefDialogService } from 'lik-shared';

import * as P from '../../../../common-models';

import { PefDialogYesNoComponent } from 'lik-shared';

type WarenkorbUiItem = P.Models.WarenkorbTreeItem & {
    hasChildren: boolean;
    isExpanded: boolean;
    preismeldungCount: number;
    leaftCount: number;
};

@Component({
    selector: 'choose-from-warenkorb',
    templateUrl: 'choose-from-warenkorb.html'
})
export class ChooseFromWarenkorbComponent extends ReactiveComponent implements OnChanges {
    @Input('warenkorbFlat') warenkorbFlat: P.Models.WarenkorbTreeItem[];
    @Input('preismeldungen') preismeldungen: P.PreismeldungBag[];
    @Output('closeChooseFromWarenkorb') closeChooseFromWarenkorb$: Observable<P.Models.WarenkorbLeaf>;

    private warenkorb$: Observable<P.Models.WarenkorbTreeItem[]>;

    public warenkorbItemClicked$ = new EventEmitter<WarenkorbUiItem>();
    public warenkorbItemEpExpand$ = new EventEmitter<WarenkorbUiItem>();
    public selectWarenkorbItem$ = new EventEmitter<WarenkorbUiItem>();
    public closeClicked$ = new EventEmitter();

    constructor(private pefDialogService: PefDialogService, translateService: TranslateService) {
        super();

        const warenkorbFlat$ = this.observePropertyCurrentValue<P.Models.WarenkorbTreeItem[]>('warenkorbFlat')
            .combineLatest(this.observePropertyCurrentValue('preismeldungen'), (warenkorb, preismeldungen: P.PreismeldungBag[]) => ({ warenkorb, preismeldungen }))
            .map(x => this.sortAndTransformWarenkorb(x.warenkorb, x.preismeldungen, y => y.tiefencode === 2));

        this.warenkorb$ = this.warenkorbItemClicked$.filter(x => x.type === 'BRANCH')
            .startWith(null)
            .combineLatest(warenkorbFlat$, (warenkorbItemClicked: WarenkorbUiItem, warenkorbFlat: WarenkorbUiItem[]) => ({ warenkorbItemClicked, warenkorbFlat }))
            .scan((agg, v) => {
                if (v.warenkorbItemClicked == null) return v.warenkorbFlat.filter(x => x.tiefencode === 2);
                if (v.warenkorbItemClicked.isExpanded) {
                    const descendants = this.findDescendantsOfWarenkorbItem(v.warenkorbFlat, v.warenkorbItemClicked.gliederungspositionsnummer);
                    return agg.filter(x => !descendants.some(y => y === x.gliederungspositionsnummer))
                        .map(x => x.gliederungspositionsnummer === v.warenkorbItemClicked.gliederungspositionsnummer ? assign({}, x, { isExpanded: false }) : x);
                }
                return v.warenkorbFlat
                    .filter(x => agg.some(y => y.gliederungspositionsnummer === x.gliederungspositionsnummer) || x.parentGliederungspositionsnummer === v.warenkorbItemClicked.gliederungspositionsnummer)
                    .map(x => agg.find(y => y.gliederungspositionsnummer === x.gliederungspositionsnummer) || x)
                    .map(x => x.gliederungspositionsnummer === v.warenkorbItemClicked.gliederungspositionsnummer ? assign({}, x, { isExpanded: true }) : x);
            }, <WarenkorbUiItem[]>[]);

        const dialogSufficientPreismeldungen$ = Observable.defer(() => pefDialogService.displayDialog(PefDialogYesNoComponent, translateService.instant('dialogText_sufficientPreismeldungen')).map(x => x.data));

        this.closeChooseFromWarenkorb$ = this.selectWarenkorbItem$.flatMap(warenkorbItem => (warenkorbItem.preismeldungCount >= (warenkorbItem as P.Models.WarenkorbLeaf).anzahlPreiseProPMS ? dialogSufficientPreismeldungen$ : Observable.of('YES')).map(x => ({ answer: x, warenkorbItem })))
            .filter(x => x.answer === 'YES')
            .map(x => x.warenkorbItem)
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

    sortAndTransformWarenkorb(warenkorb: P.Models.WarenkorbTreeItem[], preismeldungen: P.PreismeldungBag[], filterFn: (item: P.Models.WarenkorbTreeItem) => boolean): WarenkorbUiItem[] {
        return sortBy(warenkorb.filter(filterFn), x => +x.gliederungspositionsnummer)
            .reduce((agg, v) => {
                const descendents = this.sortAndTransformWarenkorb(warenkorb, preismeldungen, x => x.parentGliederungspositionsnummer === v.gliederungspositionsnummer);
                const item = assign({}, v, {
                    hasChildren: descendents.length > 0,
                    isExpanded: false,
                    preismeldungCount: preismeldungen.filter(x => x.preismeldung.epNummer === v.gliederungspositionsnummer).length,
                    leafCount: descendents.filter(x => !x.hasChildren).length
                });
                return [...agg, item, ...descendents];
            }, []);
    }

    findDescendantsOfWarenkorbItem(warenkorb: WarenkorbUiItem[], gliederungspositionsnummer: string): string[] {
        return warenkorb.filter(x => x.parentGliederungspositionsnummer === gliederungspositionsnummer)
            .reduce((agg, v) => [...agg, v.gliederungspositionsnummer, ...this.findDescendantsOfWarenkorbItem(warenkorb, v.gliederungspositionsnummer)], []);
    }
}

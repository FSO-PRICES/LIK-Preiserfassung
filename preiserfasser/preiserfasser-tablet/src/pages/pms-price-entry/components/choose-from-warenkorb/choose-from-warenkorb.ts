import { Component, Input, Output, EventEmitter, OnChanges, SimpleChange } from '@angular/core';
import { Observable } from 'rxjs';
import { assign, sortBy } from 'lodash'

import { ReactiveComponent } from 'lik-shared';

import * as P from '../../../../common-models';

type WarenkorbUiItem = P.Models.WarenkorbTreeItem & {
    hasChildren: boolean;
    isExpanded: boolean;
};

@Component({
    selector: 'choose-from-warenkorb',
    templateUrl: 'choose-from-warenkorb.html'
})
export class ChooseFromWarenkorbComponent extends ReactiveComponent implements OnChanges {
    @Input('warenkorbFlat') warenkorbFlat: P.Models.WarenkorbTreeItem[];
    @Output('closeChooseFromWarenkorb') closeChooseFromWarenkorb$ = new EventEmitter<string>();

    private warenkorb$: Observable<P.Models.WarenkorbTreeItem[]>;

    public warenkorbItemClicked$ = new EventEmitter<WarenkorbUiItem>();

    constructor() {
        super();

        const warenkorbFlat$ = this.observePropertyCurrentValue<P.Models.WarenkorbTreeItem[]>('warenkorbFlat')
            .map(warenkorb => this.sortAndTransformWarenkorb(warenkorb, x => x.tiefencode === 2));

        this.warenkorb$ = this.warenkorbItemClicked$.filter(x => x.type === 'BRANCH').startWith(null)
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

    sortAndTransformWarenkorb(warenkorb: P.Models.WarenkorbTreeItem[], filterFn: (item: P.Models.WarenkorbTreeItem) => boolean): WarenkorbUiItem[] {
        return sortBy(warenkorb.filter(filterFn), x => +x.gliederungspositionsnummer)
            .reduce((agg, v) => {
                const descendents = this.sortAndTransformWarenkorb(warenkorb, x => x.parentGliederungspositionsnummer === v.gliederungspositionsnummer);
                const item = assign({}, v, {
                    hasChildren: descendents.length > 0,
                    isExpanded: false,
                });
                return [...agg, item, ...descendents];
            }, []);
    }

    findDescendantsOfWarenkorbItem(warenkorb: WarenkorbUiItem[], gliederungspositionsnummer: string): string[] {
        return warenkorb.filter(x => x.parentGliederungspositionsnummer === gliederungspositionsnummer)
            .reduce((agg, v) => [...agg, v.gliederungspositionsnummer, ...this.findDescendantsOfWarenkorbItem(warenkorb, v.gliederungspositionsnummer)], []);
    }
}

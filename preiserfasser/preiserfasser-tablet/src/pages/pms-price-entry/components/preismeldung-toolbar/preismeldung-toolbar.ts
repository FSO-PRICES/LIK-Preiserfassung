import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChange } from '@angular/core';
import { Observable } from 'rxjs';

import { ReactiveComponent } from 'lik-shared';

import * as P from '../../../../common-models';

@Component({
    selector: 'preismeldung-toolbar',
    templateUrl: 'preismeldung-toolbar.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldungToolbarComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.Models.Preismeldung;
    @Input() selectedTab: string;
    @Output('selectTab') selectTab$ = new EventEmitter<string>();;
    @Output('buttonClicked') buttonClicked$ = new EventEmitter<string>();

    public preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>('preismeldung');
    public selectedTab$ = this.observePropertyCurrentValue<string>('selectedTab')
        .publishReplay(1).refCount();
    public hasAttributes$: Observable<boolean>;
    public requestPreismeldungQuickEqualDisabled$: Observable<boolean>;

    constructor() {
        super();

        this.selectedTab$.subscribe();

        this.hasAttributes$ = this.preismeldung$
            .map(p => !!p && !!p.warenkorbPosition.productMerkmale && !!p.warenkorbPosition.productMerkmale.length); // TODO: remove null check

        this.requestPreismeldungQuickEqualDisabled$ = this.preismeldung$.map(x => !!x && [2, 3, 7].some(y => y === x.preismeldung.bearbeitungscode)).startWith(false);
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}

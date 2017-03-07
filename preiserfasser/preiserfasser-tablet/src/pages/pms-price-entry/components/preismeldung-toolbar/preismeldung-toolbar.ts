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
    @Output('selectedTab') selectedTab$: Observable<string>;
    @Output('buttonClicked') buttonClicked$ = new EventEmitter<string>();

    public preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');
    public selectTab$ = new EventEmitter<string>();
    public hasAttributes$: Observable<boolean>;

    constructor() {
        super();

        this.selectedTab$ = this.selectTab$
            .startWith('PREISMELDUNG')
            .publishReplay(1).refCount();

        this.hasAttributes$ = this.preismeldung$
            .map(p => !!p.warenkorbPosition.productMerkmale && !!p.warenkorbPosition.productMerkmale.length); // TODO: remove null check
    }

    isSelected$(tabName: string) {
        return this.selectedTab$.map(x => x === tabName);
    }

    isDisabled$(tabName: string) {
        return this.selectedTab$.map(x => x === tabName);
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}

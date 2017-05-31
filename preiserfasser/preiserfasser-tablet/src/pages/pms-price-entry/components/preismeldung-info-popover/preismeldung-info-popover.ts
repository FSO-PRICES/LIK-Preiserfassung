import { Component, EventEmitter, Input, OnChanges, SimpleChange, ElementRef, Inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';

import { ReactiveComponent, formatPercentageChange, preisNumberFormattingOptions, mengeNumberFormattingOptions } from 'lik-shared';

import * as P from '../../../../common-models';

@Component({
    selector: 'preismeldung-info-popover',
    templateUrl: 'preismeldung-info-popover.html'
})
export class PreismeldungInfoPopover extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.PreismeldungBag;
    @Input() forceClose: {};
    @Input() extraWidth: string;

    public preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');
    public buttonClicked$ = new EventEmitter();
    public popoverActive$: Observable<boolean>;
    public popoverLeft$: Observable<string>;
    public popoverWidth$: Observable<string>;
    public popoverMaxHeight$: Observable<string>;
    public comparisonContainerWidth$: Observable<number>;

    public preisNumberFormattingOptions = preisNumberFormattingOptions;
    public mengeNumberFormattingOptions = mengeNumberFormattingOptions;

    constructor(elementRef: ElementRef, private sanitizer: DomSanitizer, @Inject('windowObject') window: any) {
        super();

        this.comparisonContainerWidth$ = Observable.of(300);

        this.popoverActive$ = this.buttonClicked$.map(x => ({ type: 'TOGGLE' }))
            .merge(this.observePropertyCurrentValue<{}>('forceClose').map(_ => ({ type: 'SET', value: false })))
            .scan<{ type: 'TOGGLE' | 'SET', value?: boolean; }, boolean>((active: boolean, v) => {
                if (v.type === 'TOGGLE') return !active;
                return v.value;
            }, false)
            .startWith(false)
            .publishReplay(1).refCount();

        const recalcPopover$ = this.popoverActive$.filter(x => x)
            .publishReplay(1).refCount();

        this.popoverWidth$ = recalcPopover$
            .map(() => `calc(${elementRef.nativeElement.offsetLeft}px + ${elementRef.nativeElement.offsetWidth}px + ${this.extraWidth || '0px'} - 16px - ${this.pefRelativeSize(window.innerWidth, 1)})`);

        this.popoverLeft$ = recalcPopover$
            .map(() => `calc(${this.pefRelativeSize(window.innerWidth, 1)})`);

        this.popoverMaxHeight$ = recalcPopover$
            .map(() => `calc(${elementRef.nativeElement.offsetParent.clientHeight}px - ${elementRef.nativeElement.offsetTop}px - ${elementRef.nativeElement.clientHeight}px - ${this.pefRelativeSize(window.innerWidth, 1)})`);
    }

    formatPercentageChange = percentageChange => formatPercentageChange(percentageChange, 1);

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    pefRelativeSize(windowWidth: number, n: number) {
        return windowWidth <= 1280
            ? `(${n} * 1em)`
            : `(${n} * 16px)`;
    }
}

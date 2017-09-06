import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ElementRef, Inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';

import { ReactiveComponent, formatPercentageChange, preisNumberFormattingOptions, mengeNumberFormattingOptions } from '../../../../../';

import * as P from '../../../../models';

@Component({
    selector: 'preismeldung-info-popover-left',
    template: `
        <button ion-button icon-only color="wild-sand" class="info-toggle" [class.active]="popoverActive$ | async" (click)="buttonClicked$.emit()">
            <pef-icon name="price_tag_info"></pef-icon>
        </button>
        <div class="info-popover"
            [style.display]="'none'"
            [style.left]="sanitizer.bypassSecurityTrustStyle(popoverLeft$ | async)"
            [style.maxHeight]="sanitizer.bypassSecurityTrustStyle(popoverMaxHeight$ | async)"
            [style.width]="sanitizer.bypassSecurityTrustStyle(popoverWidth$ | async)"
            [style.height]="sanitizer.bypassSecurityTrustStyle(popoverHeight$ | async)">
        </div>`
})
export class PreismeldungInfoPopoverLeft extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.PreismeldungBag;
    @Input() forceClose: {};
    @Input() height: string;
    @Input() extraWidth: string;
    @Output('popoverActive') popoverActive$: Observable<boolean>;

    public preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');
    public buttonClicked$ = new EventEmitter();
    public popoverLeft$: Observable<string>;
    public popoverWidth$: Observable<string>;
    public popoverHeight$: Observable<string>;
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
            // .map(() => `calc(${elementRef.nativeElement.offsetLeft}px + ${elementRef.nativeElement.offsetWidth}px + ${this.extraWidth || '0px'} - 16px - ${this.pefRelativeSize(window.innerWidth, 1)})`);
            .map(() => `calc(${elementRef.nativeElement.offsetLeft}px + ${elementRef.nativeElement.offsetWidth}px + ${this.extraWidth || '0px'} - ${this.pefRelativeSize(window.innerWidth, 1)})`);

        this.popoverHeight$ = this.observePropertyCurrentValue<string>('height')
            .map(height => `calc(${height || '0px'} + 1px)`);

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

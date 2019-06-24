import { Observable, of as observableOf } from 'rxjs';

import { Component, ElementRef, EventEmitter, Inject, Input, OnChanges, Output, SimpleChange } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { filter, map, merge, publishReplay, refCount, scan, startWith } from 'rxjs/operators';

import {
    formatPercentageChange,
    mengeNumberFormattingOptions,
    preisNumberFormattingOptions,
    ReactiveComponent,
} from '../../../../../';

import * as P from '../../../../models';

@Component({
    selector: 'preismeldung-info-popover-right',
    template: `
        <ion-button
            icon-only
            color="wild-sand"
            class="info-toggle"
            [class.active]="popoverActive$ | async"
            (click)="buttonClicked$.emit()"
        >
            <pef-icon name="price_tag_info"></pef-icon>
        </ion-button>
        <!--[style.display]="(popoverActive$ | async) ? 'flex' : 'none'"-->
        <div
            class="info-popover"
            [style.display]="none"
            [style.left]="sanitizer.bypassSecurityTrustStyle(popoverLeft$ | async)"
            [style.maxHeight]="sanitizer.bypassSecurityTrustStyle(popoverMaxHeight$ | async)"
            [style.width]="sanitizer.bypassSecurityTrustStyle(popoverWidth$ | async)"
            [style.height]="sanitizer.bypassSecurityTrustStyle(popoverHeight$ | async)"
        ></div>
    `,
})
export class PreismeldungInfoPopoverRight extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.PreismeldungBag;
    @Input() forceClose: {};
    @Input() height: string;
    @Input() popoverLeft: string;
    @Input() width: string;
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

    constructor(elementRef: ElementRef, public sanitizer: DomSanitizer, @Inject('windowObject') window: any) {
        super();

        this.comparisonContainerWidth$ = observableOf(300);

        this.popoverActive$ = this.buttonClicked$.pipe(
            map(x => ({ type: 'TOGGLE' })),
            merge(this.observePropertyCurrentValue<{}>('forceClose').pipe(map(_ => ({ type: 'SET', value: false })))),
            scan<{ type: 'TOGGLE' | 'SET'; value?: boolean }, boolean>((active: boolean, v) => {
                if (v.type === 'TOGGLE') return !active;
                return v.value;
            }, false),
            startWith(false),
            publishReplay(1),
            refCount(),
        );

        const recalcPopover$ = this.popoverActive$.pipe(
            filter(x => x),
            publishReplay(1),
            refCount(),
        );

        this.popoverWidth$ = recalcPopover$.pipe(map(() => this.width));

        this.popoverHeight$ = recalcPopover$.pipe(map(() => `calc(${this.height || '0px'} + 1px)`));

        this.popoverLeft$ = recalcPopover$.pipe(
            map(() => `calc(${this.popoverLeft} + ${this.pefRelativeSize(window.innerWidth, 1)})`),
        );

        this.popoverMaxHeight$ = recalcPopover$.pipe(
            map(
                () =>
                    `calc(${elementRef.nativeElement.offsetParent.clientHeight}px - ${
                        elementRef.nativeElement.offsetTop
                    }px - ${elementRef.nativeElement.clientHeight}px - ${this.pefRelativeSize(window.innerWidth, 1)})`,
            ),
        );
    }

    formatPercentageChange = percentageChange => formatPercentageChange(percentageChange, 1);

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    pefRelativeSize(windowWidth: number, n: number) {
        return windowWidth <= 1280 ? `(${n} * 1em)` : `(${n} * 16px)`;
    }
}

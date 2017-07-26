import { Component, EventEmitter, OnDestroy, Input, ViewChild, OnChanges, SimpleChange, ChangeDetectionStrategy, ElementRef } from '@angular/core';
import { ReactiveComponent, PefVirtualScrollComponent } from 'lik-shared';

import * as dragula from 'dragula';
import * as autoScroll from 'dom-autoscroller';
import * as P from '../../../common-models';

@Component({
    selector: 'pms-sort',
    templateUrl: 'pms-sort.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PmsSortComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preismeldungen: P.PreismeldungBag[];
    @Input() isDesktop: boolean;

    @ViewChild(PefVirtualScrollComponent)
    private virtualScroll: any;

    private drake: any;
    private scroll: any;

    preismeldungen$ = this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen');

    private subscriptions = [];

    public items = ['a', 'b', 'c'];

    constructor(private el: ElementRef) {
        super();

        // this.preismeldungen$.delay(100).subscribe(() => this.virtualScroll.refresh());
    }

    ngOnInit() {
        const scrollableContent = this.el.nativeElement.querySelector('pef-virtual-scroll > div.scrollable-content');
        this.drake = dragula([scrollableContent], {
            // drag: (el, source) => {
            //     console.log(source)
            // },
            // drop: () => { }
        } as dragula.DragulaOptions);
        this.drake.on('drag', (el, source) => {
            console.log(el);
        });
        this.scroll = autoScroll([window, this.el.nativeElement.querySelector('pef-virtual-scroll')], {
            margin: 20,
            maxSpeed: 20,
            scrollWhenOutside: false,
            autoScroll: () => this.drake.dragging
        });
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
        this.drake.destroy();
        this.scroll.destroy();
    }
}

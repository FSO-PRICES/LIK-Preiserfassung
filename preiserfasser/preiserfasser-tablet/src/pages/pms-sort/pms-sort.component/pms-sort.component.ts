import { Component, EventEmitter, OnDestroy, Input, ViewChild, OnChanges, SimpleChange, ChangeDetectionStrategy, ElementRef, AfterViewInit, OnInit, Inject } from '@angular/core';
import { ReactiveComponent, PefVirtualScrollComponent } from 'lik-shared';

import { DragulaService } from 'ng2-dragula';
import dragula from 'dragula';
import autoScroll from 'dom-autoscroller';

import * as P from '../../../common-models';
import { Observable } from 'rxjs';

@Component({
    selector: 'pms-sort',
    templateUrl: 'pms-sort.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PmsSortComponent extends ReactiveComponent implements OnChanges, OnDestroy, OnInit, AfterViewInit {
    @Input() preismeldungen: P.PreismeldungBag[];
    @Input() isDesktop: boolean;

    @ViewChild(PefVirtualScrollComponent)
    private virtualScroll: any;

    private drake: dragula.Drake;
    private scroll: any;

    private ngAfterViewInit$ = new EventEmitter();

    private preismeldungen$: Observable<P.PreismeldungBag[]>;

    private subscriptions = [];

    constructor(private el: ElementRef) {
        super();

        // const setupDraggingAndScrolling$ = this.ngAfterViewInit$.do(() => this.setupDraggingAndScrolling());
        this.preismeldungen$ = this.ngAfterViewInit$
            .delay(500)
            .flatMap(() => this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen'));

        // window.addEventListener('touchmove', function () { });
    }

    public ngOnInit() {
        const drake = this.drake = dragula([this.el.nativeElement.querySelector('.list')], {
            moves: (el, container, handle) => {
                let searchElement = handle;
                while (searchElement !== el && searchElement.className !== 'drag-handle') {
                    searchElement = searchElement.parentElement;
                }
                return searchElement.className === 'drag-handle';
            }
        });
        this.scroll = autoScroll(
            [this.el.nativeElement.querySelector('.pm-container')], {
                margin: 30,
                maxSpeed: 25,
                scrollWhenOutside: true,
                autoScroll: function () {
                    return this.down && drake.dragging;
                }
            }
        )
    }

    public ngAfterViewInit() { this.ngAfterViewInit$.emit() };

    setupDraggingAndScrolling() {
        // const scrollableContent = this.el.nativeElement.querySelector('.list');
        // const thisDrake = this.drake = dragula([scrollableContent], {
        //     margin: 20,
        //     maxSpeed: 5,
        //     scrollWhenOutside: true
        // } as dragula.DragulaOptions);
        // this.drake.on('drag', (el, source) => {
        //     console.log(el);
        // });
        // // this.scroll = autoScroll([this.el.nativeElement.querySelector('pef-virtual-scroll')], {
        // this.scroll = autoScroll([this.el.nativeElement.querySelector('.pm-container')], {
        //     margin: 20,
        //     maxSpeed: 20,
        //     scrollWhenOutside: false,
        //     autoScroll: function () { return this.down && thisDrake.dragging }
        // });
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
        // this.dragulaService.destroy('bag');
        this.drake.destroy();
        this.scroll.destroy();
    }
}

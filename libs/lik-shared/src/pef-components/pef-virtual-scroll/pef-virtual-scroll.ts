import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { debounceTime, switchMap, takeUntil } from 'rxjs/operators';

export interface ChangeEvent {
    start?: number;
    end?: number;
}

@Component({
    selector: 'pef-virtual-scroll,[pefVirtualScroll]',
    exportAs: 'pefVirtualScroll',
    templateUrl: 'pef-virtual-scroll.html',
    styleUrls: ['pef-virtual-scroll.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PefVirtualScrollComponent implements OnInit, OnDestroy, OnChanges {
    @Input()
    items: any[] = [];

    @Input()
    scrollbarWidth: number;

    @Input()
    scrollbarHeight: number;

    @Input()
    childWidth: number;

    @Input()
    childHeight: number;

    @Output()
    update: EventEmitter<any[]> = new EventEmitter<any[]>();

    @Output()
    change: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();

    @Output()
    start: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();

    @Output()
    end: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();

    @ViewChild('content', { read: ElementRef, static: true })
    contentElementRef: ElementRef;

    scroll$: Observable<Event>;
    onDestroy$ = new EventEmitter();

    onScrollListener: Function;
    topPadding: number;
    scrollHeight: number;
    previousStart: number;
    previousEnd: number;
    startupLoop = true;

    constructor(private element: ElementRef<HTMLElement>) {
        this.scroll$ = fromEvent(element.nativeElement, 'scroll').pipe(debounceTime(10));
    }

    ngOnInit() {
        this.scroll$
            .pipe(
                switchMap(() => this.refresh()),
                takeUntil(this.onDestroy$),
            )
            .subscribe();

        this.scrollbarWidth = 0; // this.element.nativeElement.offsetWidth - this.element.nativeElement.clientWidth;
        this.scrollbarHeight = 0; // this.element.nativeElement.offsetHeight - this.element.nativeElement.clientHeight;
    }

    ngOnChanges(changes: SimpleChanges) {
        this.previousStart = undefined;
        this.previousEnd = undefined;
        const items = (changes as any).items || {};
        if (
            ((changes as any).items !== undefined && items.previousValue === undefined) ||
            (!!items.previousValue && items.previousValue.length === 0)
        ) {
            this.startupLoop = true;
        }
        this.refresh();
    }

    ngOnDestroy() {
        // Check that listener has been attached properly:
        // It may be undefined in some cases, e.g. if an exception is thrown, the component is
        // not initialized properly but destroy may be called anyways (e.g. in testing).
        if (this.onScrollListener !== undefined) {
            // this removes the listener
            this.onScrollListener();
        }
        this.onDestroy$.emit();
    }

    refresh() {
        return new Promise(resolve =>
            requestAnimationFrame(() => {
                this.calculateItems();
                resolve();
            }),
        );
    }

    scrollInto(item: any) {
        const index: number = (this.items || []).indexOf(item);
        if (index < 0 || index >= (this.items || []).length) return;

        const d = this.calculateDimensions();
        this.element.nativeElement.scrollTop = index * d.childHeight;
        this.refresh();
    }

    private calculateDimensions() {
        const el = this.element.nativeElement;
        const content = this.contentElementRef.nativeElement;

        const items = this.items || [];
        const itemCount = items.length;
        const viewWidth = el.clientWidth - this.scrollbarWidth;
        const viewHeight = el.clientHeight - this.scrollbarHeight;

        let contentDimensions;
        if (this.childWidth == undefined || this.childHeight == undefined) {
            contentDimensions = content.children[0]
                ? content.children[0].getBoundingClientRect()
                : {
                      width: viewWidth,
                      height: viewHeight,
                  };
        }
        const childWidth = this.childWidth || contentDimensions.width;
        const childHeight = this.childHeight || contentDimensions.height;

        return {
            itemCount: itemCount,
            viewWidth: viewWidth,
            viewHeight: viewHeight,
            childWidth: childWidth,
            childHeight: childHeight,
            itemsPerCol: Math.max(1, Math.floor(viewHeight / childHeight)),
        };
    }

    private calculateItems() {
        const el = this.element.nativeElement;

        const d = this.calculateDimensions();
        const items = this.items || [];
        this.scrollHeight = d.childHeight * d.itemCount;
        if (this.element.nativeElement.scrollTop > this.scrollHeight) {
            this.element.nativeElement.scrollTop = this.scrollHeight;
        }

        if (this.scrollHeight < d.viewHeight) {
            this.element.nativeElement.scrollTop = 0;
        }
        const scrollTop = Math.max(0, el.scrollTop);
        const indexByScrollTop = (scrollTop / this.scrollHeight) * d.itemCount;
        let end = Math.min(d.itemCount, Math.ceil(indexByScrollTop) + d.itemsPerCol + 1);

        let start = Math.min(Math.max(0, end - d.itemsPerCol), Math.floor(indexByScrollTop));

        start = !isNaN(start) ? start : -1;
        end = !isNaN(end) ? end : -1;
        start = Math.max(start - 5, 0);
        end = Math.min(end + 5, items.length);
        this.topPadding = d.childHeight * Math.ceil(start);

        if (start !== this.previousStart || end !== this.previousEnd) {
            // update the scroll list
            this.update.emit(items.slice(start, end));

            // emit 'start' event
            if (start !== this.previousStart && this.startupLoop === false) {
                this.start.emit({ start, end });
            }

            // emit 'end' event
            if (end !== this.previousEnd && this.startupLoop === false) {
                this.end.emit({ start, end });
            }

            this.previousStart = start;
            this.previousEnd = end;

            if (this.startupLoop === true) {
                this.refresh();
            } else {
                this.change.emit({ start, end });
            }
        } else if (this.startupLoop === true) {
            this.startupLoop = false;
            this.refresh();
        }
    }
}

import { Input, Output, Renderer, Component, OnDestroy, OnChanges, ViewChild, ElementRef, EventEmitter, SimpleChanges } from '@angular/core';

export interface IndexUpdateEvent {
    start?: number;
    end?: number;
}

// copied from https://github.com/rintoj/angular2-virtual-scroll

@Component({
    selector: 'pef-virtual-scroll',
    template: `
        <div class="total-padding" [style.height]="scrollHeight + 'px'"></div>
        <div class="scrollable-content" #content [style.transform]="'translateY(' + topPadding + 'px)'">
            <ng-content></ng-content>
        </div>
    `,
    styles: [`
        :host {
            overflow: hidden;
            overflow-y: auto;
            position: relative;
        }
        .scrollable-content {
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            position: absolute;
        }
        .total-padding {
            width: 1px;
            opacity: 0;
        }
    `]
})
export class PefVirtualScrollComponent implements OnDestroy, OnChanges {

    @Input()
    items: any[] = [];

    @Input()
    scrollbarWidth: number = 10;

    @Input()
    scrollbarHeight: number = 0;

    @Input()
    childWidth: number;

    @Input()
    childHeight: number;


    @Output()
    update: EventEmitter<any[]> = new EventEmitter<any[]>();

    @Output()
    indexUpdate: EventEmitter<IndexUpdateEvent> = new EventEmitter<IndexUpdateEvent>();

    @ViewChild('content', { read: ElementRef })
    public contentElementRef: ElementRef;

    private onScrollListener: Function;
    public topPadding: number;
    public scrollHeight: number;
    private previousStart: number;
    private previousEnd: number;
    private startupLoop: boolean = true;

    constructor(private element: ElementRef, private renderer: Renderer) {
        this.onScrollListener = this.renderer.listen(this.element.nativeElement, 'scroll', this.refresh.bind(this));
    }

    ngOnChanges(changes: SimpleChanges) {
        this.previousStart = undefined;
        this.previousEnd = undefined;
        this.refresh();
    }

    ngOnDestroy() {
        this.onScrollListener();
    }

    refresh() {
        requestAnimationFrame(this.calculateItems.bind(this));
    }

    scrollInto(item: any) {
        let index: number = (this.items || []).indexOf(item);
        if (index < 0 || index >= (this.items || []).length) return;
        let el = this.element.nativeElement;
        let content = this.contentElementRef.nativeElement;
        let viewWidth = el.clientWidth;
        let viewHeight = el.clientHeight;
        let contentDimensions = content.children[0] ? content.children[0].getBoundingClientRect() : {
            width: viewWidth,
            height: viewHeight
        };
        let childWidth = contentDimensions.width;
        let childHeight = contentDimensions.height;
        let itemsPerRow = Math.max(1, Math.floor(viewWidth / childWidth));
        let itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));

        el.scrollTop = Math.floor(index / itemsPerRow) * childHeight - Math.max(0, (itemsPerCol - 1)) * childHeight;
        this.refresh();
    }

    private calculateItems() {
        let el = this.element.nativeElement;
        let content = this.contentElementRef.nativeElement;
        let scrollTop = el.scrollTop;

        let items = this.items || [];
        let itemCount = items.length;
        let viewWidth = el.clientWidth - this.scrollbarWidth;
        let viewHeight = el.clientHeight - this.scrollbarHeight;

        let contentDimensions;
        if (this.childWidth === undefined || this.childHeight === undefined) {
            contentDimensions = content.children[0] ? content.children[0].getBoundingClientRect() : {
                width: viewWidth,
                height: viewHeight
            };
        }
        let childWidth = this.childWidth || contentDimensions.width;
        let childHeight = this.childHeight || contentDimensions.height;

        let itemsPerRow = Math.max(1, Math.floor(viewWidth / childWidth));
        let itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));
        this.scrollHeight = childHeight * itemCount / itemsPerRow;

        let start = Math.floor(scrollTop / this.scrollHeight * itemCount / itemsPerRow) * itemsPerRow;
        let end = Math.min(itemCount, Math.ceil(scrollTop / this.scrollHeight * itemCount / itemsPerRow) * itemsPerRow + itemsPerRow * (itemsPerCol + 1));

        let diff = end - start;
        start = Math.max(0, start - diff);
        end = Math.min(items.length, end + diff);

        this.topPadding = childHeight * Math.ceil(start / itemsPerRow);
        if (start !== this.previousStart || end !== this.previousEnd) {
            this.update.emit(items.slice(start, end));
            this.indexUpdate.emit({
                start: start,
                end: end
            });
            this.previousStart = start;
            this.previousEnd = end;
            if (this.startupLoop === true) {
                this.refresh();
            }
        } else {
            this.startupLoop = false;
        }
    }
}

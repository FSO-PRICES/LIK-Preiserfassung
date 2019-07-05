import { Directive, ElementRef, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { WINDOW } from 'ngx-window-token';
import { interval, of as observableOf } from 'rxjs';
import { flatMap, retry, take } from 'rxjs/operators';

@Directive({
    selector: '[pef-detect-ion-list-item-height]',
})
export class PefDetectIonListItemHeightDirective implements OnInit {
    @Output('pef-detect-ion-list-item-height') ionItemHeight = new EventEmitter<number>();

    constructor(private elementRef: ElementRef, @Inject(WINDOW) private wndw: Window) {}

    ngOnInit() {
        interval(500)
            .pipe(
                flatMap(() => observableOf(this.getIonItemElement())),
                retry(),
                take(1),
            )
            .subscribe(ionItem => {
                this.ionItemHeight.emit(this.getIonItemHeight(ionItem));
            });
    }

    getIonItemElement() {
        const ionItem = this.elementRef.nativeElement.getElementsByTagName('ion-item')[0] as HTMLElement;
        if (!ionItem) {
            throw new Error('No Item found');
        }
        return ionItem;
    }

    getIonItemHeight(ionItem: HTMLElement) {
        return (
            Math.round(parseFloat(this.wndw.getComputedStyle(ionItem).marginTop)) +
            Math.round(parseFloat(this.wndw.getComputedStyle(ionItem).marginBottom)) +
            Math.round(ionItem.getBoundingClientRect().height)
        );
    }
}

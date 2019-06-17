import { Directive, ElementRef, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { interval, of as observableOf } from 'rxjs';
import { flatMap, retry, take } from 'rxjs/operators';

@Directive({
    selector: '[pef-detect-ion-list-item-height]',
})
export class PefDetectIonListItemHeightDirective implements OnInit {
    @Output('pef-detect-ion-list-item-height') ionItemHeight = new EventEmitter<number>();

    constructor(private elementRef: ElementRef, @Inject('windowObject') private window: any) {}

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
            Math.round(parseFloat(this.window.getComputedStyle(ionItem).marginTop)) +
            Math.round(parseFloat(this.window.getComputedStyle(ionItem).marginBottom)) +
            Math.round(ionItem.getBoundingClientRect().height)
        );
    }
}

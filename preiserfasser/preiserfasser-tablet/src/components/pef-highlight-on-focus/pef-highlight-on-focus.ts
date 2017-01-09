import { Directive, ElementRef, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

@Directive({
    selector: '[pef-highlight-on-focus]'
})
export class PefHighlightOnFocus implements OnDestroy {
    private subscription: Subscription;

    constructor(private elementRef: ElementRef) {}

    ngOnInit() {
        const inputElement = this.elementRef.nativeElement.getElementsByTagName('input')[0] as HTMLInputElement;
        if (!inputElement) return;
        this.subscription = Observable.fromEvent(inputElement, 'focus')
            .subscribe(() => inputElement.select());
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

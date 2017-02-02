import { Directive, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

@Directive({
    selector: '[pef-highlight-on-focus]'
})
export class PefHighlightOnFocus {
    constructor(private elementRef: ElementRef) {}

    @HostListener('focus')
    onFocus() {
        const inputElement = this.elementRef.nativeElement.getElementsByTagName('input')[0] as HTMLInputElement;
        if (!inputElement) return;
        inputElement.select();
    }
}

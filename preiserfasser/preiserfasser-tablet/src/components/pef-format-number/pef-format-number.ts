import { Directive, Input, ElementRef, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import * as format from 'format-number';
import { isString, isObject } from 'lodash';

@Directive({
    selector: '[pef-format-number]'
})
export class PefFormatNumber implements OnDestroy {
    @Input('pef-format-number') formatOptions: string | Object;

    private subscription: Subscription;

    constructor(private elementRef: ElementRef) {}

    ngOnInit() {
        const inputElement = this.elementRef.nativeElement.getElementsByTagName('input')[0];
        if (!inputElement) return;
        this.subscription = Observable.fromEvent(inputElement, 'blur')
            .subscribe(() => inputElement.value = format(this._formatOptions)(inputElement.valueAsNumber));
    }

    get _formatOptions(): Object {
        if (isString(this.formatOptions)) return JSON.parse(this.formatOptions);
        if (isObject(this.formatOptions)) return this.formatOptions;
        return undefined;
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

import { Directive, OnChanges, AfterViewInit, ElementRef, Input, SimpleChange } from '@angular/core';
import * as Ps from 'perfect-scrollbar';
import { ReactiveComponent } from '../../common/ReactiveComponent';

@Directive({
    selector: '[pef-perfect-scrollbar]',
})
export class PefPerfectScrollbar extends ReactiveComponent implements OnChanges, AfterViewInit {
    @Input() enabled: boolean;

    constructor(private elementRef: ElementRef) {
        super();
    }

    ngAfterViewInit() {
        this.observePropertyCurrentValue<boolean>('enabled')
            .filter(x => x)
            .subscribe(x => Ps.initialize(this.elementRef.nativeElement));
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}

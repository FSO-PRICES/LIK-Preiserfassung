import { Directive, OnChanges, AfterViewInit, ElementRef, Input, SimpleChange, NgZone } from '@angular/core';
import * as Ps from 'perfect-scrollbar';
import { ReactiveComponent } from '../../common/ReactiveComponent';

@Directive({
    selector: '[pef-perfect-scrollbar]',
})
export class PefPerfectScrollbar extends ReactiveComponent implements OnChanges, AfterViewInit {
    @Input() enabled: boolean;

    private container: any;

    constructor(elementRef: ElementRef, private ngZone: NgZone) {
        super();

        this.container = elementRef.nativeElement;
    }

    ngAfterViewInit() {
        this.observePropertyCurrentValue<boolean>('enabled')
            .filter(x => x)
            .subscribe(() => {
                this.ngZone.runOutsideAngular(() => {
                    Ps.initialize(this.container);
                    setTimeout(() => {
                        this.container.scrollTop = 0;
                        Ps.update(this.container);
                    }, 1000);
                });
             });
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}

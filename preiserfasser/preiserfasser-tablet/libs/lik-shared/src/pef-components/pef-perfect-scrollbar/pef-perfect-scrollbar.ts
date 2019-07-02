import { AfterViewInit, Directive, ElementRef, Input, NgZone, OnChanges, SimpleChange } from '@angular/core';
import * as Ps from 'perfect-scrollbar';
import { filter } from 'rxjs/operators';

import { ReactiveComponent } from '../../common/ReactiveComponent';

@Directive({
    selector: '[pef-perfect-scrollbar]',
})
export class PefPerfectScrollbarDirective extends ReactiveComponent implements OnChanges, AfterViewInit {
    @Input() enabled: boolean;
    @Input() scrollToTop: {};

    private container: any;

    constructor(elementRef: ElementRef, private ngZone: NgZone) {
        super();

        this.container = elementRef.nativeElement;
    }

    ngAfterViewInit() {
        this.observePropertyCurrentValue<boolean>('enabled')
            .pipe(filter(x => x))
            .subscribe(() => {
                this.ngZone.runOutsideAngular(() => {
                    Ps.initialize(this.container);
                    setTimeout(() => {
                        this.container.scrollTop = 0;
                        Ps.update(this.container);
                    }, 1000);
                });
            });

        this.observePropertyCurrentValue<{}>('scrollToTop').subscribe(() => {
            this.ngZone.runOutsideAngular(() => {
                setTimeout(() => {
                    this.container.scrollTop = 0;
                    Ps.update(this.container);
                }, 100);
            });
        });
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}

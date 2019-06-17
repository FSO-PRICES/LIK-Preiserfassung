import {
    AfterViewInit,
    Directive,
    ElementRef,
    EventEmitter,
    Input,
    NgZone,
    OnChanges,
    SimpleChange,
} from '@angular/core';
import * as Ps from 'perfect-scrollbar';
import { combineLatest, filter, map } from 'rxjs/operators';
import { ReactiveComponent } from '../../common/ReactiveComponent';

@Directive({
    selector: '[pef-perfect-virtualscroll-scrollbar]',
})
export class PefPerfectVirtualscrollScrollbarDirective extends ReactiveComponent implements OnChanges, AfterViewInit {
    @Input() enabled: boolean;

    private ngAfterViewInit$ = new EventEmitter();

    constructor(elementRef: ElementRef, ngZone: NgZone) {
        super();

        const enabled$ = this.observePropertyCurrentValue<boolean>('enabled');
        this.ngAfterViewInit$
            .pipe(
                combineLatest(enabled$, (_, enabled) => enabled),
                filter(enabled => enabled),
                map(() => elementRef.nativeElement.getElementsByClassName('scroll-content')[0] as HTMLInputElement),
                filter(scrollContent => !!scrollContent),
            )
            .subscribe(scrollContent => {
                ngZone.runOutsideAngular(() => {
                    Ps.initialize(scrollContent);
                    setTimeout(() => {
                        scrollContent.scrollTop = 0;
                        Ps.update(scrollContent);
                    }, 1000);
                });
            });
    }

    ngAfterViewInit() {
        this.ngAfterViewInit$.emit();
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}

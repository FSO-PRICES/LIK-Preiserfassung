import { Component, EventEmitter, Input, Output, SimpleChange, OnChanges, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as elementResizeDetectorMaker from 'element-resize-detector';
import { ReactiveComponent } from '../../../../../common/ReactiveComponent';

// TODO: delete;
const erdUltraFast = elementResizeDetectorMaker({
    strategy: "scroll"
});

import * as P from '../../../../../common-models';

@Component({
    selector: 'product-detail-preismeldung',
    templateUrl: 'product-detail-preismeldung.html'
})
export class ProductDetailPreismeldungComponent extends ReactiveComponent implements OnChanges {
    @Input() product: P.Product;

    private elementToFocus = new EventEmitter<any>()

    public product$: Observable<P.Product>;
    private focusedElement = null;

    constructor(formBuilder: FormBuilder, private elementRef: ElementRef) {
        super();

        this.product$ = this.observePropertyCurrentValue<P.Product>('product');

        // this.elementToFocus
        //     .switchMap(e => Observable.interval(50).take(40).flatMap(() => {
        //         return Observable.create(o => {
        //             e.target.scrollIntoView();
        //         })
        //     }))
        //     .subscribe();

        // const ionScroll$ = this.product$
        //     .delay(0)
        //     .filter(x => !!x)
        //     .map(() => this.elementRef.nativeElement.getElementsByTagName('ion-scroll').item(0))
        //     .filter(x => !!x)
        //     .do(x => console.log('bbbb'))

        // ionScroll$
        //     .do(() => console.log('blka'))
        //     .flatMap(x => createScrollEvent(x))
        //     .debounceTime(100)
        //     .flatMap(x => Observable.interval(100).take(20).flatMap(() => {
        //         return Observable.create(o => {
        //             console.log('foobar', x.offsetHeight)
        //             if (!!this.focusedElement) {
        //                 this.focusedElement.scrollIntoView();
        //             }
        //         })
        //     }))
        //     .subscribe();
    }

    ngOnInit() {
        console.log('onInit', this.elementRef.nativeElement.getElementsByTagName('ion-scroll'));
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    testFocus(e) {
        // console.log('testFocus', e);
        // this.focusedElement = e.target;
        this.elementToFocus.next(e)
        // e.target.scrollIntoView();
    }

    scrollResize(e) {
        console.log('scrollResize', e);
    }
}

// function createKeyboardShowObservable() {
// Observable.fromEvent(h => window.addEventListener('', h), h => window.removeEventListener('', h))
// Observable.fromEvent(window, 'native.keyboardshow')
// }

function createScrollEvent(element: any): Observable<any> {
    return Observable.create(o => {
        const listener = e => o.next(e);
        erdUltraFast.listenTo(element, listener);
        return () => {
            if (element) erdUltraFast.removeListener(element, listener);
        }
    });
}

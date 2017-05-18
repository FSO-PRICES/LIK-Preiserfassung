import { Component, Input, Inject, AfterViewInit, SimpleChange, ElementRef } from '@angular/core';
import { Store } from "@ngrx/store";

import { ReactiveComponent } from 'lik-shared';

import * as fromRoot from '../../reducers';

@Component({
    selector: 'pms-print2',
    templateUrl: 'pms-print2.html'
})
export class PmsPrintComponent extends ReactiveComponent implements AfterViewInit {
    @Input() pmsNummer: string;

    public preismeldungen$ = this.store.select(fromRoot.getPreismeldungen)
        .publishReplay(1).refCount();

    constructor(
        @Inject('windowObject') window: Window,
        elementRef: ElementRef,
        private store: Store<fromRoot.AppState>,
    ) {
        super();

        this.observePropertyCurrentValue<string>('pmsNummer')
            .do(x => console.log('pmsNummer is', x))
            .filter(pmsNummer => !!pmsNummer)
            .subscribe(payload => this.store.dispatch({ type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload }));

        this.preismeldungen$
            .filter(x => !!x && x.length > 0)
            .do(x => console.log(x.map(y => y.pmId)))
            .subscribe(() => setTimeout(() => {
                const table = elementRef.nativeElement.getElementsByTagName('table')[0] as HTMLElement;
                const html = window.document.getElementsByTagName('html')[0] as HTMLElement;
                html.style.height = `${table.getBoundingClientRect().height}px`;
                const body = window.document.getElementsByTagName('body')[0] as HTMLElement;
                body.style.position = 'static';
                const ionApp = window.document.getElementsByTagName('ion-app')[0] as HTMLElement;
                ionApp.style.position = 'static';
                window.print();
            }));

            // this.ionViewDidLoad$
            //     .withLatestFrom(isCurrentNotANewPreismeldung$)
            //     .subscribe(() => this.store.dispatch({ type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload: this.navParams.get('pmsNummer') }))
    }

    ngAfterViewInit() {
        // setTimeout(() => this.window.print(), 1000);
        // this.store.dispatch({ type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload: this.pmsNummer });
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}

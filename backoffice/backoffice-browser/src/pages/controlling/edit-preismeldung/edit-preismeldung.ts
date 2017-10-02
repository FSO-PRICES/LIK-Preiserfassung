import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange } from '@angular/core';
import { Observable } from 'rxjs';

import { ReactiveComponent } from 'lik-shared';
import * as P from '../../../common-models';

@Component({
    selector: 'edit-preismeldung',
    templateUrl: 'edit-preismeldung.html'
})
export class EditPreismeldungComponent extends ReactiveComponent implements OnChanges {
    @Input() currentPreismeldung: P.CurrentPreismeldungBag;
    @Input() warenkorb: P.fromWarenkorb.WarenkorbInfo[];
    @Output('updatePreismeldungPreis') updatePreismeldungPreis$ = new EventEmitter<P.PreismeldungPricePayload>();
    @Output('updatePreismeldungMessages') updatePreismeldungMessages$ = new EventEmitter<P.PreismeldungMessagesPayload>();
    @Output('updatePreismeldungAttributes') updatePreismeldungAttributes$ = new EventEmitter<string[]>();
    @Output('savePreismeldungMessages') savePreismeldungMessages$: Observable<{}>;
    @Output('savePreismeldungAttributes') savePreismeldungAttributes$: Observable<{}>;
    @Output('closeClicked') closeClicked$: Observable<{}>;
    @Output('savePreismeldungPrice') savePreismeldungPrice$ = new EventEmitter<P.SavePreismeldungPriceSaveAction>();

    public selectTab$ = new EventEmitter<string>();
    public currentPreismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>('currentPreismeldung');
    public warenkorb$ = this.observePropertyCurrentValue<P.fromWarenkorb.WarenkorbInfo[]>('warenkorb');
    public toolbarButtonClicked$ = new EventEmitter<string>();
    public selectedTab$: Observable<string>;
    public _closeClicked$ = new EventEmitter();

    public duplicatePreismeldung$ = new EventEmitter();
    public requestSelectNextPreismeldung$ = new EventEmitter();
    public requestThrowChanges$ = new EventEmitter();

    constructor() {
        super();

        this.selectedTab$ = this.selectTab$
            .merge(this.savePreismeldungPrice$.filter(x => x.type === 'NO_SAVE_NAVIGATE' || x.type === 'SAVE_AND_NAVIGATE_TAB').map((x: P.SavePreismeldungPriceSaveActionNoSaveNavigate | P.SavePreismeldungPriceSaveActionSaveNavigateTab) => x.tabName))
            .startWith('PREISMELDUNG')
            .publishReplay(1).refCount();

        const tabPair$ = this.selectedTab$
            .scan((agg, v) => ({ from: agg.to, to: v }), { from: null, to: null })
            .publishReplay(1).refCount();

        const createTabLeaveObservable = (tabName: string) =>
            tabPair$
                .filter(x => x.from === tabName)
                .merge(this._closeClicked$.withLatestFrom(tabPair$, (_, tabPair) => tabPair).filter(x => x.to === tabName));

        this.savePreismeldungMessages$ = createTabLeaveObservable('MESSAGES')
            .withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung)
            .filter(currentPreismeldung => !!currentPreismeldung && !currentPreismeldung.isNew && currentPreismeldung.isMessagesModified);

        this.savePreismeldungAttributes$ = createTabLeaveObservable('PRODUCT_ATTRIBUTES')
            .withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung)
            .filter(currentPreismeldung => !currentPreismeldung.isNew && currentPreismeldung.isAttributesModified)

        this.closeClicked$ = this._closeClicked$.delay(500);
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

}

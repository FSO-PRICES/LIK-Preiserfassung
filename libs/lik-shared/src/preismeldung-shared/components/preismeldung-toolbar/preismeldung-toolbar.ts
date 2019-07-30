import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChange,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
    combineLatest,
    map,
    merge,
    publishReplay,
    refCount,
    startWith,
    takeUntil,
    withLatestFrom,
} from 'rxjs/operators';

import { ReactiveComponent } from '../../../common/ReactiveComponent';

import * as P from '../../models';

@Component({
    selector: 'preismeldung-toolbar',
    styleUrls: ['./preismeldung-toolbar.scss'],
    templateUrl: 'preismeldung-toolbar.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungToolbarComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preismeldung: P.CurrentPreismeldungViewBag;
    @Input() selectedTab: string;
    @Input() isAdminApp: boolean;
    @Input() isNotSave: boolean;
    @Input() disableQuickEqual: boolean;
    @Output('selectTab') selectTab$ = new EventEmitter<string>();
    @Output('buttonClicked') buttonClicked$: Observable<string>;
    otherButtonClicked$ = new EventEmitter<string>();
    saveButtonClicked$ = new EventEmitter();

    private onDestroy$ = new Subject();

    public preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungViewBag>('preismeldung');
    public isNotSave$ = this.observePropertyCurrentValue<boolean>('isNotSave').pipe(
        publishReplay(1),
        refCount(),
    );
    public selectedTab$ = this.observePropertyCurrentValue<string>('selectedTab').pipe(
        publishReplay(1),
        refCount(),
    );
    public isAdminApp$ = this.observePropertyCurrentValue<boolean>('isAdminApp').pipe(
        publishReplay(1),
        refCount(),
    );
    public disableQuickEqual$ = this.observePropertyCurrentValue<boolean>('disableQuickEqual').pipe(
        startWith(false),
        publishReplay(1),
        refCount(),
    );
    public hasAttributes$: Observable<boolean>;
    public requestPreismeldungQuickEqualDisabled$: Observable<boolean>;

    constructor() {
        super();

        this.selectedTab$.pipe(takeUntil(this.onDestroy$)).subscribe();

        this.hasAttributes$ = this.preismeldung$.pipe(
            map(p => !!p && !!p.warenkorbPosition.productMerkmale && !!p.warenkorbPosition.productMerkmale.length),
        );

        this.requestPreismeldungQuickEqualDisabled$ = this.preismeldung$.pipe(
            map(x => !!x && [2, 3, 7].some(y => y === x.preismeldung.bearbeitungscode)),
            combineLatest(this.disableQuickEqual$, (disabledByPm, disabledByInput) => disabledByInput || disabledByPm),
            startWith(false),
        );

        this.buttonClicked$ = this.otherButtonClicked$.pipe(
            merge(
                this.saveButtonClicked$.pipe(
                    withLatestFrom(this.isNotSave$, (_, isNotSave) =>
                        isNotSave ? 'REQUEST_SELECT_NEXT_PREISMELDUNG' : 'PREISMELDUNG_SAVE',
                    ),
                ),
            ),
        );
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.onDestroy$.next();
    }
}

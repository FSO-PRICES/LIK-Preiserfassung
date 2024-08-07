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
import { Observable, Subject, combineLatest, merge } from 'rxjs';
import { delay, map, shareReplay, startWith, takeUntil, withLatestFrom } from 'rxjs/operators';

import { ReactiveComponent } from '../../../common/ReactiveComponent';
import * as P from '../../models';

@Component({
    selector: 'preismeldung-toolbar',
    styleUrls: ['./preismeldung-toolbar.scss'],
    templateUrl: 'preismeldung-toolbar.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungToolbarComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input({ required: true }) preismeldung!: P.CurrentPreismeldungViewBag;
    @Input({ required: true }) selectedTab!: string;
    @Input({ required: true }) isAdminApp!: boolean;
    @Input({ required: true }) isSaveDisabled!: boolean;
    @Input({ required: true }) disableQuickEqual!: boolean;
    @Input({ required: true }) isDesktop!: boolean;
    @Output('selectTab') selectTab$ = new EventEmitter<string>();
    @Output('buttonClicked') buttonClicked$: Observable<string>;
    homeButtonClicked$ = new EventEmitter();
    quickEqualButtonClicked$ = new EventEmitter();
    selectNextPreismeldungButtonClicked$ = new EventEmitter();
    saveButtonClicked$ = new EventEmitter();

    public disableSaveButton$ = new Observable<boolean>();
    public disableSelectNextPreismeldungButton$ = new Observable<boolean>();

    private onDestroy$ = new Subject<void>();

    public preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungViewBag>('preismeldung');
    public isSaveDisabled$ = this.observePropertyCurrentValue<boolean>('isSaveDisabled').pipe(
        shareReplay({ bufferSize: 1, refCount: true }),
    );
    public selectedTab$ = this.observePropertyCurrentValue<string>('selectedTab').pipe(
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    public disableQuickEqual$ = this.observePropertyCurrentValue<boolean>('disableQuickEqual').pipe(
        startWith(false),
        shareReplay({ bufferSize: 1, refCount: true }),
    );
    public hasAttributes$: Observable<boolean>;
    public requestPreismeldungQuickEqualDisabled$: Observable<boolean>;

    constructor() {
        super();

        this.selectedTab$.pipe(takeUntil(this.onDestroy$)).subscribe();

        this.hasAttributes$ = this.preismeldung$.pipe(
            map((p) => !!p && !!p.warenkorbPosition.productMerkmale && !!p.warenkorbPosition.productMerkmale.length),
        );

        this.requestPreismeldungQuickEqualDisabled$ = combineLatest([
            this.preismeldung$.pipe(
                map((x) => !!x && [2, 3, 7].some((y) => y === x.preismeldung.bearbeitungscode)),
                startWith(false),
            ),
            this.disableQuickEqual$,
        ]).pipe(map(([disabledByPm, disabledByInput]) => disabledByInput || disabledByPm));

        this.buttonClicked$ = merge(
            this.homeButtonClicked$.pipe(map(() => 'HOME')),
            this.quickEqualButtonClicked$.pipe(map(() => 'PREISMELDUNG_QUICK_EQUAL')),
            this.selectNextPreismeldungButtonClicked$.pipe(map(() => 'REQUEST_SELECT_NEXT_PREISMELDUNG')),
            this.saveButtonClicked$.pipe(map(() => 'PREISMELDUNG_SAVE')),
        );

        // Because on slow tablets it takes a while till save is available after quick equal we need to disable the button immediately and the wait for isSaveDisabled$ to return
        this.disableSaveButton$ = merge(
            this.saveButtonClicked$.pipe(map(() => true)),
            this.quickEqualButtonClicked$.pipe(
                withLatestFrom(this.isSaveDisabled$),
                map(([, isSaveDisabled]) => isSaveDisabled),
            ),
            this.isSaveDisabled$,
        ).pipe(startWith(true));

        this.disableSelectNextPreismeldungButton$ = merge(
            this.saveButtonClicked$.pipe(map(() => true)),
            this.quickEqualButtonClicked$.pipe(map(() => true)),
            this.quickEqualButtonClicked$.pipe(
                delay(200), // If a PM already has a quick equal, isSaveDisabled does not emit so we need to acivate the button after a short delay
                map(() => false),
            ),
            this.isSaveDisabled$.pipe(map((isSaveDisabled) => !isSaveDisabled)),
        ).pipe(startWith(true));
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.onDestroy$.next();
    }
}

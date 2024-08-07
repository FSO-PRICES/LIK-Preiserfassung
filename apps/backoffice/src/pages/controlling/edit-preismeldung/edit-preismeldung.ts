import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChange,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Observable, combineLatest, defer, merge } from 'rxjs';
import { delay, filter, map, shareReplay, startWith, switchMap, take, withLatestFrom } from 'rxjs/operators';

import { DialogSaveCancelEditComponent, PefDialogService, ReactiveComponent } from '@lik-shared';

import * as P from '../../../common-models';

@UntilDestroy()
@Component({
    selector: 'edit-preismeldung',
    templateUrl: 'edit-preismeldung.html',
    styleUrls: ['edit-preismeldung.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditPreismeldungComponent extends ReactiveComponent implements OnChanges {
    @Input() currentPreismeldung: P.CurrentPreismeldungBag;
    @Input() warenkorb: P.fromWarenkorb.WarenkorbInfo[];
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Input() preiserheber: P.Models.Erheber;
    @Input() preismeldungenStatus: { [pmId: string]: P.Models.PreismeldungStatus };
    @Input() hasWritePermission: boolean;
    @Output('updatePreismeldungPreis') updatePreismeldungPreis$ = new EventEmitter<P.PreismeldungPricePayload>();
    @Output('updatePreismeldungMessages')
    updatePreismeldungMessages$ = new EventEmitter<P.PreismeldungMessagesPayload>();
    @Output('updatePreismeldungAttributes') updatePreismeldungAttributes$ = new EventEmitter<string[]>();
    @Output('savePreismeldungMessages') _savePreismeldungMessages$: Observable<{}>;
    @Output('savePreismeldungAttributes') _savePreismeldungAttributes$: Observable<{}>;
    @Output('closeClicked') closeClicked$: Observable<{}>;
    @Output('savePreismeldungPrice') _savePreismeldungPrice$: Observable<P.SavePreismeldungPriceSaveAction>;
    @Output('kommentarClearClicked') kommentarClearClicked$ = new EventEmitter<{}>();
    @Output('resetPreismeldung') resetPreismeldung$ = new EventEmitter();
    @Output('setPreismeldungStatus')
    setPreismeldungStatus$ = new EventEmitter<{ pmId: string; status: P.Models.PreismeldungStatus }>();

    public selectTab$ = new EventEmitter<string>();
    public currentPreismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>('currentPreismeldung');
    public warenkorb$ = this.observePropertyCurrentValue<P.fromWarenkorb.WarenkorbInfo[]>('warenkorb');
    public hasWritePermission$ = this.observePropertyCurrentValue<boolean>('hasWritePermission').pipe(
        shareReplay({ bufferSize: 1, refCount: true }),
    );
    public toolbarButtonClicked$ = new EventEmitter<string>();
    public requestPreismeldungQuickEqual$: Observable<{}>;
    public selectedTab$: Observable<string>;
    public _closeClicked$ = new EventEmitter();
    public disableQuickEqual$ = new EventEmitter<boolean>();
    public quickEqualDisabled$: Observable<boolean>;

    public duplicatePreismeldung$ = new EventEmitter();
    public requestSelectNextPreismeldung$ = new EventEmitter();
    public requestThrowChanges$ = new EventEmitter();
    public savePreismeldungPrice$ = new EventEmitter<P.SavePreismeldungPriceSaveAction>();
    public savePreismeldungMessages$ = new EventEmitter();
    public savePreismeldungAttributes$ = new EventEmitter();

    public currentPreismeldungHasStatus$: Observable<boolean>;

    constructor(pefDialogService: PefDialogService) {
        super();

        const cancelEditDialog$ = defer(() =>
            pefDialogService.displayDialog(DialogSaveCancelEditComponent, { disableClose: true }),
        );

        this.currentPreismeldungHasStatus$ = this.currentPreismeldung$.pipe(
            filter((x) => !!x.preismeldung),
            // withLatestFrom(this.preismeldungenStatus$),
            map((pm) => {
                return (
                    Boolean(this.preismeldungenStatus[pm.preismeldung._id]) ||
                    this.preismeldungenStatus[pm.preismeldung._id] === 0
                );
            }),
        );

        // Wrapped the disable event emitter into a delay 0 observable due to ExpressionChangedAfterItHasBeenCheckedError error
        this.quickEqualDisabled$ = combineLatest([
            this.disableQuickEqual$.asObservable().pipe(delay(0)),
            this.hasWritePermission$,
        ]).pipe(map(([disableQuickEqual, hasWritePermission]) => disableQuickEqual || !hasWritePermission));

        const cancelEditResponse$ = this._closeClicked$.pipe(
            withLatestFrom(this.currentPreismeldung$),
            filter(([, currentPreismeldung]) => !!currentPreismeldung),
            map(([, x]) => ({
                ...x,
                source: x.isModified
                    ? 'isCurrentModified'
                    : x.isMessagesModified
                    ? 'isMessagesModified'
                    : x.isAttributesModified
                    ? 'isAttributesModified'
                    : null,
            })),
            filter((x) => !!x.source),
            switchMap((x) => cancelEditDialog$.pipe(map((y) => ({ dialogCode: y, source: x.source })))),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        const selectTabBasedOnCancelEditDialogResponse$ = cancelEditResponse$.pipe(
            filter((x) => x.dialogCode === 'KEEP_WORKING'),
            map((x) => {
                switch (x.source) {
                    case 'isCurrentModified':
                        return 'PREISMELDUNG';
                    case 'isMessagesModified':
                        return 'MESSAGES';
                    case 'isAttributesModified':
                        return 'PRODUCT_ATTRIBUTES';
                    default:
                        return null;
                }
            }),
            filter((x) => !!x),
        );

        this._savePreismeldungPrice$ = merge(
            this.savePreismeldungPrice$,
            cancelEditResponse$.pipe(
                filter((x) => x.source === 'isCurrentModified' && x.dialogCode === 'SAVE'),
                map(() => ({ type: 'JUST_SAVE', saveWithData: [] } as P.SavePreismeldungPriceSaveActionSave)),
            ),
        );

        this._savePreismeldungMessages$ = merge(
            this.savePreismeldungMessages$,
            cancelEditResponse$.pipe(
                filter((x) => x.source === 'isMessagesModified' && x.dialogCode === 'SAVE'),
                map(() => ({})),
            ),
        );

        this._savePreismeldungAttributes$ = merge(
            this.savePreismeldungAttributes$,
            cancelEditResponse$.pipe(
                filter((x) => x.source === 'isAttributesModified' && x.dialogCode === 'SAVE'),
                map(() => ({})),
            ),
        );

        this.selectedTab$ = merge(
            this.selectTab$,
            selectTabBasedOnCancelEditDialogResponse$,
            this.savePreismeldungPrice$.pipe(
                filter((x) => x.type === 'NO_SAVE_NAVIGATE' || x.type === 'SAVE_AND_NAVIGATE_TAB'),
                map(
                    (
                        x:
                            | P.SavePreismeldungPriceSaveActionNoSaveNavigate
                            | P.SavePreismeldungPriceSaveActionSaveNavigateTab,
                    ) => x.tabName,
                ),
            ),
            this.resetPreismeldung$.pipe(
                withLatestFrom(this.currentPreismeldung$),
                filter(([, pm]) => !pm.refPreismeldung),
                map(() => 'PREISMELDUNG'),
            ),
        ).pipe(startWith('PREISMELDUNG'), shareReplay({ bufferSize: 1, refCount: true }));

        this.requestPreismeldungQuickEqual$ = this.toolbarButtonClicked$.pipe(
            filter((x) => x === 'PREISMELDUNG_QUICK_EQUAL'),
            map(() => new Date()),
        );

        this.closeClicked$ = merge(
            this._closeClicked$.pipe(
                withLatestFrom(this.currentPreismeldung$),
                filter(([, x]) => !!x && !x.isModified && !x.isMessagesModified && !x.isAttributesModified),
            ),
            cancelEditResponse$.pipe(
                filter((x) => x.dialogCode === 'SAVE'),
                switchMap(() =>
                    this.currentPreismeldung$.pipe(
                        filter((x) => !x.isModified),
                        take(1),
                    ),
                ),
                delay(0),
            ),
            cancelEditResponse$.pipe(filter((x) => x.dialogCode === 'THROW_CHANGES')),
        );
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}

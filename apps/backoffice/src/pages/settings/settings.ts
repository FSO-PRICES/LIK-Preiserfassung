import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import {
    distinctUntilChanged,
    distinctUntilKeyChanged,
    filter,
    map,
    mapTo,
    merge,
    publishReplay,
    refCount,
    withLatestFrom,
} from 'rxjs/operators';

import { PefDialogService } from '@lik-shared';

import { environment } from '../../environments/environment';
import * as fromRoot from '../../reducers';
import { CurrentSetting } from '../../reducers/setting';

@Component({
    templateUrl: 'settings.html',
    styleUrls: ['settings.scss'],
})
export class SettingsPage implements OnDestroy {
    public currentSettings$ = this.store.select(fromRoot.getCurrentSettings);

    public cancelClicked$ = new EventEmitter<Event>();
    public saveClicked$ = new EventEmitter<Event>();

    public showValidationHints$: Observable<boolean>;
    public settingsSaved$: Observable<CurrentSetting>;

    public form: FormGroup;
    private subscriptions: Subscription[] = [];
    private loader: Promise<HTMLIonLoadingElement>;

    public version = environment.version;

    constructor(
        formBuilder: FormBuilder,
        private store: Store<fromRoot.AppState>,
        private dialogService: PefDialogService,
    ) {
        this.form = formBuilder.group({
            _id: [null],
            serverConnection: formBuilder.group({
                url: [null, Validators.required],
            }),
            general: formBuilder.group({
                erhebungsorgannummer: null,
            }),
            transportRequestSettings: formBuilder.group({
                senderId: null,
                recipientId: null,
            }),
            export: formBuilder.group({
                targetPath: null,
            }),
        });

        const update$ = this.form.valueChanges.pipe(map(() => this.form.value));

        const distinctSetting$ = this.currentSettings$.pipe(
            filter(x => !!x),
            distinctUntilKeyChanged('isModified'),
            publishReplay(1),
            refCount(),
        );

        const canSave$ = this.saveClicked$.pipe(
            map(x => ({ isValid: this.form.valid })),
            publishReplay(1),
            refCount(),
        );

        const save$ = canSave$.pipe(
            filter(x => x.isValid),
            publishReplay(1),
            refCount(),
            withLatestFrom(this.saveClicked$),
        );

        this.showValidationHints$ = canSave$.pipe(
            distinctUntilChanged(),
            mapTo(true),
            merge(distinctSetting$.pipe(mapTo(false))),
        );

        this.settingsSaved$ = this.currentSettings$.pipe(
            filter(pe => pe != null && pe.isSaved),
            publishReplay(1),
            refCount(),
        );

        this.subscriptions = [
            this.cancelClicked$.subscribe(() => store.dispatch({ type: 'SETTING_LOAD' })),

            update$.subscribe(x => store.dispatch({ type: 'UPDATE_SETTING', payload: x })),

            save$.subscribe(() => {
                this.presentLoadingScreen();
                store.dispatch({ type: 'SAVE_SETTING' });
            }),

            this.settingsSaved$.subscribe(() => {
                store.dispatch({ type: 'CHECK_CONNECTIVITY_TO_DATABASE' });
            }),

            distinctSetting$.subscribe((settings: CurrentSetting) => {
                this.form.markAsUntouched();
                this.form.markAsPristine();
                this.form.patchValue(
                    {
                        _id: settings._id,
                        serverConnection: settings.serverConnection,
                        general: settings.general || {},
                        transportRequestSettings: settings.transportRequestSettings || {},
                        export: settings.export || {},
                    },
                    { emitEvent: false },
                );
            }),
        ];
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'SETTING_LOAD' });
    }

    public ionViewCanLeave(): Promise<boolean> {
        return this.currentSettings$.pipe(map(settings => !!settings && !settings.isDefault)).toPromise();
    }

    public ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    private presentLoadingScreen() {
        this.dialogService.displayLoading('Datensynchronisierung. Bitte warten...', {
            requestDismiss$: this.settingsSaved$,
        });
    }
}

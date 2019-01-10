import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Loading, LoadingController, IonicPage } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';

import * as fromRoot from '../../reducers';
import { CurrentSetting } from '../../reducers/setting';
import { environment } from '../../environments/environment';

@IonicPage({
    segment: 'settings',
})
@Component({
    templateUrl: 'settings.html',
})
export class SettingsPage implements OnDestroy {
    public currentSettings$ = this.store.select(fromRoot.getCurrentSettings);

    public cancelClicked$ = new EventEmitter<Event>();
    public saveClicked$ = new EventEmitter<Event>();
    public logoutClicked$ = new EventEmitter<Event>();

    public showValidationHints$: Observable<boolean>;

    public form: FormGroup;
    private subscriptions: Subscription[] = [];
    private loader: Loading;

    public version = environment.version;

    constructor(
        private store: Store<fromRoot.AppState>,
        private loadingCtrl: LoadingController,
        private formBuilder: FormBuilder
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

        const update$ = this.form.valueChanges.map(() => this.form.value);

        const distinctSetting$ = this.currentSettings$
            .filter(x => !!x)
            .distinctUntilKeyChanged('isModified')
            .publishReplay(1)
            .refCount();

        const canSave$ = this.saveClicked$
            .map(x => ({ isValid: this.form.valid }))
            .publishReplay(1)
            .refCount();

        const save$ = canSave$
            .filter(x => x.isValid)
            .publishReplay(1)
            .refCount()
            .withLatestFrom(this.saveClicked$);

        this.showValidationHints$ = canSave$
            .distinctUntilChanged()
            .mapTo(true)
            .merge(distinctSetting$.mapTo(false));

        this.subscriptions = [
            this.cancelClicked$.subscribe(() => store.dispatch({ type: 'SETTING_LOAD' })),

            update$.subscribe(x => store.dispatch({ type: 'UPDATE_SETTING', payload: x })),

            save$.subscribe(password => {
                this.presentLoadingScreen();
                store.dispatch({ type: 'SAVE_SETTING' });
            }),

            this.currentSettings$.filter(pe => pe != null && pe.isSaved).subscribe(() => this.dismissLoadingScreen()),

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
                    { emitEvent: false }
                );
            }),

            this.logoutClicked$.subscribe(() => store.dispatch({ type: 'LOGOUT', payload: true })),
        ];
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'SETTING_LOAD' });
    }

    public ionViewCanLeave(): Promise<boolean> {
        return this.currentSettings$
            .map(settings => !!settings && !settings.isDefault)
            .take(1)
            .toPromise();
    }

    public ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    private presentLoadingScreen() {
        this.dismissLoadingScreen();

        this.loader = this.loadingCtrl.create({
            content: 'Datensynchronisierung. Bitte warten...',
        });

        this.loader.present();
    }

    private dismissLoadingScreen() {
        if (!!this.loader) {
            this.loader.dismiss();
        }
    }
}

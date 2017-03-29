import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Loading, LoadingController, NavController } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';

import * as fromRoot from '../../reducers';
import { CurrentSetting } from '../../reducers/setting';
import { DashboardPage } from '../dashboard/dashboard';

@Component({
    selector: 'settings-page',
    templateUrl: 'settings.html'
})
export class SettingsPage implements OnDestroy {
    public cancelClicked$ = new EventEmitter<Event>();
    public saveClicked$ = new EventEmitter<Event>();
    public deleteAllClicked$ = new EventEmitter<Event>();

    public showValidationHints$: Observable<boolean>;
    public currentSettings$: Observable<CurrentSetting>;
    public canLeave$: Observable<boolean>;

    public form: FormGroup;
    private subscriptions: Subscription[];
    private loader: Loading;

    constructor(
        private navCtrl: NavController,
        private store: Store<fromRoot.AppState>,
        private loadingCtrl: LoadingController,
        private formBuilder: FormBuilder
    ) {
        this.currentSettings$ = store.select(fromRoot.getCurrentSettings)
            .publishReplay(1).refCount();

        this.canLeave$ = this.currentSettings$
            .map(x => !!x && !x.isDefault)
            .startWith(false)
            .publishReplay(1).refCount();

        this.form = formBuilder.group({
            _id: [null],
            serverConnection: formBuilder.group({
                url: [null, Validators.required],
            })
        });

        const update$ = this.form.valueChanges
            .map(() => this.form.value);

        const distinctSetting$ = this.currentSettings$
            .filter(x => !!x)
            .distinctUntilKeyChanged('isModified')
            .publishReplay(1).refCount();

        const canSave$ = this.saveClicked$
            .map(x => ({ isValid: this.form.valid }))
            .publishReplay(1).refCount();

        const save$ = canSave$.filter(x => x.isValid)
            .publishReplay(1).refCount()
            .withLatestFrom(this.saveClicked$);

        this.showValidationHints$ = canSave$.distinctUntilChanged().mapTo(true)
            .merge(distinctSetting$.mapTo(false));

        this.subscriptions = [
            this.cancelClicked$.subscribe(() => this.navCtrl.pop().catch(() => this.navCtrl.setRoot(DashboardPage))),

            this.deleteAllClicked$.subscribe(() => {
                this.store.dispatch({ type: 'DELETE_DATABASE' });
                this.presentLoadingScreen().then(() => {
                    setTimeout(() => location.href = '/', 1000);
                });
            }),

            update$.subscribe(x => store.dispatch({ type: 'UPDATE_SETTINGS', payload: x })),

            save$.subscribe(password => {
                this.presentLoadingScreen();
                store.dispatch({ type: 'SAVE_SETTINGS' });
            }),

            this.currentSettings$
                .filter(pe => pe != null && pe.isSaved)
                .subscribe(() => this.dismissLoadingScreen()),

            distinctSetting$
                .filter(settings => !!settings.serverConnection)
                .subscribe((settings: CurrentSetting) => {
                    this.form.markAsUntouched();
                    this.form.markAsPristine();
                    this.form.patchValue({
                        _id: settings._id,
                        serverConnection: settings.serverConnection
                    }, { emitEvent: false });
                })
        ];
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'LOAD_SETTINGS' });
    }

    public ionViewCanLeave() {
        return this.canLeave$.take(1).toPromise();
    }

    public ngOnDestroy() {
        if (!this.subscriptions || this.subscriptions.length === 0) return;
        this.subscriptions.map(s => !s.closed ? s.unsubscribe() : null);
    }

    private presentLoadingScreen() {
        this.dismissLoadingScreen();

        this.loader = this.loadingCtrl.create({
            content: 'Datensynchronisierung. Bitte warten...'
        });

        return this.loader.present();
    }

    private dismissLoadingScreen() {
        if (!!this.loader) {
            this.loader.dismiss();
        }
    }
}

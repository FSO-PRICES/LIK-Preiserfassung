/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { NavController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, from, of } from 'rxjs';
import {
    combineLatest,
    distinctUntilChanged,
    distinctUntilKeyChanged,
    filter,
    flatMap,
    map,
    mapTo,
    publishReplay,
    refCount,
    startWith,
    take,
    withLatestFrom,
    shareReplay,
    switchMap,
    delay,
    catchError,
} from 'rxjs/operators';

import { PefDialogService } from '@lik-shared';

import { Actions as DatabaseAction } from '../../actions/database';
import { Action as SettingsAction } from '../../actions/setting';
import { areSettingsValid } from '../../common/settings';
import * as fromRoot from '../../reducers';
import { CurrentSetting } from '../../reducers/setting';

@Component({
    selector: 'settings-page',
    templateUrl: 'settings.page.html',
    styleUrls: ['settings.page.scss'],
})
export class SettingsPage implements OnDestroy {
    public cancelClicked$ = new EventEmitter<Event>();
    public saveClicked$ = new EventEmitter<Event>();
    public deleteAllClicked$ = new EventEmitter<Event>();
    public databaseIsDeleted$: Observable<boolean>;

    public showValidationHints$: Observable<boolean>;
    public canConnectToDatabase$: Observable<boolean>;
    public currentSettings$: Observable<CurrentSetting>;
    public currentVersion$: Observable<string | number>;
    public canLeave$: Observable<boolean>;
    public allowToSave$: Observable<boolean>;

    public form: FormGroup;
    private afterViewInit$ = new EventEmitter();
    private subscriptions: Subscription[];

    constructor(
        private navCtrl: NavController,
        private store: Store<fromRoot.AppState>,
        private pefDialogService: PefDialogService,
        appVersion: AppVersion,
        translateService: TranslateService,
        formBuilder: FormBuilder,
    ) {
        this.currentSettings$ = store.select(fromRoot.getCurrentSettings);
        this.currentVersion$ = this.afterViewInit$.pipe(
            delay(3000),
            switchMap(() => from(appVersion.getVersionCode()).pipe(catchError(() => of(null)))),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.canConnectToDatabase$ = this.store
            .select(x => x.database.canConnectToDatabase)
            .pipe(
                publishReplay(1),
                refCount(),
            );

        this.canLeave$ = this.currentSettings$.pipe(
            map(areSettingsValid),
            startWith(false),
            publishReplay(1),
            refCount(),
        );

        this.allowToSave$ = this.currentSettings$.pipe(map(x => !!x && x.isModified && !x.isSaved));

        this.form = formBuilder.group({
            _id: [null],
            serverConnection: formBuilder.group({
                url: [null, Validators.required],
            }),
        });

        const update$ = this.form.valueChanges.pipe(map(() => this.form.value));

        const distinctSetting$ = this.currentSettings$.pipe(
            filter(x => !!x && !x.isDefault),
            distinctUntilKeyChanged('isModified'),
            publishReplay(1),
            refCount(),
        );

        const canSave$ = this.saveClicked$.pipe(
            map(() => ({ isValid: this.form.valid })),
            publishReplay(1),
            refCount(),
        );

        const save$ = canSave$.pipe(
            filter(x => x.isValid),
            publishReplay(1),
            refCount(),
            withLatestFrom(this.saveClicked$),
        );

        const settingsSaved$ = this.currentSettings$.pipe(filter(x => x != null && x.isSaved));

        const databaseExists$ = this.store
            .select(x => x.database.databaseExists)
            .pipe(
                distinctUntilChanged(),
                filter(exists => exists !== null),
                publishReplay(1),
                refCount(),
            );

        this.showValidationHints$ = canSave$.pipe(
            distinctUntilChanged(),
            mapTo(true),
            startWith(false),
        );

        this.databaseIsDeleted$ = this.deleteAllClicked$.pipe(
            combineLatest(
                databaseExists$.pipe(
                    filter(exists => !exists),
                    take(1),
                ),
                (_, databaseExists) => databaseExists,
            ),
            map(databaseExists => !databaseExists),
        );

        this.subscriptions = [
            this.currentVersion$.subscribe(),
            this.cancelClicked$.subscribe(() => this.navigateToDashboard()),

            this.deleteAllClicked$.subscribe(() => {
                this.store.dispatch({ type: 'DELETE_DATABASE' } as DatabaseAction);
            }),

            update$.subscribe(x => store.dispatch({ type: 'UPDATE_SETTINGS', payload: x } as SettingsAction)),

            save$
                .pipe(
                    flatMap(() =>
                        this.pefDialogService.displayLoading(translateService.instant('text_saving-settings'), {
                            requestDismiss$: settingsSaved$,
                        }),
                    ),
                )
                .subscribe(() => {
                    store.dispatch({ type: 'SAVE_SETTINGS' } as SettingsAction);
                }),

            settingsSaved$.subscribe(() => {
                this.store.dispatch({ type: 'CHECK_CONNECTIVITY_TO_DATABASE' } as DatabaseAction);
            }),

            distinctSetting$
                .pipe(filter(settings => !!settings.serverConnection))
                .subscribe((settings: CurrentSetting) => {
                    this.form.markAsUntouched();
                    this.form.markAsPristine();
                    this.form.patchValue(
                        {
                            _id: settings._id,
                            serverConnection: settings.serverConnection,
                        },
                        { emitEvent: false },
                    );
                }),
        ];
    }

    public ngAfterViewInit() {
        this.afterViewInit$.emit();
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_CONNECTIVITY_TO_DATABASE' } as DatabaseAction);
    }

    public ionViewCanLeave() {
        return this.canLeave$.pipe(take(1)).toPromise();
    }

    public ngOnDestroy() {
        if (!this.subscriptions) return;
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    public navigateToDashboard() {
        return this.navCtrl.navigateRoot('/');
    }
}

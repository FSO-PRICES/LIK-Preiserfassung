/*
 * LIK-Preiserfassung
 * Copyright (C) 2024 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
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
import { DialogRef } from '@angular/cdk/dialog';
import { AfterViewInit, Component, ElementRef, EventEmitter, HostBinding, OnDestroy, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { IonInput } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, publishReplay, refCount } from 'rxjs/operators';

import * as fromRoot from '../../reducers';

export type PefDialogLoginResult = 'LOGGED_IN' | 'NAVIGATE_TO_SETTINGS';
@Component({
    selector: 'pef-dialog-login',
    templateUrl: 'pef-dialog-login.html',
    styleUrls: ['pef-dialog-login.scss'],
})
export class PefDialogLoginComponent implements OnDestroy, AfterViewInit {
    @HostBinding('class') classes = 'pef-dialog';

    @ViewChild('username') username: IonInput;

    public form: UntypedFormGroup;

    public login$ = new EventEmitter();
    public loginError$ = this.store.select(fromRoot.getLoginError).pipe(publishReplay(1), refCount());

    public showValidationHints$: Observable<boolean>;

    private subscriptions: Subscription[] = [];

    constructor(
        formBuilder: UntypedFormBuilder,
        private dialogRef: DialogRef<PefDialogLoginResult>,
        private store: Store<fromRoot.AppState>,
    ) {
        this.form = formBuilder.group({
            username: [null, Validators.required],
            password: [null, Validators.required],
        });

        const loginSuccess$ = this.store.select(fromRoot.getIsLoggedIn).pipe(filter((x) => !!x));

        this.subscriptions = [
            this.login$
                .pipe(
                    map(() => ({ isValid: this.form.valid, credentials: this.form.value })),
                    filter((x) => x.isValid),
                )
                .subscribe((x) => {
                    store.dispatch({ type: 'LOGIN', payload: x.credentials });
                }),

            loginSuccess$.subscribe(() => this.dialogRef.close('LOGGED_IN')),
        ];
        this.showValidationHints$ = this.login$.pipe(
            distinctUntilChanged(),
            map(() => true),
        );
    }

    ngAfterViewInit() {
        this.username.getInputElement().then((el) => {
            el.focus();
        });
    }

    ngOnDestroy() {
        this.subscriptions.filter((s) => !!s && !s.closed).forEach((s) => s.unsubscribe());
    }

    navigateToSettings() {
        this.dialogRef.close('NAVIGATE_TO_SETTINGS');
    }
}

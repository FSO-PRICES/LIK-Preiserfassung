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

import { Component, ElementRef, EventEmitter, HostBinding, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PopoverController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter, map, publishReplay, refCount } from 'rxjs/operators';

import * as fromRoot from '../../reducers';

@Component({
    selector: 'pef-dialog-login',
    templateUrl: 'pef-dialog-login.html',
    styleUrls: ['pef-dialog-login.scss'],
})
export class PefDialogLoginComponent implements OnDestroy {
    @HostBinding('class') classes = 'pef-dialog';

    @ViewChild('username', { read: ElementRef, static: false }) username: ElementRef<HTMLElement>;

    public form: FormGroup;

    public login$ = new EventEmitter();
    public loginError$ = this.store.select(fromRoot.getLoginError).pipe(
        publishReplay(1),
        refCount(),
    );

    private subscriptions: Subscription[] = [];

    constructor(formBuilder: FormBuilder, public viewCtrl: PopoverController, private store: Store<fromRoot.AppState>) {
        this.form = formBuilder.group({
            username: [null, Validators.required],
            password: [null, Validators.required],
        });

        const loginSuccess$ = this.store.select(fromRoot.getIsLoggedIn).pipe(filter(x => !!x));

        this.subscriptions = [
            this.login$
                .pipe(
                    map(() => ({ isValid: this.form.valid, credentials: this.form.value })),
                    filter(x => x.isValid),
                )
                .subscribe(x => {
                    store.dispatch({ type: 'LOGIN', payload: x.credentials });
                }),

            loginSuccess$.subscribe(() => viewCtrl.dismiss('LOGGED_IN')),
        ];
    }

    ionViewDidEnter() {
        const el = this.username.nativeElement.querySelector('input') as HTMLElement;
        if (el && el.focus) {
            el.focus();
        }
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    navigateToSettings() {
        this.viewCtrl.dismiss('NAVIGATE_TO_SETTINGS');
    }
}

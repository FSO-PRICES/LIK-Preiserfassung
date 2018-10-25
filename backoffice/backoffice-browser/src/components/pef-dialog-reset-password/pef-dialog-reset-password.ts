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

import { Component, HostBinding, EventEmitter, OnDestroy } from '@angular/core';
import { ViewController } from 'ionic-angular';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';

import * as fromRoot from '../../reducers';
import { Subscription } from 'rxjs';

@Component({
    selector: 'pef-dialog-reset-password',
    templateUrl: 'pef-dialog-reset-password.html',
})
export class PefDialogResetPasswordComponent implements OnDestroy {
    @HostBinding('class') classes = 'pef-dialog';

    public form: FormGroup;

    public resetPasswordClicked$ = new EventEmitter();
    public pesetPasswordError$ = this.store.select(fromRoot.getResetPasswordError).publishReplay(1).refCount();

    private subscriptions: Subscription[] = [];

    constructor(public viewCtrl: ViewController, private formBuilder: FormBuilder, private store: Store<fromRoot.AppState>) {
        this.form = formBuilder.group({
            password: [null, Validators.compose([Validators.required, Validators.maxLength(35)])]
        });

        const ResetPasswordSuccess$ = this.store.select(fromRoot.getCurrentPreiserheber)
            .map(erheber => erheber.isPasswordResetted)
            .filter(x => !!x);

        this.subscriptions = [
            this.resetPasswordClicked$
                .map(x => ({ isValid: this.form.valid, password: this.form.get('password').value }))
                .filter(x => x.isValid)
                .subscribe(x => {
                    store.dispatch({ type: 'RESET_PASSWORD', payload: x.password });
                }),

            ResetPasswordSuccess$
                .subscribe(success => viewCtrl.dismiss('RESETTED'))
        ];
    }

    ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }
}

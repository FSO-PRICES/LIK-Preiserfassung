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

import { Component, EventEmitter, HostBinding, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PopoverController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter, map, publishReplay, refCount } from 'rxjs/operators';

import * as fromRoot from '../../reducers';

@Component({
    selector: 'pef-dialog-reset-password',
    templateUrl: 'pef-dialog-reset-password.html',
    styleUrls: ['pef-dialog-reset-password.scss'],
})
export class PefDialogResetPasswordComponent implements OnDestroy {
    @HostBinding('class') classes = 'pef-dialog';

    public form: FormGroup;

    public resetPasswordClicked$ = new EventEmitter();
    public resetPasswordError$ = this.store.select(fromRoot.getResetPasswordError).pipe(
        publishReplay(1),
        refCount(),
    );

    private subscriptions: Subscription[] = [];

    constructor(formBuilder: FormBuilder, public viewCtrl: PopoverController, private store: Store<fromRoot.AppState>) {
        this.form = formBuilder.group({
            password: [null, Validators.compose([Validators.required, Validators.maxLength(35)])],
        });

        const ResetPasswordSuccess$ = this.store.select(fromRoot.getCurrentPreiserheber).pipe(
            map(erheber => erheber.isPasswordResetted),
            filter(x => !!x),
        );

        this.subscriptions = [
            this.resetPasswordClicked$
                .pipe(
                    map(x => ({ isValid: this.form.valid, password: this.form.get('password').value })),
                    filter(x => x.isValid),
                )
                .subscribe(x => {
                    store.dispatch({ type: 'RESET_PASSWORD', payload: x.password });
                }),

            ResetPasswordSuccess$.subscribe(success => viewCtrl.dismiss('RESETTED')),
        ];
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }
}

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
import { Component, EventEmitter, HostBinding, inject } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { filter, map, publishReplay, refCount } from 'rxjs/operators';

import { StronglyTypedDialog } from '@lik-shared';

import * as fromRoot from '../../reducers';

@UntilDestroy()
@Component({
    selector: 'pef-dialog-reset-password',
    templateUrl: 'pef-dialog-reset-password.html',
    styleUrls: ['pef-dialog-reset-password.scss'],
})
export class PefDialogResetPasswordComponent extends StronglyTypedDialog<never, 'RESETTED' | 'ABORT_RESET'> {
    @HostBinding('class') classes = 'pef-dialog';

    private formBuilder = inject(UntypedFormBuilder);
    private store = inject<Store<fromRoot.AppState>>(Store);
    public form = this.formBuilder.group({
        password: [null, Validators.compose([Validators.required, Validators.maxLength(35)])],
    });

    public resetPasswordClicked$ = new EventEmitter();
    public resetPasswordError$ = this.store.select(fromRoot.getResetPasswordError).pipe(publishReplay(1), refCount());

    constructor() {
        super();

        const resetPasswordSuccess$ = this.store.select(fromRoot.getCurrentPreiserheber).pipe(
            map((erheber) => erheber.isPasswordResetted),
            filter((x) => !!x),
        );

        this.resetPasswordClicked$
            .pipe(
                map(() => ({ isValid: this.form.valid, password: this.form.get('password').value })),
                filter((x) => x.isValid),
                untilDestroyed(this),
            )
            .subscribe((x) => {
                this.store.dispatch({ type: 'RESET_PASSWORD', payload: x.password });
            });

        resetPasswordSuccess$.pipe(untilDestroyed(this)).subscribe(() => this.closeDialog('RESETTED'));
    }
}

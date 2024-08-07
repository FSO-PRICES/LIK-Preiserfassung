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
import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import * as O from '@effect/data/Option';
import { IonInput } from '@ionic/angular';

import { StronglyTypedDialog } from '@lik-shared';

export type LoginModalResult = O.Option<{ username: string; password: string }>;

@Component({
    selector: 'login-modal',
    templateUrl: 'login-modal.component.html',
    styleUrls: ['login-modal.component.scss'],
    host: { class: 'pef-dialog' },
})
export class LoginModalComponent extends StronglyTypedDialog<never, LoginModalResult> implements AfterViewInit {
    private formBuilder = inject(FormBuilder);
    public loginForm = this.formBuilder.group({
        username: new FormControl('', [Validators.required]),
        password: new FormControl('', [Validators.required]),
    });

    @ViewChild('username') username: IonInput;

    ngAfterViewInit() {
        this.username.getInputElement().then((el) => {
            el.focus();
        });
    }

    login() {
        this.closeDialog(
            O.some({
                username: this.loginForm.getRawValue().username,
                password: this.loginForm.getRawValue().password,
            }),
        );
    }

    navigateToSettings() {
        this.closeDialog(O.none());
    }
}

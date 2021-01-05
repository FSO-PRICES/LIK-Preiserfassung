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

import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModalController } from '@ionic/angular';

@Component({
    selector: 'login-modal',
    templateUrl: 'login-modal.component.html',
    styleUrls: ['login-modal.component.scss'],
})
export class LoginModalComponent {
    public loginForm: FormGroup;

    @ViewChild('username', { read: ElementRef, static: false }) username: ElementRef<HTMLElement>;

    constructor(private modalController: ModalController, private formBuilder: FormBuilder) {
        this.loginForm = this.formBuilder.group({
            username: [''],
            password: [''],
        });
    }

    ionViewDidEnter() {
        const el = this.username.nativeElement.querySelector('input') as HTMLElement;
        if (el && el.focus) {
            el.focus();
        }
    }

    login() {
        this.modalController.dismiss({
            username: this.loginForm.value.username,
            password: this.loginForm.value.password,
            navigateTo: null,
        });
    }

    navigateToSettings() {
        this.modalController.dismiss({ username: null, password: null, navigateTo: 'settings' });
    }
}

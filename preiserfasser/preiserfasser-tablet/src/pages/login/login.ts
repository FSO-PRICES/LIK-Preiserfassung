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

import { Component } from '@angular/core';
import { ViewController, NavController, IonicPage } from 'ionic-angular';

@IonicPage()
@Component({
    selector: 'login-modal',
    templateUrl: 'login.html'
})
export class LoginModal {
    public username: string;
    public password: string;

    constructor(public viewCtrl: ViewController, public navController: NavController) { }

    login() {
        this.viewCtrl.dismiss({ username: this.username, password: this.password, navigateTo: null });
    }

    navigateToSettings() {
        this.viewCtrl.dismiss({ username: null, password: null, navigateTo: 'SettingsPage' });
    }
}

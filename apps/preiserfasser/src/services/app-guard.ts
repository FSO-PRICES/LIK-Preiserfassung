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

import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';

import { areSettingsValid } from '../common/settings';
import * as fromRoot from '../reducers';

@Injectable({
    providedIn: 'root',
})
export class AppGuard implements CanActivate {
    constructor(private store: Store<fromRoot.AppState>, private navCtrl: NavController) {}

    canActivate() {
        return this.store.select(fromRoot.getSettings).pipe(
            take(1),
            map(settings => {
                if (!areSettingsValid(settings)) {
                    this.navCtrl.navigateRoot(['/settings']);
                    return false;
                }
                return true;
            }),
        );
    }
}

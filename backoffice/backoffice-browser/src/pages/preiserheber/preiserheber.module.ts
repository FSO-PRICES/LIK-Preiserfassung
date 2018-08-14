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

import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { PreiserheberPage } from './preiserheber';
import { PreiserheberDetailComponent } from './components/preiserheber-detail/preiserheber-detail';
import { PreiserheberListComponent } from './components/preiserheber-list/preiserheber-list';
import { PreiserheberPreiszuweisungComponent } from './components/preiserheber-preiszuweisung/preiserheber-preiszuweisung';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefDialogCancelEditModule } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';
import { PefDialogConfirmDeleteModule } from '../../components/pef-dialog-confirm-delete/pef-dialog-confirm-delete.module';
import { PefDialogResetPasswordModule } from '../../components/pef-dialog-reset-password/pef-dialog-reset-password.module';
import { PefComponentsModule } from 'lik-shared';

@NgModule({
    declarations: [
        PreiserheberPage,
        PreiserheberDetailComponent,
        PreiserheberListComponent,
        PreiserheberPreiszuweisungComponent
    ],
    imports: [
        IonicPageModule.forChild(PreiserheberPage),
        PefComponentsModule,
        PefDialogCancelEditModule,
        PefMenuModule,
        PefDialogCancelEditModule,
        PefDialogConfirmDeleteModule,
        PefDialogResetPasswordModule
    ],
})
export class PreiserheberModule {
}

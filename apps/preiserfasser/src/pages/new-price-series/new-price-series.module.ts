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

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { PefComponentsModule } from '@lik-shared';

import { DialogNewPmBearbeitungsCodeComponent } from '../../components/dialog-new-pm-bearbeitungs-code/dialog-new-pm-bearbeitungs-code.component';
import { ChooseFromWarenkorbComponent } from './choose-from-warenkorb';
import { NewPriceSeriesPage } from './new-price-series.page';

const routes: Routes = [
    {
        path: '',
        component: NewPriceSeriesPage,
    },
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        PefComponentsModule,
        RouterModule.forChild(routes),
        TranslateModule,
    ],
    entryComponents: [DialogNewPmBearbeitungsCodeComponent],
    declarations: [NewPriceSeriesPage, ChooseFromWarenkorbComponent, DialogNewPmBearbeitungsCodeComponent],
})
export class NewPriceSeriesPageModule {}

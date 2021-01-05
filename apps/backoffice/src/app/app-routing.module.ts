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
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { CockpitPage } from '../pages/cockpit';
import { ControllingPage } from '../pages/controlling';
import { ExportToPrestaPage } from '../pages/export-to-presta';
import { ImportPage } from '../pages/import';
import { PreiserheberPage } from '../pages/preiserheber';
import { PreismeldestellePage } from '../pages/preismeldestelle';
import { PreismeldungPage } from '../pages/preismeldung';
import { ReportingPage } from '../pages/reporting';
import { SettingsPage } from '../pages/settings';
import { AppGuard } from '../services/app-guard';

const routes: Routes = [
    { path: '', redirectTo: 'cockpit', pathMatch: 'full' },
    {
        path: 'cockpit',
        canActivate: [AppGuard],
        component: CockpitPage,
    },
    {
        path: 'import',
        canActivate: [AppGuard],
        component: ImportPage,
    },
    {
        path: 'preismeldestellen',
        canActivate: [AppGuard],
        component: PreismeldestellePage,
    },
    {
        path: 'pe',
        canActivate: [AppGuard],
        component: PreiserheberPage,
    },
    {
        path: 'pm',
        canActivate: [AppGuard],
        component: PreismeldungPage,
    },
    {
        path: 'pm/:pmsNummer',
        canActivate: [AppGuard],
        component: PreismeldungPage,
    },
    {
        path: 'controlling',
        canActivate: [AppGuard],
        component: ControllingPage,
    },
    {
        path: 'report',
        canActivate: [AppGuard],
        component: ReportingPage,
    },
    {
        path: 'export',
        canActivate: [AppGuard],
        component: ExportToPrestaPage,
    },
    {
        path: 'settings',
        component: SettingsPage,
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
    exports: [RouterModule],
})
export class AppRoutingModule {}

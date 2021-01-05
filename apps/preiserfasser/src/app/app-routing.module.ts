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

import { DashboardPage } from '../pages/dashboard/dashboard.page';
import { NewPriceSeriesPage } from '../pages/new-price-series/new-price-series.page';
import { PeDetailsPage } from '../pages/pe-details/pe-details.page';
import { PmsDetailsPage } from '../pages/pms-details/pms-details.page';
import { PmsPriceEntryPage } from '../pages/pms-price-entry/pms-price-entry.page';
import { PmsSortPage } from '../pages/pms-sort/pms-sort.page';
import { SettingsPage } from '../pages/settings/settings.page';
import { AppGuard } from '../services/app-guard';

const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    {
        path: 'dashboard',
        canActivate: [AppGuard],
        component: DashboardPage,
    },
    {
        path: 'pe-details',
        canActivate: [AppGuard],
        component: PeDetailsPage,
    },
    {
        path: 'pms-details/:pmsNummer',
        canActivate: [AppGuard],
        component: PmsDetailsPage,
    },
    {
        path: 'pms-price-entry/:pmsNummer',
        canActivate: [AppGuard],
        component: PmsPriceEntryPage,
    },
    {
        path: 'new-price-series/:pmsNummer',
        canActivate: [AppGuard],
        component: NewPriceSeriesPage,
    },
    {
        path: 'pms-sort/:pmsNummer',
        canActivate: [AppGuard],
        component: PmsSortPage,
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

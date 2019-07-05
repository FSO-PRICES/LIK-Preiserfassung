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
        path: 'pms-sort',
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

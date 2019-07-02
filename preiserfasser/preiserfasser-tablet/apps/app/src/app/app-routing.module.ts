import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', loadChildren: '../pages/dashboard/dashboard.module#DashboardPageModule' },
    // { path: 'login', loadChildren: '../pages/login/login.module#LoginPageModule' },
    { path: 'pe-details', loadChildren: '../pages/pe-details/pe-details.module#PeDetailsPageModule' },
    { path: 'pms-details', loadChildren: '../pages/pms-details/pms-details.module#PmsDetailsPageModule' },
    {
        path: 'pms-price-entry',
        loadChildren: '../pages/pms-price-entry/pms-price-entry.module#PmsPriceEntryPageModule',
    },
    { path: 'pms-sort', loadChildren: '../pages/pms-sort/pms-sort.module#PmsSortPageModule' },
    { path: 'settings', loadChildren: '../pages/settings/settings.module#SettingsPageModule' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
    exports: [RouterModule],
})
export class AppRoutingModule {}

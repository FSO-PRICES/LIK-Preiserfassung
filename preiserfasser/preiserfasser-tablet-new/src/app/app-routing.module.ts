import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: './home/home.module#HomePageModule' },
  { path: 'dashboard', loadChildren: './dashboard/dashboard.module#DashboardPageModule' },
  { path: 'login', loadChildren: './login/login.module#LoginPageModule' },
  { path: 'new-price-series', loadChildren: './new-price-series/new-price-series.module#NewPriceSeriesPageModule' },
  { path: 'pe-details', loadChildren: './pe-details/pe-details.module#PeDetailsPageModule' },
  { path: 'pms-details', loadChildren: './pms-details/pms-details.module#PmsDetailsPageModule' },
  { path: 'pms-price-entry', loadChildren: './pms-price-entry/pms-price-entry.module#PmsPriceEntryPageModule' },
  { path: 'pms-sort', loadChildren: './pms-sort/pms-sort.module#PmsSortPageModule' },
  { path: 'settings', loadChildren: './settings/settings.module#SettingsPageModule' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

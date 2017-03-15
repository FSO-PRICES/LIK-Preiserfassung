import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';

import { RegionPage } from './region';
import { RegionDetailComponent } from './components/region-detail/region-detail';
import { RegionListComponent } from './components/region-list/region-list';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefComponentsModule } from 'lik-shared';

@NgModule({
    imports: [CommonModule, IonicModule, PefComponentsModule, PefMenuModule],
    declarations: [
        RegionPage,
        RegionDetailComponent,
        RegionListComponent
    ],
    entryComponents: [
        RegionDetailComponent,
        RegionListComponent
    ],
    exports: [RegionPage, RegionDetailComponent, RegionListComponent]
})
export class RegionModule {
}

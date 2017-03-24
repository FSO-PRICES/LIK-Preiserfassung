import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';

import { PreismeldungPage } from './preismeldung';
import { PreismeldungListComponent } from './components/preismeldung-list/preismeldung-list';
import { PreismeldungDetailComponent } from './components/preismeldung-detail/preismeldung-detail';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefComponentsModule } from 'lik-shared';

@NgModule({
    imports: [CommonModule, IonicModule, PefComponentsModule, PefMenuModule],
    declarations: [
        PreismeldungPage,
        PreismeldungListComponent,
        PreismeldungDetailComponent
    ],
    entryComponents: [
        PreismeldungListComponent,
        PreismeldungDetailComponent
    ],
    exports: [PreismeldungPage, PreismeldungListComponent, PreismeldungDetailComponent ]
})
export class PreismeldungModule {
}

import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PreismeldestellePage } from './preismeldestelle';
import { PreismeldestelleDetailComponent } from './components/preismeldestelle-detail/preismeldestelle-detail';
import { PreismeldestelleListComponent } from './components/preismeldestelle-list/preismeldestelle-list';

import { PefComponentsModule } from 'lik-shared';

@NgModule({
    imports: [CommonModule, IonicModule, PefMenuModule, PefComponentsModule],
    declarations: [
        PreismeldestellePage,
        PreismeldestelleDetailComponent,
        PreismeldestelleListComponent
    ],
    entryComponents: [
        PreismeldestelleDetailComponent,
        PreismeldestelleListComponent
    ],
    exports: [PreismeldestellePage, PreismeldestelleDetailComponent, PreismeldestelleListComponent]
})
export class PreismeldestelleModule {
}

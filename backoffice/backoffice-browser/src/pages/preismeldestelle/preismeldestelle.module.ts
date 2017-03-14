import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';

import { PreismeldestellePage } from './preismeldestelle';
import { PreismeldestelleDetailComponent } from './components/preismeldestelle-detail/preismeldestelle-detail';
import { PreismeldestelleListComponent } from './components/preismeldestelle-list/preismeldestelle-list';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefComponentsModule } from 'lik-shared';

@NgModule({
    imports: [CommonModule, IonicModule, PefComponentsModule, PefMenuModule],
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

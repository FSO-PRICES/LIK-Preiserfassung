import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { PreismeldestellePage } from './preismeldestelle';
import { PreismeldestelleDetailComponent } from './components/preismeldestelle-detail/preismeldestelle-detail';
import { PreismeldestelleListComponent } from './components/preismeldestelle-list/preismeldestelle-list';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefComponentsModule } from 'lik-shared';

@NgModule({
    declarations: [
        PreismeldestellePage,
        PreismeldestelleDetailComponent,
        PreismeldestelleListComponent
    ],
    imports: [
        IonicPageModule.forChild(PreismeldestellePage),
        PefComponentsModule,
        PefMenuModule
    ],
})
export class PreismeldestelleModule {
}

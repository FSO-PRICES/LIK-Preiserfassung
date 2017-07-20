import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { PreismeldestellePage } from './preismeldestelle';
import { PreismeldestelleDetailComponent } from './components/preismeldestelle-detail/preismeldestelle-detail';
import { PreismeldestelleListComponent } from './components/preismeldestelle-list/preismeldestelle-list';

import { PefComponentsModule } from 'lik-shared';
import { PefDialogCancelEditModule } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';
import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';

@NgModule({
    declarations: [
        PreismeldestellePage,
        PreismeldestelleDetailComponent,
        PreismeldestelleListComponent
    ],
    imports: [
        IonicPageModule.forChild(PreismeldestellePage),
        PefComponentsModule,
        PefDialogCancelEditModule,
        PefMenuModule
    ],
})
export class PreismeldestelleModule {
}

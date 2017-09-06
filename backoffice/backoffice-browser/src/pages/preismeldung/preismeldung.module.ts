import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { PreismeldungPage } from './preismeldung';
import { PreismeldungListComponent } from './components/preismeldung-list/preismeldung-list';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefComponentsModule, PreismeldungSharedModule } from 'lik-shared';
import { PefDialogCancelEditModule } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';

@NgModule({
    declarations: [
        PreismeldungPage,
        PreismeldungListComponent
    ],
    imports: [
        IonicPageModule.forChild(PreismeldungPage),
        PefComponentsModule,
        PefDialogCancelEditModule,
        PefMenuModule,
        PreismeldungSharedModule
    ],
})
export class PreismeldungModule {
}

import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { PreismeldungListComponent } from './components/preismeldung-list/preismeldung-list';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefComponentsModule, PreismeldungSharedModule } from 'lik-shared';
import { PefDialogCancelEditModule } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';

@NgModule({
    declarations: [PreismeldungListComponent],
    exports: [
        PreismeldungListComponent,
        PefComponentsModule,
        PefDialogCancelEditModule,
        PefMenuModule,
        PreismeldungSharedModule,
    ],
    imports: [IonicPageModule, PefComponentsModule, PefDialogCancelEditModule, PefMenuModule, PreismeldungSharedModule],
})
export class PreismeldungPagesModule {}
// Shared module used by preismeldung-by-pms and preismeldung modules

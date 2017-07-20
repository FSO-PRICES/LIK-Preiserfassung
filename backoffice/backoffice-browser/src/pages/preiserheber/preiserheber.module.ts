import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { PreiserheberPage } from './preiserheber';
import { PreiserheberDetailComponent } from './components/preiserheber-detail/preiserheber-detail';
import { PreiserheberListComponent } from './components/preiserheber-list/preiserheber-list';
import { PreiserheberPreiszuweisungComponent } from './components/preiserheber-preiszuweisung/preiserheber-preiszuweisung';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefDialogCancelEditModule } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';
import { PefDialogConfirmDeleteModule } from '../../components/pef-dialog-confirm-delete/pef-dialog-confirm-delete.module';
import { PefDialogResetPasswordModule } from '../../components/pef-dialog-reset-password/pef-dialog-reset-password.module';
import { PefComponentsModule } from 'lik-shared';

@NgModule({
    declarations: [
        PreiserheberPage,
        PreiserheberDetailComponent,
        PreiserheberListComponent,
        PreiserheberPreiszuweisungComponent
    ],
    imports: [
        IonicPageModule.forChild(PreiserheberPage),
        PefComponentsModule,
        PefDialogCancelEditModule,
        PefMenuModule,
        PefDialogCancelEditModule,
        PefDialogConfirmDeleteModule,
        PefDialogResetPasswordModule
    ],
})
export class PreiserheberModule {
}

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { PefComponentsModule } from '@lik-shared';

import { PreiserheberDetailComponent } from './components/preiserheber-detail/preiserheber-detail';
import { PreiserheberListComponent } from './components/preiserheber-list/preiserheber-list';
import { PreiserheberPreiszuweisungComponent } from './components/preiserheber-preiszuweisung/preiserheber-preiszuweisung';
import { PreiserheberPage } from './preiserheber';

import { PefDialogCancelEditModule } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';
import { PefDialogConfirmDeleteModule } from '../../components/pef-dialog-confirm-delete/pef-dialog-confirm-delete.module';
import { PefDialogResetPasswordModule } from '../../components/pef-dialog-reset-password/pef-dialog-reset-password.module';
import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        ReactiveFormsModule,
        PefComponentsModule,
        PefDialogCancelEditModule,
        PefMenuModule,
        PefDialogCancelEditModule,
        PefDialogConfirmDeleteModule,
        PefDialogResetPasswordModule,
    ],
    declarations: [
        PreiserheberPage,
        PreiserheberDetailComponent,
        PreiserheberListComponent,
        PreiserheberPreiszuweisungComponent,
    ],
})
export class PreiserheberModule {}

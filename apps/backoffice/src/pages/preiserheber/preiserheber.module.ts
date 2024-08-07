import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { NgxLetModule, PefComponentsModule } from '@lik-shared';

import { PefDialogCancelEditModule } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';
import { PefDialogConfirmDeleteModule } from '../../components/pef-dialog-confirm-delete/pef-dialog-confirm-delete.module';
import { PefDialogPmStatusSelectionModule } from '../../components/pef-dialog-pm-status-selection';
import { PefDialogResetPasswordModule } from '../../components/pef-dialog-reset-password/pef-dialog-reset-password.module';
import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';

import { PreiserheberDetailComponent } from './components/preiserheber-detail/preiserheber-detail';
import { PreiserheberListComponent } from './components/preiserheber-list/preiserheber-list';
import { PreiserheberPreiszuweisungComponent } from './components/preiserheber-preiszuweisung/preiserheber-preiszuweisung';
import { PreiserheberPage } from './preiserheber';

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        NgxLetModule,
        TranslateModule,
        ReactiveFormsModule,
        PefComponentsModule,
        PefDialogCancelEditModule,
        PefMenuModule,
        PefDialogCancelEditModule,
        PefDialogConfirmDeleteModule,
        PefDialogPmStatusSelectionModule,
        PefDialogResetPasswordModule,
        ScrollingModule,
    ],
    declarations: [
        PreiserheberPage,
        PreiserheberDetailComponent,
        PreiserheberListComponent,
        PreiserheberPreiszuweisungComponent,
    ],
})
export class PreiserheberModule {}

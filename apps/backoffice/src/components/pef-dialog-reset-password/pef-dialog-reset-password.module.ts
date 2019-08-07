import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PefDialogResetPasswordComponent } from './pef-dialog-reset-password';

import { PefComponentsModule } from '@lik-shared';

@NgModule({
    imports: [CommonModule, IonicModule, ReactiveFormsModule, PefComponentsModule],
    declarations: [PefDialogResetPasswordComponent],
    entryComponents: [PefDialogResetPasswordComponent],
    exports: [PefDialogResetPasswordComponent],
})
export class PefDialogResetPasswordModule {}

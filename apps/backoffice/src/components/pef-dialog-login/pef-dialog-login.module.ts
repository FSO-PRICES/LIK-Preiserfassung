import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PefDialogLoginComponent } from './pef-dialog-login';

import { PefComponentsModule } from '@lik-shared';

@NgModule({
    imports: [CommonModule, IonicModule, ReactiveFormsModule, PefComponentsModule],
    declarations: [PefDialogLoginComponent],
    entryComponents: [PefDialogLoginComponent],
    exports: [PefDialogLoginComponent],
})
export class PefDialogLoginModule {}

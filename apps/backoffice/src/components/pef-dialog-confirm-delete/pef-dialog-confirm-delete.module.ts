import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { PefComponentsModule } from '@lik-shared';

import { PefDialogConfirmDeleteComponent } from './pef-dialog-confirm-delete';

@NgModule({
    imports: [CommonModule, IonicModule, PefComponentsModule],
    declarations: [PefDialogConfirmDeleteComponent],
    entryComponents: [PefDialogConfirmDeleteComponent],
    exports: [PefDialogConfirmDeleteComponent],
})
export class PefDialogConfirmDeleteModule {}

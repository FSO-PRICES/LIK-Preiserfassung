import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { PefComponentsModule } from '@lik-shared';

import { PefDialogConfirmDeleteComponent } from './pef-dialog-confirm-delete';

@NgModule({
    imports: [CommonModule, TranslateModule, IonicModule, PefComponentsModule],
    declarations: [PefDialogConfirmDeleteComponent],
    exports: [PefDialogConfirmDeleteComponent],
})
export class PefDialogConfirmDeleteModule {}

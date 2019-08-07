import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { PefComponentsModule } from '@lik-shared';

import { PefDialogCancelEditModule } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';
import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PreismeldestelleDetailComponent } from './components/preismeldestelle-detail/preismeldestelle-detail';
import { PreismeldestelleListComponent } from './components/preismeldestelle-list/preismeldestelle-list';
import { PreismeldestellePage } from './preismeldestelle';

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        ReactiveFormsModule,
        PefComponentsModule,
        PefDialogCancelEditModule,
        PefMenuModule,
    ],
    declarations: [PreismeldestellePage, PreismeldestelleDetailComponent, PreismeldestelleListComponent],
})
export class PreismeldestelleModule {}

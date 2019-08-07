import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { PefDialogCancelEditModule } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';
import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { SettingsPage } from './settings';

@NgModule({
    imports: [CommonModule, IonicModule, ReactiveFormsModule, PefDialogCancelEditModule, PefMenuModule],
    declarations: [SettingsPage],
})
export class SettingsModule {}

import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';

import { ExportToPrestaPage } from './export-to-presta';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';

@NgModule({
    declarations: [ExportToPrestaPage],
    imports: [IonicPageModule.forChild(ExportToPrestaPage), PefMenuModule],
})
export class ExportToPrestaModule {}

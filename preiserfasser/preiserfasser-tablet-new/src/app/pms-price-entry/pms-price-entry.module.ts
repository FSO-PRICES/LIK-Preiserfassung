import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PmsPriceEntryPage } from './pms-price-entry.page';

const routes: Routes = [
  {
    path: '',
    component: PmsPriceEntryPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [PmsPriceEntryPage]
})
export class PmsPriceEntryPageModule {}

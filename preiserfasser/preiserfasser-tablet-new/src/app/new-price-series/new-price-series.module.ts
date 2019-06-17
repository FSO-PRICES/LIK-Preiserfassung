import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { NewPriceSeriesPage } from './new-price-series.page';

const routes: Routes = [
  {
    path: '',
    component: NewPriceSeriesPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [NewPriceSeriesPage]
})
export class NewPriceSeriesPageModule {}

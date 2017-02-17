import { Component, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
    selector: 'pef-search-input',
    template: `
        <ion-item>
            <ion-label>
                <pef-icon name="search"></pef-icon>
            </ion-label>
            <ion-input type="text" clearInput [formControl]="filterText"></ion-input>
        </ion-item>`
})
export class PefSearchInput {
    public filterText = new FormControl();
    @Output() valueChanges = this.filterText.valueChanges;
}

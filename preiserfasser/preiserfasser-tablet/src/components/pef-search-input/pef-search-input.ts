import { Component, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
    selector: 'pef-search-input',
    templateUrl: './pef-search-input.html'
})
export class PefSearchInput {
    public filterText = new FormControl();
    @Output() valueChanges = this.filterText.valueChanges;
}

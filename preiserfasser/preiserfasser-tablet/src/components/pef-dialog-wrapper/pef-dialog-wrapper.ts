import { Component, Input } from '@angular/core';

@Component({
    selector: 'pef-dialog-wrapper',
    templateUrl: './pef-dialog-wrapper.html',
    host: {
        '[class.pef-dialog-wrapper-show]': 'visible'
    }
})
export class PefDialogWrapper {
    @Input() visible = false;
}

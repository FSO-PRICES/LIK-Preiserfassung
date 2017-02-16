import { Component, Input } from '@angular/core';

import * as P from '../../../../../common-models';

@Component({
    selector: 'preismeldung-messages',
    templateUrl: 'preismeldung-messages.html'
})
export class PreismeldungMessagesComponent {
    @Input() preismeldung: P.Models.Preismeldung;
}

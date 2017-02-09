import { Component, Input } from '@angular/core';

import * as P from '../../../../../common-models';

@Component({
    selector: 'preismeldung_additional-info',
    templateUrl: 'preismeldung_additional-info.html'
})
export class PreismeldungAdditionalInfoComponent {
    @Input() preismeldung: P.Preismeldung;
}

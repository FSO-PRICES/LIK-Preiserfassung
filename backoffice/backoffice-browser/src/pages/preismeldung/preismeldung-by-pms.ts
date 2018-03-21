import { IonicPage } from 'ionic-angular';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PreismeldungPage } from './';

@IonicPage({
    segment: 'pm/:pmsNummer',
})
@Component({
    selector: 'preismeldung-by-pms',
    templateUrl: 'preismeldung.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
// Same as PreismeldungPage but it allows to use the :pmsNummer parameter
export class PreismeldungByPmsPage extends PreismeldungPage {}

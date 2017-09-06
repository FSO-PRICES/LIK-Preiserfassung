import { Component, HostBinding } from '@angular/core';
import { ViewController } from 'ionic-angular';

@Component({
    selector: 'dialog-cancel-edit',
    template: `
        <div class="pef-dialog-message">
            <h3>
                <pef-icon name="warning"></pef-icon>
                An der aktuellen Preismeldung wurde Daten geändert!
            </h3>
            <p> Auf «Weiter bearbeiten» klicken um bei dieser Preismeldung zu bleiben <br> (Dateineingabe bleibt bestehen). </p>
            <p> Auf «Änderungen verwerfen» klicken um diese Preismeldung zu verlassen <br> (Dateneingabe geht verloren). </p>
        </div>

        <div class="pef-dialog-button-row">
            <button ion-button (click)="viewCtrl.dismiss('SAVE')" color="primary">Speichern</button>
            <button ion-button (click)="viewCtrl.dismiss('THROW_CHANGES')" color="secondary">Änderungen verwerfen</button>
            <button ion-button (click)="viewCtrl.dismiss('KEEP_WORKING')" color="secondary">Weiter bearbeiten</button>
        </div>`
})
export class DialogCancelEditComponent {
    @HostBinding('class') classes = 'pef-dialog';

    constructor(public viewCtrl: ViewController) { }
}

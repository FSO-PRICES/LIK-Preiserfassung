import { Component, HostBinding, EventEmitter, OnDestroy } from '@angular/core';
import { ViewController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
    selector: 'dialog-choose-percentage-reduction',
    template: `
        <div class="percentage-button-row first-row">
            <button ion-button color="mercury" (click)="quickSelect$.emit(10)">10%</button>
            <button ion-button color="mercury" (click)="quickSelect$.emit(20)">20%</button>
            <button ion-button color="mercury" (click)="quickSelect$.emit(30)">30%</button>
            <button ion-button color="mercury" (click)="quickSelect$.emit(40)">40%</button>
            <button ion-button color="mercury" (click)="quickSelect$.emit(50)">50%</button>
            <button ion-button color="mercury" (click)="quickSelect$.emit(60)">60%</button>
            <button ion-button color="mercury" (click)="quickSelect$.emit(70)">70%</button>
            <button ion-button color="mercury" (click)="quickSelect$.emit(80)">80%</button>
            <button ion-button color="mercury" (click)="quickSelect$.emit(90)">90%</button>
        </div>
        <div class="percentage-button-row second-row">
            <button ion-button color="mercury" (click)="quickSelect$.emit(5)">5%</button>
            <button ion-button color="mercury" (click)="quickSelect$.emit(15)">15%</button>
            <button ion-button color="mercury" (click)="quickSelect$.emit(25)">25%</button>
            <button ion-button color="mercury" (click)="quickSelect$.emit(35)">35%</button>
            <button ion-button color="mercury" (click)="quickSelect$.emit(45)">45%</button>
            <button ion-button color="mercury" (click)="quickSelect$.emit(55)">55%</button>
            <button ion-button color="mercury" (click)="quickSelect$.emit(65)">65%</button>
            <button ion-button color="mercury" (click)="quickSelect$.emit(75)">75%</button>
            <button ion-button color="mercury" (click)="quickSelect$.emit(85)">85%</button>
        </div>
        <div class="separator"></div>
        <div class="input-row">
            <form [formGroup]="form">
                <ion-item class="pef-item">
                    <ion-label>Prozent-Aktion</ion-label>
                    <ion-input
                        type="number"
                        formControlName="percentage"
                        min="0.00" step="0.01"
                        pef-highlight-on-focus
                        pef-disable-input-number-behaviour
                        pef-disable-input-negative-number></ion-input>
                </ion-item>
            </form>
        </div>
        <div class="pef-dialog-button-row">
            <button ion-button [disabled]="!(isValid$ | async)" (click)="okClicked$.emit()" color="primary">OK</button>
            <button ion-button (click)="viewCtrl.dismiss({ type: 'CANCEL' })" color="secondary">Abbrechen</button>
        </div>`
})
export class DialogChoosePercentageReductionComponent implements OnDestroy {
    @HostBinding('class') classes = 'pef-dialog';

    public okClicked$ = new EventEmitter();
    public quickSelect$ = new EventEmitter<number>();
    public isValid$: Observable<boolean>;

    form: FormGroup;

    private subscription: Subscription;

    constructor(public viewCtrl: ViewController, formBuilder: FormBuilder) {
        this.form = formBuilder.group({ percentage: [''] });

        this.isValid$ = this.form.valueChanges
            .map(x => x.percentage)
            .map(x => !!x && !isNaN(+x) && +x > 0 && +x < 100)
            .startWith(false);

        this.subscription = this.okClicked$.map(() => this.form.value.percentage)
            .merge(this.quickSelect$)
            .subscribe(percentage => viewCtrl.dismiss({ type: 'OK', percentage }));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

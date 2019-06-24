import { Component, EventEmitter, HostBinding, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';
import { map, merge, startWith } from 'rxjs/operators';

@Component({
    selector: 'dialog-choose-percentage-reduction',
    template: `
        <div class="percentage-button-row first-row">
            <ion-button color="mercury" (click)="quickSelect$.emit(10)">10%</ion-button>
            <ion-button color="mercury" (click)="quickSelect$.emit(20)">20%</ion-button>
            <ion-button color="mercury" (click)="quickSelect$.emit(30)">30%</ion-button>
            <ion-button color="mercury" (click)="quickSelect$.emit(40)">40%</ion-button>
            <ion-button color="mercury" (click)="quickSelect$.emit(50)">50%</ion-button>
            <ion-button color="mercury" (click)="quickSelect$.emit(60)">60%</ion-button>
            <ion-button color="mercury" (click)="quickSelect$.emit(70)">70%</ion-button>
            <ion-button color="mercury" (click)="quickSelect$.emit(80)">80%</ion-button>
            <ion-button color="mercury" (click)="quickSelect$.emit(90)">90%</ion-button>
        </div>
        <div class="percentage-button-row second-row">
            <ion-button color="mercury" (click)="quickSelect$.emit(5)">5%</ion-button>
            <ion-button color="mercury" (click)="quickSelect$.emit(15)">15%</ion-button>
            <ion-button color="mercury" (click)="quickSelect$.emit(25)">25%</ion-button>
            <ion-button color="mercury" (click)="quickSelect$.emit(35)">35%</ion-button>
            <ion-button color="mercury" (click)="quickSelect$.emit(45)">45%</ion-button>
            <ion-button color="mercury" (click)="quickSelect$.emit(55)">55%</ion-button>
            <ion-button color="mercury" (click)="quickSelect$.emit(65)">65%</ion-button>
            <ion-button color="mercury" (click)="quickSelect$.emit(75)">75%</ion-button>
            <ion-button color="mercury" (click)="quickSelect$.emit(85)">85%</ion-button>
        </div>
        <div class="separator"></div>
        <div class="input-row">
            <form [formGroup]="form">
                <ion-item class="pef-item">
                    <ion-label>Prozent-Aktion</ion-label>
                    <ion-input
                        type="number"
                        formControlName="percentage"
                        min="0.00"
                        step="0.01"
                        pef-highlight-on-focus
                        pef-disable-input-number-behaviour
                        pef-disable-input-negative-number
                    ></ion-input>
                </ion-item>
            </form>
        </div>
        <div class="pef-dialog-button-row">
            <ion-button [disabled]="!(isValid$ | async)" (click)="okClicked$.emit()" color="primary">OK</ion-button>
            <ion-button (click)="viewCtrl.dismiss({ type: 'CANCEL' })" color="secondary">Abbrechen</ion-button>
        </div>
    `,
})
export class DialogChoosePercentageReductionComponent implements OnDestroy {
    @HostBinding('class') classes = 'pef-dialog';

    public okClicked$ = new EventEmitter();
    public quickSelect$ = new EventEmitter<number>();
    public isValid$: Observable<boolean>;

    form: FormGroup;

    private subscription: Subscription;

    constructor(public viewCtrl: ModalController, formBuilder: FormBuilder) {
        this.form = formBuilder.group({ percentage: [''] });

        this.isValid$ = this.form.valueChanges.pipe(
            map(x => x.percentage),
            map(x => !!x && !isNaN(+x) && +x > 0 && +x < 100),
            startWith(false),
        );

        this.subscription = this.okClicked$
            .pipe(
                map(() => this.form.value.percentage),
                merge(this.quickSelect$),
            )
            .subscribe(percentage => viewCtrl.dismiss({ type: 'OK', percentage }));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

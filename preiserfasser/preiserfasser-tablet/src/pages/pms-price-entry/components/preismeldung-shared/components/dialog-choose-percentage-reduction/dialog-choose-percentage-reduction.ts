import { Component, HostBinding, EventEmitter, OnDestroy } from '@angular/core';
import { ViewController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
    selector: 'dialog-choose-percentage-reduction',
    templateUrl: 'dialog-choose-percentage-reduction.html'
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

import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChange } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

import { ReactiveComponent, Models as P } from 'lik-shared';

import { CurrentPreiserheber } from '../../../../reducers/preiserheber';

@Component({
    selector: 'preiserheber-detail',
    templateUrl: 'preiserheber-detail.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreiserheberDetailComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preiserheber: P.Erheber;
    @Output('save')
    public save$: Observable<P.Erheber>;
    @Output('cancel')
    public cancelClicked$ = new EventEmitter<Event>();
    @Output('update')
    public update$: Observable<P.Erheber>;

    public isEditing$: Observable<boolean>;
    public showValidationHints$: Observable<boolean>;
    public preiserheber$: Observable<P.Erheber>;
    public resetForm$: Observable<boolean>;
    public saveClicked$ = new EventEmitter<Event>();

    private subscriptions: Subscription[];

    public form: FormGroup;

    constructor(private formBuilder: FormBuilder) {
        super();

        this.preiserheber$ = this.observePropertyCurrentValue<P.Erheber>('preiserheber');

        this.form = formBuilder.group({
            preiserheber: formBuilder.group({
                _id: [null, Validators.compose([Validators.required, Validators.minLength(3)])],
                firstName: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
                surname: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
                personFunction: [null, Validators.required],
                languageCode: [null, Validators.required],
                telephone: [null],
                email: [null]
            }),
            password: [null, Validators.required]
        });

        const distinctPreiserheber$ = this.preiserheber$
            .distinctUntilKeyChanged('_id');

        this.update$ = this.getPreiserheberForm().valueChanges
            .map(() => this.getPreiserheberForm().value);

        const canSave$ = this.saveClicked$
            .map(x => ({ isValid: this.getPreiserheberForm().valid }))
            .publishReplay(1).refCount();

        this.save$ = canSave$.filter(x => x.isValid)
            .publishReplay(1).refCount()
            .withLatestFrom(this.saveClicked$)
            .map(x => this.form.get('password').value);

        this.showValidationHints$ = canSave$.distinctUntilChanged().mapTo(true)
            .merge(distinctPreiserheber$.mapTo(false));

        this.isEditing$ = this.preiserheber$.map(x => !!x && !!x._rev)
            .publishReplay(1).refCount();

        this.subscriptions = [
            distinctPreiserheber$
                .subscribe((erheber: CurrentPreiserheber) => {
                    this.form.markAsUntouched();
                    this.form.markAsPristine();
                    this.getPreiserheberForm().patchValue({
                        _id: erheber.isNew ? null : erheber._id,
                        firstName: erheber.firstName,
                        surname: erheber.surname,
                        personFunction: erheber.personFunction,
                        languageCode: erheber.languageCode,
                        telephone: erheber.telephone,
                        email: erheber.email
                    }, { emitEvent: false });
                })
        ];
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    public ngOnDestroy() {
        if (!this.subscriptions || this.subscriptions.length === 0) return;
        this.subscriptions.map(s => !s.closed ? s.unsubscribe() : null);
    }

    public getPreiserheberForm() {
        return this.form.get('preiserheber');
    }

    public hasChanges() {
        return this.preiserheber$.map((x: CurrentPreiserheber) => !!x && x.isModified || (!!x && !!x._id));
    }
}

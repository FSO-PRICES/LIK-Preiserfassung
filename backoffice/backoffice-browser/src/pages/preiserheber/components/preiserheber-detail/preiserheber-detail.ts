import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChange } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ReactiveComponent, Models as P } from 'lik-shared';
import { CurrentPreiserheber } from '../../../../reducers/preiserheber';

@Component({
    selector: 'preiserheber-detail',
    templateUrl: 'preiserheber-detail.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreiserheberDetailComponent extends ReactiveComponent implements OnChanges {
    @Input() preiserheber: P.Erheber;
    @Input() resetForm: boolean;
    @Output('save')
    public save$ = new EventEmitter();
    @Output('clear')
    public clear$ = new EventEmitter();
    @Output('update')
    public update$ = new EventEmitter<P.Erheber>();

    public isEditing$: Observable<boolean>;
    public preiserheber$: Observable<P.Erheber>;
    public resetForm$: Observable<boolean>;
    public clearClicked$ = new EventEmitter<Event>();
    public saveClicked$ = new EventEmitter<Event>();

    public form: FormGroup;

    constructor(private formBuilder: FormBuilder) {
        super();

        this.preiserheber$ = this.observePropertyCurrentValue<P.Erheber>('preiserheber');
        this.resetForm$ = this.observePropertyCurrentValue<boolean>('resetForm');

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
            .filter(x => !!x);

        let formValueChangedSubscription = Observable.empty().subscribe();

        const createValueChangedSubscription = () => {
            formValueChangedSubscription.unsubscribe();
            formValueChangedSubscription = this.getPreiserheberForm().valueChanges
                .skip(1)
                .subscribe(x => {
                    this.update$.emit(this.getPreiserheberForm().value);
                });
        };

        distinctPreiserheber$.startWith((<any>{}))
            .subscribe(erheber => {
                createValueChangedSubscription();
                this.getPreiserheberForm().patchValue({
                    _id: erheber._id,
                    firstName: erheber.firstName,
                    surname: erheber.surname,
                    personFunction: erheber.personFunction,
                    languageCode: erheber.languageCode,
                    telephone: erheber.telephone,
                    email: erheber.email
                });
            });


        const canSave$ = this.saveClicked$
            .map(x => ({ isValid: this.getPreiserheberForm().valid }))
            .publishReplay(1).refCount();

        canSave$.filter(x => x.isValid)
            .publishReplay(1).refCount()
            .withLatestFrom(this.saveClicked$)
            .subscribe(x => this.save$.emit(this.form.get('password').value));

        this.clearClicked$.subscribe(x => this.clear$.emit());

        this.resetForm$.subscribe(reset => {
            this.form.get('password').reset();
            this.form.markAsPristine();
        });

        this.isEditing$ = this.preiserheber$.map(x => !!x && !!x._rev)
            .publishReplay(1).refCount();

        this.isEditing$
            .publishReplay(1).refCount()
            .subscribe(editing => {
                const idField = this.getPreiserheberForm().get('_id');
                editing ? idField.disable({ onlySelf: true, emitEvent: false }) : idField.enable({ onlySelf: true, emitEvent: false });
            });
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    public getPreiserheberForm() {
        return this.form.get('preiserheber');
    }

    public isFormValidAndPristine() {
        return this.isEditing$.map(editing => {
            return !this.getPreiserheberForm().valid || this.getPreiserheberForm().pristine || (!editing && !this.form.get('password').valid);
        });
    }

    public hasChanges() {
        return this.preiserheber$.map((x: CurrentPreiserheber) => !!x && x.isModified || (!!x && !!x._id));
    }
}

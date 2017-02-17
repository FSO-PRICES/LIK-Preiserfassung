import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChange } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ReactiveComponent, Models as P } from 'lik-shared';

@Component({
    selector: 'preiserheber-detail',
    templateUrl: 'preiserheber-detail.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreiserheberDetailComponent extends ReactiveComponent implements OnChanges {
    @Input() preiserheber: P.Erheber;
    @Output('save')
    public save$ = new EventEmitter();
    @Output('clear')
    public clear$ = new EventEmitter();
    @Output('update')
    public update$ = new EventEmitter<P.Erheber>();

    public preiserheber$: Observable<P.Erheber>;
    public clearClicked$ = new EventEmitter<Event>();
    public saveClicked$ = new EventEmitter<Event>();

    public form: FormGroup;

    constructor(private formBuilder: FormBuilder) {
        super();

        this.preiserheber$ = this.observePropertyCurrentValue<P.Erheber>('preiserheber');

        this.form = formBuilder.group({
            firstName: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
            surname: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
            personFunction: [null, Validators.required],
            languageCode: ['de', Validators.required],
            telephone: [null],
            email: [null]
        });

        const distinctPreiserheber$ = this.preiserheber$
            .filter(x => !!x)
            .distinctUntilKeyChanged('_id');

        distinctPreiserheber$
            .subscribe(erheber => {
                this.form.patchValue({
                    id: erheber._id,
                    firstName: erheber.firstName,
                    surname: erheber.surname,
                    personFunction: erheber.personFunction,
                    languageCode: erheber.languageCode,
                    telephone: erheber.telephone,
                    email: erheber.email
                });
            });

        this.form.valueChanges
            .subscribe(x => this.update$.emit(this.form.value));

        const canSave$ = this.saveClicked$
            .map(x => ({ isValid: this.form.valid }))
            .publishReplay(1).refCount();

        canSave$.filter(x => x.isValid)
            .publishReplay(1).refCount()
            .withLatestFrom(this.saveClicked$)
            .subscribe(x => this.save$.emit());

        this.clearClicked$.subscribe(x => this.clear$.emit());
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    public isEditing() {
        return this.preiserheber$.map(x => !!x && !!x._id);
    }
}

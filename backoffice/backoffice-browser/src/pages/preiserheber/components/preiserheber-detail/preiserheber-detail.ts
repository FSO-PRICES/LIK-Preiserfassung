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
    @Input() languages: P.Language[];
    @Output('save')
    public save$: Observable<P.Erheber>;
    @Output('delete')
    public delete$: Observable<string>;
    @Output('cancel')
    public cancelClicked$ = new EventEmitter<Event>();
    @Output('update')
    public update$: Observable<P.Erheber>;

    public preiserheber$: Observable<P.Erheber>;
    public languages$: Observable<P.Language[]>;
    public resetForm$: Observable<boolean>;
    public saveClicked$ = new EventEmitter<Event>();
    public deleteClicked$ = new EventEmitter<Event>();

    public isEditing$: Observable<boolean>;
    public showValidationHints$: Observable<boolean>;

    private subscriptions: Subscription[];
    public form: FormGroup;

    constructor(private formBuilder: FormBuilder) {
        super();

        this.preiserheber$ = this.observePropertyCurrentValue<P.Erheber>('preiserheber');
        this.languages$ = this.observePropertyCurrentValue<P.Language[]>('languages');

        this.form = formBuilder.group({
            preiserheber: formBuilder.group({
                username: [null, Validators.compose([Validators.required, Validators.pattern(/^[a-z][a-z0-9_,\$\+\-]{2,}/), Validators.minLength(3)])],
                firstName: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
                surname: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
                personFunction: [null, Validators.required],
                languageCode: [null],
                telephone: [null],
                email: [null],
            }),
            password: [null, Validators.required]
        });

        const distinctPreiserheber$ = this.preiserheber$
            .distinctUntilKeyChanged('_id');

        this.update$ = this.getPreiserheberForm().valueChanges
            .map(() => {
                const erheber = this.getPreiserheberForm().value;
                return <P.Erheber>{
                    _id: erheber.username,
                    firstName: erheber.firstName,
                    surname: erheber.surname,
                    personFunction: erheber.personFunction,
                    languageCode: erheber.languageCode === '' ? null : erheber.languageCode,
                    telephone: erheber.telephone,
                    email: erheber.email
                };
            })
            .publishReplay(1).refCount();

        const canSave$ = this.saveClicked$
            .map(x => this.getPreiserheberForm().valid)
            .publishReplay(1).refCount();

        this.save$ = canSave$.filter(isValid => isValid)
            .publishReplay(1).refCount()
            .map(x => this.form.get('password').value);

        this.showValidationHints$ = canSave$.distinctUntilChanged().mapTo(true)
            .merge(distinctPreiserheber$.mapTo(false));

        this.isEditing$ = this.preiserheber$.map(x => !!x && !!x._rev)
            .publishReplay(1).refCount();

        const canDelete$ = this.deleteClicked$
            .withLatestFrom(this.isEditing$, (_, isEditing) => isEditing)
            .publishReplay(1).refCount();

        this.delete$ = canDelete$.filter(isEditing => isEditing)
            .publishReplay(1).refCount()
            .map(x => this.form.get('password').value);

        this.subscriptions = [
            distinctPreiserheber$
                .subscribe((erheber: CurrentPreiserheber) => {
                    this.form.markAsUntouched();
                    this.form.markAsPristine();
                    this.getPreiserheberForm().patchValue({
                        username: erheber._id,
                        firstName: erheber.firstName,
                        surname: erheber.surname,
                        personFunction: erheber.personFunction,
                        languageCode: erheber.languageCode !== null ? erheber.languageCode : '',
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

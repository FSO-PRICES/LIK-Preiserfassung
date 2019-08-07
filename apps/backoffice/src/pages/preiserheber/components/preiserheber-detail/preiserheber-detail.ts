import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChange,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import {
    distinctUntilChanged,
    distinctUntilKeyChanged,
    filter,
    map,
    mapTo,
    merge,
    publishReplay,
    refCount,
} from 'rxjs/operators';

import { Models as P, ReactiveComponent } from '@lik-shared';

import { CurrentPreiserheber } from '../../../../reducers/preiserheber';

@Component({
    selector: 'preiserheber-detail',
    templateUrl: 'preiserheber-detail.html',
    styleUrls: ['preiserheber-detail.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreiserheberDetailComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preiserheber: P.Erheber;
    @Input() languages: P.Language[];
    @Input() erhebungsregionen: string[];
    @Input() preissubsysteme: P.Preissubsystem[];

    @Output('save') public save$: Observable<P.Erheber>;
    @Output('cancel') public cancelClicked$ = new EventEmitter<Event>();
    @Output('resetPassword') public resetPasswordClicked$ = new EventEmitter<Event>();
    @Output('update') public update$: Observable<P.Erheber>;

    public preiserheber$: Observable<P.Erheber>;
    public languages$: Observable<P.Language[]>;
    public erhebungsregionen$: Observable<string[]>;

    public resetForm$: Observable<boolean>;
    public saveClicked$ = new EventEmitter<Event>();
    public isEditing$: Observable<boolean>;
    public showValidationHints$: Observable<boolean>;

    private subscriptions: Subscription[] = [];
    public form: FormGroup;

    constructor(formBuilder: FormBuilder) {
        super();

        this.preiserheber$ = this.observePropertyCurrentValue<P.Erheber>('preiserheber');
        this.languages$ = this.observePropertyCurrentValue<P.Language[]>('languages');
        this.erhebungsregionen$ = this.observePropertyCurrentValue<string[]>('erhebungsregionen');

        this.form = formBuilder.group({
            preiserheber: formBuilder.group({
                username: [
                    null,
                    Validators.compose([
                        Validators.required,
                        Validators.pattern(/^[a-z][a-z0-9_,\$\+\-]{2,}/),
                        Validators.minLength(3),
                    ]),
                ],
                firstName: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
                surname: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
                erhebungsregion: [null, Validators.required],
                telephone: [null],
                mobilephone: [null],
                email: [null],
                fax: [null],
                webseite: [null],
                languageCode: [null, Validators.required],
                street: [null],
                postcode: [null],
                town: [null],
            }),
            password: [null, Validators.compose([Validators.required, Validators.maxLength(35)])],
        });

        const distinctPreiserheber$ = this.preiserheber$.pipe(distinctUntilKeyChanged('_id'));

        this.update$ = this.getPreiserheberForm().valueChanges.pipe(
            map(() => {
                const erheber = this.getPreiserheberForm().value;
                return <P.Erheber>{
                    _id: erheber.username,
                    firstName: erheber.firstName,
                    surname: erheber.surname,
                    username: erheber.username,
                    erhebungsregion: erheber.erhebungsregion,
                    languageCode: erheber.languageCode === '' ? null : erheber.languageCode,
                    telephone: erheber.telephone,
                    mobilephone: erheber.mobilephone,
                    email: erheber.email,
                    fax: erheber.fax,
                    webseite: erheber.webseite,
                    street: erheber.street,
                    postcode: erheber.postcode,
                    town: erheber.town,
                };
            }),
            publishReplay(1),
            refCount(),
        );

        const canSave$ = this.saveClicked$.pipe(
            map(x => this.getPreiserheberForm().valid),
            publishReplay(1),
            refCount(),
        );

        this.save$ = canSave$.pipe(
            filter(isValid => isValid),
            publishReplay(1),
            refCount(),
            map(x => this.form.get('password').value),
        );

        this.showValidationHints$ = canSave$.pipe(
            distinctUntilChanged(),
            mapTo(true),
            merge(distinctPreiserheber$.pipe(mapTo(false))),
        );

        this.isEditing$ = this.preiserheber$.pipe(
            map(x => !!x && !!x._rev),
            publishReplay(1),
            refCount(),
        );

        this.subscriptions = [
            distinctPreiserheber$.subscribe((erheber: CurrentPreiserheber) => {
                this.form.markAsUntouched();
                this.form.markAsPristine();
                this.form.get('password').patchValue(null);
                this.getPreiserheberForm().patchValue(
                    {
                        username: erheber._id,
                        firstName: erheber.firstName,
                        surname: erheber.surname,
                        erhebungsregion: erheber.erhebungsregion,
                        telephone: erheber.telephone,
                        mobilephone: erheber.mobilephone,
                        email: erheber.email,
                        fax: erheber.fax,
                        webseite: erheber.webseite,
                        languageCode: erheber.languageCode !== null ? erheber.languageCode : '',
                        street: erheber.street,
                        postcode: erheber.postcode,
                        town: erheber.town,
                    },
                    { emitEvent: false },
                );
            }),
        ];
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    public getPreiserheberForm() {
        return this.form.get('preiserheber');
    }

    public hasChanges() {
        return this.preiserheber$.pipe(map((x: CurrentPreiserheber) => (!!x && x.isModified) || (!!x && !!x._id)));
    }
}

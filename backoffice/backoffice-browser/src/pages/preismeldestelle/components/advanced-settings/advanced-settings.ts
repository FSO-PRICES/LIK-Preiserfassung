import { OnChanges, ChangeDetectionStrategy, Component, Input, Output, EventEmitter, SimpleChange } from '@angular/core';
import { ReactiveComponent, Models as P } from 'lik-shared';
import { Observable } from 'rxjs';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as _ from 'lodash';

@Component({
    selector: 'advanced-settings',
    templateUrl: 'advanced-settings.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdvancedSettingsComponent extends ReactiveComponent implements OnChanges {
    @Input() settings: P.AdvancedPresimeldestelleProperties;
    @Output('update')
    public update$ = new EventEmitter<P.AdvancedPresimeldestelleProperties>();
    @Output('isValid')
    public isValid$ = new EventEmitter<boolean>();

    public advancedSettings$: Observable<P.AdvancedPresimeldestelleProperties>;

    public form: FormGroup;

    constructor(private formBuilder: FormBuilder) {
        super();

        this.advancedSettings$ = this.observePropertyCurrentValue<P.AdvancedPresimeldestelleProperties>('settings');

        this.form = formBuilder.group({
            kontaktpersons: formBuilder.array(_.range(2).map(() => this.initKontaktpersonGroup())),
            erhebungsart: [null],
            erhebungshaeufigkeit: [null],
            erhebungsartComment: [null]
        });

        const distinctAdvancedSettings$ = this.advancedSettings$
            .filter(x => !!x)
            .distinctUntilChanged();

        distinctAdvancedSettings$
            .subscribe(setting => {
                this.form.patchValue({
                    kontaktpersons: this.getKontaktPersonMapping(setting.kontaktpersons),
                    erhebungsart: setting.erhebungsart,
                    erhebungshaeufigkeit: setting.erhebungshaeufigkeit,
                    erhebungsartComment: setting.erhebungsartComment
                });
            });

        this.form.valueChanges
            .subscribe(x => {
                this.update$.emit(this.form.value);
                this.isValid$.emit(this.form.valid);
            });
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    private initKontaktpersonGroup() {
        return this.formBuilder.group({
            firstName: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
            surname: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
            personFunction: [null, Validators.required],
            languageCode: ['de', Validators.required],
            telephone: [null],
            mobile: [null],
            fax: [null],
            email: [null]
        })
    }

    private getKontaktPersonMapping(kontaktpersons: P.KontaktPerson[]) {
        return kontaktpersons.map(x => ({
            firstName: x.firstName,
            surname: x.surname,
            personFunction: x.personFunction,
            languageCode: x.languageCode,
            telephone: x.telephone,
            email: x.email
        }))
    }
}

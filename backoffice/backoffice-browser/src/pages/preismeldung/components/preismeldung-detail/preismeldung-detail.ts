import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

import { ReactiveComponent, Models as P } from 'lik-shared';

import { CurrentPreismeldung } from '../../../../reducers/preismeldung';


@Component({
    selector: 'preismeldung-detail',
    templateUrl: 'preismeldung-detail.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldungDetailComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preismeldung: P.Preismeldung;
    @Output('save')
    public save$: Observable<{ isValid: boolean }>;
    @Output('cancel')
    public cancelClicked$ = new EventEmitter<Event>();
    @Output('update')
    public update$: Observable<P.Preismeldung>;

    public preismeldung$: Observable<P.Preismeldung>;
    public saveClicked$ = new EventEmitter<Event>();

    public isEditing$: Observable<boolean>;
    public showValidationHints$: Observable<boolean>;

    private subscriptions: Subscription[];

    public form: FormGroup;

    constructor(private formBuilder: FormBuilder) {
        super();

        this.preismeldung$ = this.observePropertyCurrentValue<P.Preismeldung>('preismeldung')
            .publishReplay().refCount();

        this.form = formBuilder.group({
            bermerkungenAnsBfs: [null],
            aktion: [{ value: false, disabled: true }],
            istAbgebucht: [{ value: false, disabled: true }]
        });

        this.update$ = this.form.valueChanges
            .map(() => this.form.value);

        const distinctPreismeldung$ = this.preismeldung$
            .distinctUntilKeyChanged('_id');

        const canSave$ = this.saveClicked$
            .map(() => ({ isValid: this.form.valid }))
            .publishReplay(1).refCount();

        this.save$ = canSave$.filter(x => x.isValid)
            .publishReplay(1).refCount();

        this.showValidationHints$ = canSave$.distinctUntilChanged().mapTo(true)
            .merge(distinctPreismeldung$.mapTo(false));

        this.isEditing$ = this.preismeldung$
            .map((x: CurrentPreismeldung) => !!x && (!!x.isModified || !!x._id))
            .publishReplay(1).refCount();

        this.subscriptions = [
            distinctPreismeldung$
                .subscribe((preismeldung: CurrentPreismeldung) => {
                    this.form.markAsUntouched();
                    this.form.markAsPristine();
                    this.form.patchValue({
                        bemerkungen: preismeldung.bemerkungen,
                        aktion: preismeldung.aktion,
                        istAbgebucht: preismeldung.istAbgebucht,
                    }, { onlySelf: true, emitEvent: false });
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
}

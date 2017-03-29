import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

import { ReactiveComponent, Models as P } from 'lik-shared';
import { CurrentRegion } from '../../../../reducers/region';

@Component({
    selector: 'region-detail',
    templateUrl: 'region-detail.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegionDetailComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() region: P.Region;
    @Output('save')
    public save$: Observable<{ isValid: boolean }>;
    @Output('cancel')
    public cancelClicked$ = new EventEmitter<Event>();
    @Output('update')
    public update$: Observable<P.Region>;

    public region$: Observable<P.Region>;
    public saveClicked$ = new EventEmitter<boolean>();

    public isEditing$: Observable<boolean>;
    public showValidationHints$: Observable<boolean>;

    private subscriptions: Subscription[];

    public form: FormGroup;

    constructor(private formBuilder: FormBuilder) {
        super();

        this.region$ = this.observePropertyCurrentValue<P.Region>('region')
            .publishReplay(1).refCount();

        this.form = formBuilder.group({
            name: [null, Validators.required]
        });

        this.update$ = this.form.valueChanges
            .map(() => this.form.value);

        const distinctRegion$ = this.region$
            .distinctUntilKeyChanged('_id')
            .publishReplay(1).refCount();

        const canSave$ = this.saveClicked$
            .map(createNew => ({ isValid: this.form.valid }))
            .publishReplay(1).refCount();

        this.save$ = canSave$.filter(x => x.isValid)
            .publishReplay(1).refCount();

        this.showValidationHints$ = canSave$.distinctUntilChanged().mapTo(true)
            .merge(distinctRegion$.mapTo(false));

        this.isEditing$ = this.region$
            .map((x: CurrentRegion) => !!x && !!x._rev)
            .publishReplay(1).refCount();

        this.subscriptions = [
            distinctRegion$
                .subscribe((region: CurrentRegion) => {
                    this.form.markAsUntouched();
                    this.form.markAsPristine();
                    this.form.patchValue(<P.Region>{
                        name: region.name,
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

import { Component, Input, OnChanges, SimpleChange, ChangeDetectionStrategy, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { ReactiveComponent } from 'lik-shared';

import * as P from '../../../../../common-models';
import { Observable } from 'rxjs';

@Component({
    selector: 'preismeldung-messages',
    templateUrl: 'preismeldung-messages.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldungMessagesComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.Models.Preismeldung;
    @Input() priceCountStatus: P.PriceCountStatus;

    public preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');

    public onBlur$ = new EventEmitter();
    public notizClear$ = new EventEmitter();
    public kommentarClear$ = new EventEmitter();
    public erledigtDisabled$: Observable<boolean>;
    public erledigt$ = new EventEmitter();

    form: FormGroup;

    constructor(formBuilder: FormBuilder) {
        super();

        this.form = formBuilder.group({
            notiz: [''],
            kommentar: [''],
            bemerkungen: ['']
        });

        this.notizClear$.subscribe(() => { this.form.patchValue({ notiz: '' }); this.onBlur$.emit(); });
        this.kommentarClear$.subscribe(() => { this.form.patchValue({ kommentar: '' }); this.onBlur$.emit(); });
        this.erledigt$.subscribe(() => { this.form.patchValue({ bemerkungen: this.form.value['bemerkungen'] + '\n@OK' }); this.onBlur$.emit(); });

        this.erledigtDisabled$ = this.form.valueChanges.map(x => x.bemerkungen.endsWith('@OK')).startWith(false);

        this.onBlur$
            .withLatestFrom(this.form.valueChanges.startWith({ notiz: '', kommentar: '', bemerkungen: '' }), (_, formValue) => formValue)
            .debounceTime(100)
            .map(x => ({ notiz: x.notiz.replace('\n', '¶'), kommentar: x.kommentar.replace('\n', '¶'), bemerkungen: x.bemerkungen.replace('\n', '¶') }))
            .subscribe(x => console.log('change', x));
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}

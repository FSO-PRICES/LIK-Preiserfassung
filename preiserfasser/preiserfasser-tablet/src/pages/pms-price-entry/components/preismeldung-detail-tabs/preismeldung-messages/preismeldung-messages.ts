import { Component, Input, OnChanges, SimpleChange, ChangeDetectionStrategy, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { ReactiveComponent } from 'lik-shared';

import * as P from '../../../../../common-models';
import { Observable } from 'rxjs';
import { PreismeldungMessagesPayload } from '../../../../../actions/preismeldungen';

@Component({
    selector: 'preismeldung-messages',
    templateUrl: 'preismeldung-messages.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldungMessagesComponent extends ReactiveComponent implements OnChanges {
    @Input() isActive: boolean;
    @Input() preismeldung: P.CurrentPreismeldungBag;
    @Input() priceCountStatus: P.PriceCountStatus;
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Output('preismeldungMessagesPayload') preismeldungMessagesPayload$: Observable<P.PreismeldungMessagesPayload>;

    public isActive$ = this.observePropertyCurrentValue<boolean>('isActive');
    public preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>('preismeldung').publishReplay(1).refCount();
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    public preismeldestelle$ = this.observePropertyCurrentValue<P.PriceCountStatus>('preismeldestelle');

    public bemerkungenHistory$: Observable<{ author: string, text: string }[]>;

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

        const distinctPreismeldung$ = this.preismeldung$
            .filter(x => !!x)
            .distinctUntilKeyChanged('pmId')
            .merge(this.isActive$.filter(x => x).flatMap(() => Observable.defer(() => this.preismeldung$.filter(x => !!x).take(1))))
            .publishReplay(1).refCount();

        this.bemerkungenHistory$ = distinctPreismeldung$
            .map(x => {
                const splitted = x.messages.bemerkungenHistory.split('\\n').map(y => {
                    if (y.startsWith('PE:')) return { author: 'PE', text: y.substring(3) };
                    if (y.startsWith('BFS:')) return { author: 'BFS', text: y.substring(4) };
                    return { author: null, text: y };
                });
                return splitted.length === 1 && !x.messages.bemerkungenHistory ? null : splitted;
            })
            .publishReplay(1).refCount();

        distinctPreismeldung$
            .subscribe(bag => {
                this.form.reset({
                    notiz: bag.messages.notiz,
                    kommentar: bag.messages.kommentar,
                    bemerkungen: bag.messages.bemerkungen.replace('¶', '\n'),
                });
            });

        this.notizClear$.subscribe(() => { this.form.patchValue({ notiz: '' }); this.onBlur$.emit(); });
        this.kommentarClear$.subscribe(() => { this.form.patchValue({ kommentar: '' }); this.onBlur$.emit(); });
        this.erledigt$.subscribe(() => {
            let bemerkungen = this.form.value['bemerkungen'];
            bemerkungen = !!bemerkungen ? bemerkungen + '\n' : bemerkungen;
            bemerkungen += '@OK';
            this.form.patchValue({ bemerkungen });
            this.onBlur$.emit();
        });

        this.erledigtDisabled$ = this.form.valueChanges.map(x => x.bemerkungen.endsWith('@OK')).startWith(false);

        this.preismeldungMessagesPayload$ = this.onBlur$
            .withLatestFrom(this.form.valueChanges.startWith({ notiz: '', kommentar: '', bemerkungen: '' }), (_, formValue) => formValue)
            .debounceTime(100)
            .map(x => ({ notiz: x.notiz.replace('\n', '¶'), kommentar: x.kommentar.replace('\n', '¶'), bemerkungen: x.bemerkungen.replace('\n', '¶') }));

    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}

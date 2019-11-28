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
import { FormBuilder, FormGroup } from '@angular/forms';
import { assign } from 'lodash';
import { defer, Observable, Subject } from 'rxjs';
import {
    debounceTime,
    distinctUntilKeyChanged,
    filter,
    flatMap,
    map,
    merge,
    publishReplay,
    refCount,
    share,
    startWith,
    take,
    takeUntil,
    tap,
    withLatestFrom,
} from 'rxjs/operators';

import { ReactiveComponent } from '../../../../common/ReactiveComponent';

import * as P from '../../../models';

@Component({
    selector: 'preismeldung-messages',
    styleUrls: ['./preismeldung-messages.scss'],
    templateUrl: 'preismeldung-messages.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungMessagesComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() isActive: boolean;
    @Input() preismeldung: P.CurrentPreismeldungViewBag;
    @Input() priceCountStatus: P.PriceCountStatus;
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Input() isDesktop: boolean;
    @Input() isAdminApp: boolean;
    @Input() snippets: string[];
    @Output('preismeldungMessagesPayload') preismeldungMessagesPayload$: Observable<P.PreismeldungMessagesPayload>;
    @Output('kommentarClearClicked') kommentarClearClicked$: Observable<{}>;

    public isActive$ = this.observePropertyCurrentValue<boolean>('isActive');
    public preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungViewBag>('preismeldung').pipe(
        publishReplay(1),
        refCount(),
    );
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    public preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle');
    public isDesktop$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('isDesktop');
    public isAdminApp$ = this.observePropertyCurrentValue<boolean>('isAdminApp');

    public isReadonly$: Observable<boolean>;
    public bemerkungenHistory$: Observable<string>;
    public kommentarAutotext$: Observable<{ prefix: string; message: string }[]>;

    public onBlur$ = new EventEmitter();
    public notizClear$ = new EventEmitter();
    public kommentarClear$ = new EventEmitter();
    public bemerkungenClear$ = new EventEmitter();
    public erledigtDisabled$: Observable<boolean>;
    public erledigtButtonDisabled$: Observable<boolean>;
    public erledigt$ = new EventEmitter();
    private onDestroy$ = new Subject();

    form: FormGroup;

    constructor(formBuilder: FormBuilder) {
        super();

        this.form = formBuilder.group({
            messages: formBuilder.group({
                notiz: [''],
                kommentar: [''],
                bemerkungen: [''],
            }),
            snippets: [''],
        });
        const messagesForm = this.form.controls['messages'];
        const snippetsControl = this.form.controls['snippets'];

        const distinctPreismeldung$ = this.preismeldung$.pipe(
            filter(x => !!x),
            distinctUntilKeyChanged('pmId'),
            merge(
                this.isActive$.pipe(
                    filter(x => x),
                    flatMap(() =>
                        defer(() =>
                            this.preismeldung$.pipe(
                                filter(x => !!x),
                                take(1),
                            ),
                        ),
                    ),
                ),
            ),
            publishReplay(1),
            refCount(),
        );

        this.isReadonly$ = distinctPreismeldung$.pipe(
            map(x => x.isReadonly),
            publishReplay(1),
            refCount(),
        );

        this.bemerkungenHistory$ = distinctPreismeldung$.pipe(
            map(x =>
                !!x.refPreismeldung
                    ? !!x.refPreismeldung.bemerkungen
                        ? x.refPreismeldung.bemerkungen.replace(/\\n/g, '<br/>')
                        : ''
                    : '',
            ),
            publishReplay(1),
            refCount(),
        );

        this.kommentarAutotext$ = this.preismeldung$.pipe(
            filter(pm => !!pm),
            map(pm => prepareKommentarAutotext(pm.messages.kommentarAutotext)),
        );

        snippetsControl.valueChanges
            .pipe(
                filter(snippet => snippet !== ''),
                takeUntil(this.onDestroy$),
            )
            .subscribe(snippet => {
                const kommentar = messagesForm.get('kommentar').value;
                messagesForm.patchValue({ kommentar: kommentar + (!!kommentar ? '\n' : '') + snippet });
                snippetsControl.patchValue('', { emitEvent: false });
                this.onBlur$.emit();
            });

        distinctPreismeldung$.pipe(takeUntil(this.onDestroy$)).subscribe(bag => {
            messagesForm.reset({
                notiz: bag.messages.notiz.replace(/\\n/g, '\n'),
                kommentar: bag.messages.kommentar.replace(/\\n/g, '\n'),
                bemerkungen: bag.messages.bemerkungen.replace(/\\n/g, '\n'),
            });
            snippetsControl.patchValue('');
        });

        this.isReadonly$.pipe(takeUntil(this.onDestroy$)).subscribe(readonly => {
            if (readonly) {
                snippetsControl.disable();
            } else {
                snippetsControl.enable();
            }
        });

        const notizClearDone$ = this.notizClear$.pipe(
            tap(() => {
                messagesForm.patchValue({ notiz: '' });
            }),
        );

        const kommentarClearDone$ = this.kommentarClear$.pipe(
            tap(() => {
                messagesForm.patchValue({ kommentar: '' });
            }),
            share(),
        );

        const bemerkungenClearDone$ = this.bemerkungenClear$.pipe(
            tap(() => {
                messagesForm.patchValue({ bemerkungen: '' });
            }),
            share(),
        );

        this.kommentarClearClicked$ = kommentarClearDone$.pipe(merge(bemerkungenClearDone$));

        const erledigtDone$ = this.erledigt$.pipe(
            tap(() => {
                let bemerkungen = messagesForm.value['bemerkungen'];
                bemerkungen = !!bemerkungen ? bemerkungen + '\n' : bemerkungen;
                bemerkungen += '@OK';
                messagesForm.patchValue({ bemerkungen });
            }),
        );

        const buttonActionDone$ = notizClearDone$.pipe(
            merge(kommentarClearDone$, bemerkungenClearDone$, erledigtDone$),
        );

        this.erledigtDisabled$ = messagesForm.valueChanges.pipe(
            map(x => x.bemerkungen.endsWith('@OK')),
            startWith(false),
            withLatestFrom(this.isReadonly$, (disabled, readonly) => disabled || readonly),
        );
        this.erledigtButtonDisabled$ = messagesForm.valueChanges.pipe(
            map(x => !x.bemerkungen),
            merge(distinctPreismeldung$.pipe(map(x => !x.messages.bemerkungen))),
            startWith(true),
        );

        this.preismeldungMessagesPayload$ = this.onBlur$.pipe(
            merge(buttonActionDone$),
            withLatestFrom(
                messagesForm.valueChanges.pipe(startWith({ notiz: '', kommentar: '', bemerkungen: '' })),
                (_, formValue) => formValue,
            ),
            debounceTime(100),
            withLatestFrom(this.isAdminApp$.pipe(startWith(false)), (x, isAdminApp) => assign(x, { isAdminApp })),
            map(x => ({
                notiz: x.notiz.replace(/(?:\r\n|\r|\n)/g, '\\n'),
                kommentar: x.kommentar.replace(/(?:\r\n|\r|\n)/g, '\\n'),
                bemerkungen: x.bemerkungen.replace(/(?:\r\n|\r|\n)/g, '\\n'),
                isAdminApp: x.isAdminApp,
            })),
        );
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.onDestroy$.next();
    }
}

function prepareKommentarAutotext(texte: string[]) {
    return texte.map(text => {
        const [prefix, message] = text.indexOf('Admin: ') === 0 ? [text.slice(0, 7), text.slice(7)] : ['', text];
        return { prefix, message };
    });
}

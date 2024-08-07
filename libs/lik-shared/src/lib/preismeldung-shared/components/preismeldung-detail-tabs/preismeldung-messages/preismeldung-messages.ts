/*
 * LIK-Preiserfassung
 * Copyright (C) 2024 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */
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
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { assign } from 'lodash';
import { Observable, Subject, combineLatest, defer, merge } from 'rxjs';
import {
    distinctUntilChanged,
    distinctUntilKeyChanged,
    filter,
    map,
    mergeMap,
    share,
    shareReplay,
    startWith,
    switchMap,
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
    @Input() isActive!: boolean;
    @Input() preismeldung!: P.CurrentPreismeldungViewBag;
    @Input() priceCountStatus!: P.PriceCountStatus;
    @Input() preismeldestelle!: P.Models.Preismeldestelle;
    @Input() isDesktop!: boolean;
    @Input({ required: true }) isAdminApp!: boolean;
    @Input() snippets!: string[];
    @Input({ required: true }) hasWritePermission!: boolean;
    @Output('preismeldungMessagesPayload') preismeldungMessagesPayload$: Observable<P.PreismeldungMessagesPayload>;
    @Output('kommentarClearClicked') kommentarClearClicked$: Observable<unknown>;
    @Output('saveMessages') saveMessages$: Observable<unknown>;

    public isActive$ = this.observePropertyCurrentValue<boolean>('isActive');
    public preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungViewBag>('preismeldung').pipe(
        shareReplay({ bufferSize: 1, refCount: true }),
    );
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    public preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle');
    public isDesktop$ = this.observePropertyCurrentValue<boolean>('isDesktop');
    public hasWritePermission$ = this.observePropertyCurrentValue<boolean>('hasWritePermission');
    public isAdminApp$ = this.observePropertyCurrentValue<boolean>('isAdminApp');

    public isReadonly$: Observable<boolean>;
    public bemerkungenHistory$: Observable<string>;
    public kommentarAutotext$: Observable<{ prefix: string; message: string }[]>;

    public onNotizSave$ = new EventEmitter();
    public onKommentarSave$ = new EventEmitter();
    public onBemerkungenSave$ = new EventEmitter();
    public clearField$ = new EventEmitter<string>();

    public notizClear$ = new EventEmitter();
    public kommentarClear$ = new EventEmitter();
    public bemerkungenClear$ = new EventEmitter();
    public erledigtDisabled$: Observable<boolean>;
    public erledigtClicked$ = new EventEmitter();
    private onDestroy$ = new Subject<void>();

    public notizModified$: Observable<boolean>;

    public clearNotizDisabled$: Observable<boolean>;
    public kommentarModified$: Observable<boolean>;
    public clearKommentarDisabled$: Observable<boolean>;
    public bemerkungenModified$: Observable<boolean>;
    public clearBemerkungenDisabled$: Observable<boolean>;

    form: UntypedFormGroup;
    messagesForm: AbstractControl;

    constructor(formBuilder: UntypedFormBuilder) {
        super();

        this.form = formBuilder.group({
            messages: formBuilder.group({
                notiz: [''],
                kommentar: [''],
                bemerkungen: [''],
            }),
            snippets: [''],
        });
        this.messagesForm = this.form.controls['messages'];
        const snippetsControl = this.form.controls['snippets'];

        const distinctPreismeldung$ = merge(
            this.preismeldung$.pipe(
                filter((x) => !!x),
                distinctUntilKeyChanged('pmId'),
            ),
            // this.isActive$.pipe(
            //     filter((x) => x),
            //     mergeMap(() =>
            //         defer(() =>
            //             this.preismeldung$.pipe(
            //                 filter((x) => !!x),
            //                 take(1),
            //             ),
            //         ),
            //     ),
            // ),
        ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

        this.isReadonly$ = combineLatest([this.hasWritePermission$, distinctPreismeldung$]).pipe(
            map(([hasWritePermission, pm]) => !hasWritePermission || pm.isReadonly),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.bemerkungenHistory$ = distinctPreismeldung$.pipe(
            map((x) =>
                x.refPreismeldung
                    ? x.refPreismeldung.bemerkungen
                        ? x.refPreismeldung.bemerkungen.replace(/\\n/g, '<br/>')
                        : ''
                    : '',
            ),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.kommentarAutotext$ = this.preismeldung$.pipe(
            filter((pm) => !!pm),
            map((pm) => prepareKommentarAutotext(pm.messages.kommentarAutotext)),
        );

        snippetsControl.valueChanges
            .pipe(
                filter((snippet) => snippet !== ''),
                takeUntil(this.onDestroy$),
            )
            .subscribe((snippet) => {
                const kommentar = this.messagesForm.get('kommentar')?.value ?? '';
                this.messagesForm.patchValue({ kommentar: kommentar + (kommentar ? '\n' : '') + snippet });
                snippetsControl.patchValue('', { emitEvent: false });
            });

        distinctPreismeldung$.pipe(takeUntil(this.onDestroy$)).subscribe((bag) => {
            this.messagesForm.reset(
                {
                    notiz: bag.messages.notiz.replace(/\\n/g, '\n'),
                    kommentar: bag.messages.kommentar.replace(/\\n/g, '\n'),
                    bemerkungen: bag.messages.bemerkungen.replace(/\\n/g, '\n'),
                },
                { emitEvent: false },
            );
            snippetsControl.patchValue('');
        });

        this.isReadonly$.pipe(takeUntil(this.onDestroy$)).subscribe((readonly) => {
            if (readonly) {
                snippetsControl.disable();
            } else {
                snippetsControl.enable();
            }
        });

        this.hasWritePermission$
            .pipe(takeUntil(this.onDestroy$), distinctUntilChanged())
            .subscribe((hasWritePermission) => {
                if (hasWritePermission) {
                    this.form.enable({ emitEvent: false });
                } else {
                    this.form.disable({ emitEvent: false });
                }
            });

        this.clearNotizDisabled$ = merge(
            distinctPreismeldung$.pipe(
                filter((x) => !!x),
                map((x) => {
                    const notiz = x.messages.notiz;
                    return !notiz || notiz === '';
                }),
            ),
            this.messagesForm.valueChanges.pipe(map((x) => !x.notiz || x.notiz === '')),
        );

        this.clearKommentarDisabled$ = merge(
            distinctPreismeldung$.pipe(
                filter((x) => !!x),
                map((x) => {
                    const kommentar = x.messages.kommentar;
                    return !kommentar || kommentar === '';
                }),
            ),
            this.messagesForm.valueChanges.pipe(map((x) => !x.kommentar || x.kommentar === '')),
        );

        this.clearBemerkungenDisabled$ = merge(
            distinctPreismeldung$.pipe(
                filter((x) => !!x),
                map((x) => {
                    const bemerkungen = x.messages.bemerkungen;
                    return !bemerkungen || bemerkungen === '';
                }),
            ),
            this.messagesForm.valueChanges.pipe(map((x) => !x.bemerkungen || x.bemerkungen === '')),
        );

        this.preismeldungMessagesPayload$ = this.messagesForm.valueChanges.pipe(
            takeUntil(this.onDestroy$),
            withLatestFrom(this.isAdminApp$.pipe(startWith(false)), (x, isAdminApp) => assign(x, { isAdminApp })),
            map((x) => ({
                notiz: x.notiz.replace(/(?:\r\n|\r|\n)/g, '\\n'),
                kommentar: x.kommentar.replace(/(?:\r\n|\r|\n)/g, '\\n'),
                bemerkungen: x.bemerkungen.replace(/(?:\r\n|\r|\n)/g, '\\n'),
                isAdminApp: x.isAdminApp,
            })),
            share(),
        );

        this.saveMessages$ = merge(
            this.onNotizSave$,
            this.onKommentarSave$,
            this.onBemerkungenSave$,
            this.clearField$,
            this.erledigtClicked$,
        ).pipe(
            tap(() => {
                this.messagesForm.markAsPristine();
            }),
        );

        this.notizModified$ = merge(
            this.messagesForm.valueChanges.pipe(map(() => this.form.get('messages.notiz')?.dirty ?? false)),
            this.saveMessages$.pipe(map(() => false)),
            distinctPreismeldung$.pipe(map((x) => x.isMessagesModified)),
        ).pipe(startWith(false));

        this.kommentarModified$ = merge(
            this.messagesForm.valueChanges.pipe(map(() => this.messagesForm.get('kommentar')?.dirty ?? false)),
            this.saveMessages$.pipe(map(() => false)),
            snippetsControl.valueChanges.pipe(filter((snippet) => snippet !== '')),
            distinctPreismeldung$.pipe(map((x) => x.isMessagesModified)),
        ).pipe(startWith(false));

        this.bemerkungenModified$ = merge(
            this.messagesForm.valueChanges.pipe(map(() => this.messagesForm.get('bemerkungen')?.dirty ?? false)),
            this.saveMessages$.pipe(map(() => false)),
            distinctPreismeldung$.pipe(map((x) => x.isMessagesModified)),
        ).pipe(startWith(false));

        this.clearField$.pipe(takeUntil(this.onDestroy$)).subscribe((field) => {
            this.messagesForm.patchValue({ [field]: '' });
            this.messagesForm.get(field)?.markAsDirty();
        });

        this.kommentarClearClicked$ = this.clearField$.pipe(
            filter((field) => field === 'kommentar' || field === 'bemerkungen'),
            takeUntil(this.onDestroy$),
        );

        this.erledigtClicked$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
            let bemerkungen = this.messagesForm.value['bemerkungen'];
            bemerkungen = bemerkungen ? bemerkungen + '\n' : bemerkungen;
            bemerkungen += '@OK';
            this.messagesForm.patchValue({ bemerkungen });
        });

        this.erledigtDisabled$ = distinctPreismeldung$.pipe(
            switchMap(() =>
                merge(
                    this.erledigtClicked$.pipe(map(() => true)),
                    combineLatest([
                        this.clearField$.pipe(filter((field) => field === 'bemerkungen')),
                        this.bemerkungenHistory$.pipe(filter((history) => history !== '')),
                    ]).pipe(map(() => false)),
                    this.bemerkungenHistory$.pipe(
                        map((history) => {
                            const textAreaValue = this.messagesForm.get('bemerkungen')?.value;
                            return history === '' || textAreaValue.endsWith('@OK');
                        }),
                    ),
                    combineLatest([
                        this.bemerkungenHistory$,
                        this.messagesForm.valueChanges.pipe(map((x) => x.bemerkungen)),
                    ]).pipe(map(([history, textAreaValue]) => history === '' || textAreaValue.endsWith('@OK'))),
                ).pipe(startWith(true)),
            ),
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
    return texte.map((text) => {
        const [prefix, message] = text.indexOf('Admin: ') === 0 ? [text.slice(0, 7), text.slice(7)] : ['', text];
        return { prefix, message };
    });
}

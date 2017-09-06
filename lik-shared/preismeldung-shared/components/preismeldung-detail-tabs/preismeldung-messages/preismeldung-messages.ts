import { Component, Input, OnChanges, SimpleChange, ChangeDetectionStrategy, EventEmitter, Output, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { assign } from 'lodash';

import { ReactiveComponent } from '../../../../';

import * as P from '../../../models';
import { Observable } from 'rxjs';
import { PreismeldungMessagesPayload } from '../../../actions/preismeldung.actions';

@Component({
    selector: 'preismeldung-messages',
    template: `
        <preismeldung-readonly-header [preismeldung]="preismeldung$ | async" [preismeldestelle]="preismeldestelle$ | async" [isAdminApp]="isAdminApp$ | async"></preismeldung-readonly-header>

        <ion-content pef-perfect-virtualscroll-scrollbar [enabled]="isDesktop$ | async">
            <form [formGroup]="form" novalidate>
                <div class="detail-tab-bottom-part">
                    <h3>{{ 'heading_meine-notiz' | translate }}</h3>
                    <ion-item class="pef-textarea-item">
                        <ion-textarea formControlName="notiz" (blur)="onBlur$.emit()"></ion-textarea>
                    </ion-item>
                    <button ion-button color="java" (click)="notizClear$.emit()">{{ 'btn_leeren' | translate }}</button>
                    <h3>{{ 'heading_kommentar-zum-aktuellen-monat' | translate }}</h3>
                    <div class="kommentar-autotext">
                        <span *ngFor="let text of (preismeldung$ | async)?.messages.kommentarAutotext">{{ (text | translate) + '\u0020' }}</span>
                    </div>
                    <ion-item class="pef-textarea-item">
                        <ion-textarea formControlName="kommentar" (blur)="onBlur$.emit()"></ion-textarea>
                    </ion-item>
                    <button ion-button color="java" (click)="kommentarClear$.emit()">{{ 'btn_leeren' | translate }}</button>
                    <h3>{{ 'heading_kommunikation' | translate }}</h3>
                    <div class="message-history" *ngIf="(bemerkungenHistory$ | async)?.length > 0">
                        <div *ngFor="let h of (bemerkungenHistory$ | async)"><span class="message-author" *ngIf="!!h.author">{{h.author}}:</span>&nbsp;{{h.text}}</div>
                    </div>
                    <ion-item class="pef-textarea-item">
                        <ion-textarea formControlName="bemerkungen" (blur)="onBlur$.emit()" [class.readonly]="erledigtDisabled$ | async" [readonly]="erledigtDisabled$ | async"></ion-textarea>
                    </ion-item>
                    <button ion-button color="java" [disabled]="erledigtDisabled$ | async" (click)="erledigt$.emit()">{{ 'btn_erledigt' | translate }}</button>
                </div>
            </form>
        </ion-content>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldungMessagesComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() isActive: boolean;
    @Input() preismeldung: P.CurrentPreismeldungBag;
    @Input() priceCountStatus: P.PriceCountStatus;
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Input() isDesktop: boolean;
    @Input() isAdminApp: boolean;
    @Output('preismeldungMessagesPayload') preismeldungMessagesPayload$: Observable<P.PreismeldungMessagesPayload>;

    public isActive$ = this.observePropertyCurrentValue<boolean>('isActive');
    public preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>('preismeldung').publishReplay(1).refCount();
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    public preismeldestelle$ = this.observePropertyCurrentValue<P.PriceCountStatus>('preismeldestelle');
    public isDesktop$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('isDesktop');
    public isAdminApp$ = this.observePropertyCurrentValue<boolean>('isAdminApp');

    public bemerkungenHistory$: Observable<{ author: string, text: string }[]>;

    public onBlur$ = new EventEmitter();
    public notizClear$ = new EventEmitter();
    public kommentarClear$ = new EventEmitter();
    public erledigtDisabled$: Observable<boolean>;
    public erledigt$ = new EventEmitter();

    form: FormGroup;

    private subscriptions = [];

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

        this.subscriptions.push(
            distinctPreismeldung$
                .subscribe(bag => {
                    this.form.reset({
                        notiz: bag.messages.notiz,
                        kommentar: bag.messages.kommentar,
                        bemerkungen: bag.messages.bemerkungen.replace('¶', '\n'),
                    });
                })
        );

        this.subscriptions.push(
            this.notizClear$.subscribe(() => { this.form.patchValue({ notiz: '' }); this.onBlur$.emit(); })
        );

        this.subscriptions.push(
            this.kommentarClear$.subscribe(() => { this.form.patchValue({ kommentar: '' }); this.onBlur$.emit(); })
        );

        this.subscriptions.push(
            this.erledigt$.subscribe(() => {
                let bemerkungen = this.form.value['bemerkungen'];
                bemerkungen = !!bemerkungen ? bemerkungen + '\n' : bemerkungen;
                bemerkungen += '@OK';
                this.form.patchValue({ bemerkungen });
                this.onBlur$.emit();
            })
        );

        this.erledigtDisabled$ = this.form.valueChanges.map(x => x.bemerkungen.endsWith('@OK')).startWith(false);

        this.preismeldungMessagesPayload$ = this.onBlur$
            .withLatestFrom(this.form.valueChanges.startWith({ notiz: '', kommentar: '', bemerkungen: '' }), (_, formValue) => formValue)
            .debounceTime(100)
            .withLatestFrom(this.isAdminApp$.startWith(false), (x, isAdminApp) => assign(x, { isAdminApp }))
            .map(x => ({ notiz: x.notiz.replace('\n', '¶'), kommentar: x.kommentar.replace('\n', '¶'), bemerkungen: x.bemerkungen.replace('\n', '¶'), isAdminApp: x.isAdminApp }))
            .do(x => console.log('payload', x))
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }
}

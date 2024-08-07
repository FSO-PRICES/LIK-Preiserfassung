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
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    Renderer2,
    SimpleChange,
    ViewChild,
} from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';

import { Models as P, ReactiveComponent } from '@lik-shared';

@Component({
    selector: 'pef-pm-status',
    templateUrl: 'pef-pm-status.component.html',
    styleUrls: ['pef-pm-status.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PefPmStatusComponent extends ReactiveComponent implements AfterViewInit, OnChanges, OnDestroy {
    @Input({ required: true }) disabled: boolean;
    @Input() preismeldungStatus: P.PreismeldungStatus;
    @Input() size: 'normal' | 'large' = 'normal';
    @Output('setPreismeldungStatus') setPreismeldungStatus$: Observable<P.PreismeldungStatus>;
    @ViewChild('pmStatusInput', { static: true }) pmStatusInput: ElementRef<HTMLInputElement>;

    public inputChanged$ = new EventEmitter<string>();
    private ngOnDestroy$ = new Subject<void>();
    private ngAfterViewInit$ = new Subject<void>();

    public disabled$ = this.observePropertyCurrentValue<boolean>('disabled').pipe(startWith(false));

    constructor(renderer: Renderer2) {
        super();

        this.setPreismeldungStatus$ = this.inputChanged$.asObservable().pipe(map((x) => +x));
        const pmStatus$ = this.observePropertyCurrentValue<P.PreismeldungStatus>('preismeldungStatus').pipe(
            startWith(3),
        );

        combineLatest([pmStatus$, this.ngAfterViewInit$])
            .pipe(takeUntil(this.ngOnDestroy$))
            .subscribe(([pmStatus]) => {
                const newStatus = pmStatus ?? 0;
                renderer.setAttribute(this.pmStatusInput.nativeElement, 'value', newStatus.toString());
                this.pmStatusInput.nativeElement.value = newStatus.toString();
            });
    }

    public ngAfterViewInit() {
        this.ngAfterViewInit$.next();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    public ngOnDestroy() {
        this.ngOnDestroy$.next();
    }
}

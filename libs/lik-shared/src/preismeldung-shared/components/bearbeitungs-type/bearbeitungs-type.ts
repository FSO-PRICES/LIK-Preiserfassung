import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    forwardRef,
    HostBinding,
    HostListener,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChange,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { assign } from 'lodash';
import { ConnectableObservable, Observable } from 'rxjs';
import {
    combineLatest,
    distinctUntilChanged,
    filter,
    map,
    mapTo,
    merge,
    publishReplay,
    refCount,
    scan,
    startWith,
    tap,
} from 'rxjs/operators';

import { ReactiveComponent } from '../../../common/ReactiveComponent';
import * as P from '../../models';

interface BearbeitungsType {
    code: P.Models.Bearbeitungscode;
    iconName: string;
    description: string;
    codeName: string;
}

export interface BeaurbeitungsTypeChange {
    source: BearbeitungsTypeComponent;
    value: any;
}

export type CodeListType = 'STANDARD' | 'NEW_PM';

@Component({
    selector: 'bearbeitungs-type',
    styleUrls: ['./bearbeitungs-type.scss'],
    templateUrl: 'bearbeitungs-type.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => BearbeitungsTypeComponent),
            multi: true,
        },
    ],
})
export class BearbeitungsTypeComponent extends ReactiveComponent implements ControlValueAccessor, OnChanges, OnDestroy {
    @Input() codeListType: CodeListType = 'STANDARD';
    @Input() nichtEmpfohleneBc: P.Models.Bearbeitungscode[];
    @HostBinding('class.readonly') @Input() readonly: boolean;
    @Output('change') change$: Observable<P.Models.Bearbeitungscode>;

    public codeListType$ = this.observePropertyCurrentValue<CodeListType>('codeListType');
    public readonly$ = this.observePropertyCurrentValue<boolean>('readonly');

    public buttonClicked$ = new EventEmitter<MouseEvent>();
    public buttonOn$: Observable<boolean>;
    public selectBearbeitungsType$ = new EventEmitter<{ event: Event; bearbeitungsType: BearbeitungsType }>();
    public documentClick$ = new EventEmitter<MouseEvent>();
    public marginBottom$: Observable<string>;

    public bearbeitungsTypes$: Observable<BearbeitungsType[]>;

    public selectedBearbeitungsType$: Observable<BearbeitungsType>;

    private subscriptions = [];

    constructor(elementRef: ElementRef) {
        super();

        this.bearbeitungsTypes$ = this.codeListType$.pipe(
            map(codeListType =>
                codeListType === 'NEW_PM' ? this.newPmBearbeitungsTypes : this.standardBearbeitungsTypes,
            ),
            combineLatest(
                this.observePropertyCurrentValue<P.Models.Bearbeitungscode[]>('nichtEmpfohleneBc'),
                (bearbeitungsTypes, nichtEmpfohleneBc) =>
                    bearbeitungsTypes.map(x =>
                        (nichtEmpfohleneBc || []).some(y => y === x.code)
                            ? assign({}, x, { iconName: 'not_recommended' })
                            : x,
                    ),
            ),
            publishReplay(1),
            refCount(),
        );

        const bearbeitungsTypeFromInput$ = this.changeFromInput$.pipe(
            combineLatest(this.bearbeitungsTypes$, (changeFromInput, bearbeitungsTypes) => ({
                changeFromInput,
                bearbeitungsTypes,
            })),
            map(x => x.bearbeitungsTypes.find(y => y.code === x.changeFromInput)),
            publishReplay(1),
        );
        (bearbeitungsTypeFromInput$ as ConnectableObservable<BearbeitungsType>).connect();

        this.selectedBearbeitungsType$ = this.selectBearbeitungsType$.pipe(
            map(x => x.bearbeitungsType),
            merge(bearbeitungsTypeFromInput$),
            startWith(this.standardBearbeitungsTypes[0]),
            publishReplay(1),
            refCount(),
        );

        this.change$ = this.selectBearbeitungsType$.pipe(
            map(x => x.bearbeitungsType.code),
            publishReplay(1),
            refCount(),
        );

        this.subscriptions.push(
            this.change$.subscribe(x => {
                this._onChange(x);
            }),
        );

        this.buttonOn$ = this.buttonClicked$.pipe(
            tap(x => {
                x.cancelBubble = true;
            }),
            map(() => ({ type: 'TOGGLE' })),
            merge(
                this.selectBearbeitungsType$.pipe(
                    tap(x => {
                        x.event.cancelBubble = true;
                    }),
                    mapTo({ type: 'CLOSE' }),
                ),
            ),
            merge(this.documentClick$.pipe(mapTo({ type: 'CLOSE' }))),
            scan((agg, v) => (v.type === 'TOGGLE' ? !agg : false), false),
            startWith(false),
            distinctUntilChanged(),
            publishReplay(1),
            refCount(),
        );

        this.marginBottom$ = this.buttonOn$.pipe(
            filter(x => x),
            map(() => this._calculateMarginBottom(elementRef)),
            startWith('0'),
        );
    }

    private _calculateMarginBottom(elementRef: ElementRef) {
        const buttonElement = elementRef.nativeElement.getElementsByClassName('code-button')[0] as Element;
        return `${buttonElement.getBoundingClientRect().height + 4}px`;
    }

    @HostListener('document:click')
    documentClick($event) {
        this.documentClick$.emit($event);
    }

    _onChange = (_value: any) => {};
    _onTouched: () => any = () => {};

    registerOnChange(fn: (value: any) => void): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }

    private changeFromInput$ = new EventEmitter<any>();
    writeValue(value: any) {
        this.changeFromInput$.emit(value);
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    private codeToBearbeitungsType = (code: P.Models.Bearbeitungscode) => ({
        code,
        iconName: 'recommended',
        description: `bearbeitungscode_${code}`,
        codeName: P.Models.bearbeitungscodeDescriptions[code],
    });

    public standardBearbeitungsTypes: BearbeitungsType[] = [99, 44, 101, 1, 7, 0].map(this.codeToBearbeitungsType);
    public newPmBearbeitungsTypes: BearbeitungsType[] = [2, 3].map(this.codeToBearbeitungsType);
}

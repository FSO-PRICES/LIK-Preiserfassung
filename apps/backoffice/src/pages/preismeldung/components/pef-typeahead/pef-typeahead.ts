import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChange,
    ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { pefSearch, ReactiveComponent } from '@lik-shared';
import { Observable } from 'rxjs';
import {
    combineLatest,
    delay,
    filter,
    map,
    mapTo,
    merge,
    mergeMap,
    publishReplay,
    refCount,
    scan,
    startWith,
    take,
    takeUntil,
    tap,
    withLatestFrom,
} from 'rxjs/operators';

export interface TypeaheadData {
    shortLabel?: string;
    label: string;
    value: any;
}

@Component({
    selector: 'pef-typeahead',
    templateUrl: 'pef-typeahead.html',
    styleUrls: ['pef-typeahead.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PefTypeaheadComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() initialValues: any[];
    @Input() multi = false;
    @Input() label: string;
    @Input() suggestions: TypeaheadData[];
    @Input() reset: any;
    @Output('selected') selectedSuggestions$: Observable<TypeaheadData[]>;
    @Output('triggerSubmit') triggerSubmit$: Observable<any>;
    @ViewChild('singleTag', { static: true }) singleTag: ElementRef;

    filterText = new FormControl();
    filteredSuggestions$: Observable<TypeaheadData[]>;
    selectedIndex$: Observable<number>;
    private onDestroy$ = new EventEmitter();
    public scrollList: TypeaheadData[];

    keyup$ = new EventEmitter<{ event: KeyboardEvent; input: string }>();
    keydown$ = new EventEmitter<KeyboardEvent>();
    onClickedOutside$ = new EventEmitter();
    inputFocus$ = new EventEmitter<boolean>();
    selectSuggestion$ = new EventEmitter<TypeaheadData>();
    removeSuggestion$ = new EventEmitter<TypeaheadData>();
    submitSingleTag$ = new EventEmitter<KeyboardEvent>();
    setFocus$ = this.removeSuggestion$.asObservable().pipe(
        mapTo(true),
        publishReplay(1),
        refCount(),
    );

    constructor() {
        super();
        const arrowKeyNavigation = { 38: -1, 40: 1 };
        const applyKey = 13;
        this.setFocus$.pipe(takeUntil(this.onDestroy$)).subscribe();

        const initialValues$ = this.observePropertyCurrentValue<any[]>('initialValues').pipe(
            filter(x => !!x && !!x.length),
        );
        const reset$ = this.observePropertyCurrentValue<any>('reset').pipe(
            publishReplay(1),
            refCount(),
        );
        const suggestions$ = this.observePropertyCurrentValue<TypeaheadData[]>('suggestions').pipe(
            filter(x => !!x && !!x.length),
        );

        this.selectSuggestion$
            .pipe(
                merge(reset$),
                takeUntil(this.onDestroy$),
            )
            .subscribe(x => this.filterText.patchValue(''));

        const keyDown$ = this.keydown$.pipe(
            publishReplay(1),
            refCount(),
        );
        const keyNavigation$ = keyDown$.pipe(
            filter(x => !!arrowKeyNavigation[x.keyCode]),
            tap(x => x.preventDefault()),
            map(x => arrowKeyNavigation[x.keyCode] as number),
        );
        const keyApply$ = keyDown$.pipe(filter(x => x.keyCode === applyKey));

        this.selectedSuggestions$ = this.selectSuggestion$.pipe(
            map(x => ({ add: true, data: x, reset: false })),
            merge(this.removeSuggestion$.pipe(map(x => ({ add: false, data: x, reset: false })))),
            merge(
                suggestions$.pipe(
                    combineLatest(initialValues$),
                    take(1),
                    map(([suggestions, initialValues]) =>
                        suggestions.filter(x => initialValues.some(value => value === x.value)),
                    ),
                    filter(x => !!x.length),
                    mergeMap(x => x.map(data => ({ add: true, data, reset: false }))),
                ),
            ),
            merge(reset$.pipe(mapTo({ add: false, data: null, reset: true }))),
            scan(
                (acc, { add, data, reset }) =>
                    reset ? [] : add ? (this.multi ? [...acc, data] : [data]) : acc.filter(x => x.value !== data.value),
                [] as (TypeaheadData)[],
            ),
            startWith([]),
            publishReplay(1),
            refCount(),
        );

        this.selectedSuggestions$
            .pipe(
                delay(0),
                filter(x => !!x && x.length === 1),
            )
            .subscribe(x => {
                if (!!this.singleTag) {
                    this.singleTag.nativeElement.focus();
                }
            });

        this.filteredSuggestions$ = this.filterText.valueChanges.pipe(
            startWith(null),
            combineLatest(suggestions$, this.selectedSuggestions$),
            map(([filter, suggestions, selectedSuggestions]) => {
                return (!filter || filter.length < 2
                    ? []
                    : pefSearch(filter, suggestions, [x => x.value, x => x.label])
                ).filter(x => !selectedSuggestions.find(s => s === x));
            }),
            startWith([]),
            merge(this.onClickedOutside$.pipe(mapTo([]))),
            merge(
                this.keydown$.pipe(
                    filter(e => e.keyCode === 27),
                    mapTo([]),
                ),
            ),
            publishReplay(1),
            refCount(),
        );
        this.triggerSubmit$ = this.submitSingleTag$.pipe(
            filter(x => x.keyCode === applyKey),
            merge(
                keyApply$.pipe(
                    withLatestFrom(this.filteredSuggestions$),
                    filter(([, suggestions]) => suggestions.length === 0),
                ),
            ),
        );

        this.selectedIndex$ = keyNavigation$.pipe(
            combineLatest(this.filteredSuggestions$.pipe(map(x => x.length))),
            scan(
                (acc, [direction, count]) =>
                    (acc || 0) + direction > count - 1
                        ? count - 1
                        : (acc || 0) + direction < 0
                        ? 0
                        : (acc || 0) + direction,
                -1,
            ),
            map(x => (x === -1 ? null : x)),
            startWith(null),
            publishReplay(1),
            refCount(),
        );

        keyApply$
            .pipe(
                withLatestFrom(this.selectedIndex$, this.filteredSuggestions$),
                map(([$event, i, suggestions]) => {
                    if (!!suggestions.length) {
                        $event.preventDefault();
                    }
                    return suggestions[i];
                }),
                filter(x => !!x),
                takeUntil(this.onDestroy$),
                delay(0), // Handle the other keyApply$ subscriptions first
            )
            .subscribe(x => {
                return this.selectSuggestion$.emit(x);
            });
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    public ngOnDestroy() {
        this.onDestroy$.next();
    }
}

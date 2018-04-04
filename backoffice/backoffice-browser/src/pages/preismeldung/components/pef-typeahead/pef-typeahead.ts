import { Component, Input, EventEmitter, OnChanges, SimpleChange, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { ReactiveComponent, pefSearch } from 'lik-shared';

export interface TypeaheadData {
    shortLabel?: string;
    label: string;
    value: any;
}

@Component({
    selector: 'pef-typeahead',
    templateUrl: 'pef-typeahead.html',
})
export class PefTypeaheadComponent extends ReactiveComponent implements OnChanges {
    @Input() initialValues: any[];
    @Input() multi = false;
    @Input() label: string;
    @Input() suggestions: TypeaheadData[];
    @Input() reset: any;
    @Output('selected') selectedSuggestions$: Observable<TypeaheadData[]>;

    form: FormGroup;
    filteredSuggestions$: Observable<TypeaheadData[]>;
    selectedIndex$: Observable<number>;

    keyup$ = new EventEmitter<{ event: KeyboardEvent; input: string }>();
    keydown$ = new EventEmitter<KeyboardEvent>();
    inputFocus$ = new EventEmitter<boolean>();
    selectSuggestion$ = new EventEmitter<TypeaheadData>();
    removeSuggestion$ = new EventEmitter<TypeaheadData>();

    constructor(private formBuilder: FormBuilder) {
        super();
        const arrowKeyNavigation = { 38: -1, 40: 1 };
        const applyKey = 13;

        const initialValues$ = this.observePropertyCurrentValue<any[]>('initialValues').filter(x => !!x && !!x.length);
        const reset$ = this.observePropertyCurrentValue<any>('reset')
            .publishReplay(1)
            .refCount();
        const suggestions$ = this.observePropertyCurrentValue<TypeaheadData[]>('suggestions').filter(
            x => !!x && !!x.length
        );

        this.form = formBuilder.group({
            typeahead: '',
        });

        this.selectSuggestion$.merge(reset$).subscribe(x => this.form.patchValue({ typeahead: '' }));

        const keyDown$ = this.keydown$.publishReplay(1).refCount();
        const keyNavigation$ = keyDown$
            .filter(x => !!arrowKeyNavigation[x.keyCode])
            .do(x => x.preventDefault())
            .map(x => arrowKeyNavigation[x.keyCode] as number);
        const keyApply$ = keyDown$.filter(x => x.keyCode === applyKey).do(x => x.preventDefault());

        this.selectedSuggestions$ = this.selectSuggestion$
            .map(x => ({ add: true, data: x, reset: false }))
            .merge(this.removeSuggestion$.map(x => ({ add: false, data: x, reset: false })))
            .merge(
                suggestions$
                    .combineLatest(initialValues$)
                    .take(1)
                    .map(([suggestions, initialValues]) =>
                        suggestions.filter(x => initialValues.some(value => value === x.value))
                    )
                    .filter(x => !!x.length)
                    .mergeMap(x => x.map(data => ({ add: true, data, reset: false })))
            )
            .merge(reset$.mapTo({ add: false, data: null, reset: true }))
            .scan(
                (acc, { add, data, reset }) =>
                    reset ? [] : add ? (this.multi ? [...acc, data] : [data]) : acc.filter(x => x.value !== data.value),
                [] as (TypeaheadData)[]
            )
            .startWith([])
            .publishReplay(1)
            .refCount();

        this.filteredSuggestions$ = this.form.valueChanges
            .map(x => x.typeahead)
            .combineLatest(suggestions$, this.selectedSuggestions$)
            .map(([filter, suggestions, selectedSuggestions]) => {
                return !filter || filter.length < 2
                    ? []
                    : pefSearch(filter, suggestions, [x => x.value, x => x.label]).filter(
                          x => !selectedSuggestions.find(s => s === x)
                      );
            })
            .startWith([])
            .publishReplay(1)
            .refCount();

        this.selectedIndex$ = keyNavigation$
            .combineLatest(this.filteredSuggestions$.map(x => x.length))
            .scan(
                (acc, [direction, count]) =>
                    (acc || 0) + direction > count - 1
                        ? count - 1
                        : (acc || 0) + direction < 0 ? 0 : (acc || 0) + direction,
                -1
            )
            .map(x => (x === -1 ? null : x))
            .startWith(null)
            .publishReplay(1)
            .refCount();

        keyApply$
            .withLatestFrom(this.selectedIndex$, this.filteredSuggestions$)
            .map(([_, i, suggestions]) => suggestions[i])
            .filter(x => !!x)
            .subscribe(x => this.selectSuggestion$.emit(x));
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}

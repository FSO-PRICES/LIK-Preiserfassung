import { FormGroup } from '@angular/forms';

export function delayedFormValueChanges(form: FormGroup, delay: number = 800) {
    const formValueChanges$ = form.valueChanges
        .publishReplay(1).refCount();

    return formValueChanges$
        .debounceTime(delay);
        // The merge throttleTime is useful to add an instant change detection
        // so together with debounce time the change detection does not fire everytime
        // .merge(formValueChanges$.throttleTime(delay))
        // Distinct to prevent the debounceTime fire the same as throttleTime if no
        // change was done between the 800ms
        // .distinct();
}

export function filterValues(searchString: string, values: string[]) {
    return !searchString || values.some(value => value.toLocaleLowerCase().includes(searchString.toLocaleLowerCase()));
}

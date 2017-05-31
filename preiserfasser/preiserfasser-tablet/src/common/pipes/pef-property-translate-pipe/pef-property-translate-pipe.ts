import { Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromRoot from '../../../reducers';
import * as P from '../../../common-models';

@Pipe({ name: 'pefPropertyTranslate' })
export class PefPropertyTranslatePipe implements PipeTransform, OnDestroy {
    private currentLanguage: string;

    private subscriptions = [];

    constructor(store: Store<fromRoot.AppState>) {
        this.subscriptions.push(
            store.select(fromRoot.getCurrentLanguage)
                .subscribe(lang => this.currentLanguage = lang)
        );
    }

    transform(value: P.Models.PropertyTranslation, formatOptions: any) {
        if (!value) return undefined;

        return value[this.currentLanguage];
    }

    ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }
}

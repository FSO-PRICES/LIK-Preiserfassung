import { Pipe, PipeTransform } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromRoot from '../../reducers';
import * as P from '../../common-models';

@Pipe({ name: 'pefPropertyTranslate' })
export class PefPropertyTranslatePipe implements PipeTransform {
    private currentLanguage: string;

    constructor(store: Store<fromRoot.AppState>) {
        store.select(fromRoot.getCurrentLanguage)
            .subscribe(lang => this.currentLanguage = lang);
    }

    transform(value: P.PropertyTranslation, formatOptions: any) {
        if (!value) return undefined;

        return value[this.currentLanguage];
    }
}

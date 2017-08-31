import { Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromRoot from '../../../reducers';
import { Models as P } from 'lik-shared';

@Pipe({ name: 'pefPropertyTranslate' })
export class PefPropertyTranslatePipe implements PipeTransform {
    transform(value: P.PropertyTranslation, formatOptions: any) {
        if (!value) return undefined;
        return value['de'];
    }
}

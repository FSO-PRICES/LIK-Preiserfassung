import { inject } from '@angular/core';
import { Router } from '@angular/router';
import * as E from '@effect/data/Either';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';

import * as fromRoot from '../reducers';

export function settingsValidGuard() {
    const store: Store<fromRoot.AppState> = inject(Store);
    const router = inject(Router);
    return store.select(fromRoot.getSettings).pipe(
        take(1),
        map((settings) => {
            if (E.isLeft(settings.serverConnectionUrl)) {
                router.navigate(['/settings']);
                return false;
            }
            return true;
        }),
    );
}

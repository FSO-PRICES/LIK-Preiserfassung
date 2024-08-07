import { Observable } from 'rxjs';

export interface CanDeactivate {
    canDeactivate(): Observable<boolean> | Promise<boolean> | boolean;
}

export function canDeactivateGuard(component: CanDeactivate) {
    return component.canDeactivate();
}

export function translate(key: string, interpolateParams?: Object) {
    return window.__translate.instant(key, interpolateParams);
}

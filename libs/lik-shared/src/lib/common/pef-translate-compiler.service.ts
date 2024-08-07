import { TranslateCompiler } from '@ngx-translate/core';

export class PefTranslateCompilerService implements TranslateCompiler {
    compile(value: string): string | Function {
        return value;
    }
    compileTranslations(translations: any, _lang: string) {
        return clearEmpty(translations);
    }
}

function clearEmpty(object: Object, path: string = '') {
    Object.entries(object).forEach(([k, v]) => {
        if (v && typeof v === 'object') {
            clearEmpty(v, path + k + '.');
        }
        if (v === '' || v == null) {
            delete object[k];
        }
    });
    return object;
}

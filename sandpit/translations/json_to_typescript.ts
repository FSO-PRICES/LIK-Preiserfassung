import * as fs from 'fs';
import { Observable, Observer } from 'rxjs';
import { assign, keys } from 'lodash';

const data$ = readFile('./de.json')
    .flatMap(de => readFile('./en.json').map(en => ({ de, en })))
    .flatMap(x => readFile('./fr.json').map(fr => assign(x, { fr })))
    .flatMap(x => readFile('./it.json').map(it => assign(x, { it })));

data$
    .map(x => [
        `export const de = {`, ...keys(x.de).map(key => `    '${key}': \`${x.de[key]}\`,`), '};', '',
        `export const en = {`, ...keys(x.en).map(key => `    '${key}': \`${x.en[key]}\`,`), '};', '',
        `export const fr = {`, ...keys(x.fr).map(key => `    '${key}': \`${x.fr[key]}\`,`), '};', '',
        `export const it = {`, ...keys(x.it).map(key => `    '${key}': \`${x.it[key]}\`,`), '};', ''
    ].join('\n'))
    .subscribe(text => fs.writeFileSync('./translations.ts', text, 'utf8'));

function readFile(filename: string): Observable<string> {
    return Observable.create((observer: Observer<string>) => {
        fs.readFile(filename, 'utf8', (err, data) => {
            observer.next(JSON.parse(data));
            observer.complete();
        });
    });
}

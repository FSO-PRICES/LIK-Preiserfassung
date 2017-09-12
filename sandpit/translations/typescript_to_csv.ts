import * as fs from 'fs';
import { de, en, fr, it } from './translations';

const getValue = (obj, key) => !obj[key] ? '' : obj[key].replace('"', '""');

const lines = Object.keys(de).map(key => `"${key}";"${getValue(de, key)}";"${getValue(en, key)}";"${getValue(fr, key)}";"${getValue(it, key)}"`);
fs.writeFile('./translations.csv', ['key;DE;EN;FR;IT'].concat(lines).join('\n'), 'utf8', err => console.log('done'));

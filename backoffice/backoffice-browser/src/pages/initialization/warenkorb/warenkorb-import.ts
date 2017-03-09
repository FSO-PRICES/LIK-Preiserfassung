import { EventEmitter, Output, Component } from '@angular/core';
import { LoadingController } from 'ionic-angular';
import { Observable } from 'rxjs';
import { first } from 'lodash';

import { readFileContents, parseFile } from '../../../common/file-select-observable';
import { buildTree } from '../../../common/presta-warenkorb-mapper';
import { dropDatabase, getDatabase, putAdminUserToDatabase } from '../../../effects/pouchdb-utils';
import { Http } from '@angular/http';

@Component({
    selector: 'warenkorb-import',
    templateUrl: 'warenkorb-import.html',
})
export class WarenkorbImportComponent {
    public warenkorbIsCompleted$: Observable<boolean>;

    public warenkorbSelectedDe$ = new EventEmitter<Event>();
    public warenkorbSelectedFr$ = new EventEmitter<Event>();
    public warenkorbSelectedIt$ = new EventEmitter<Event>();

    public createWarenkorbClicked$ = new EventEmitter();

    @Output('importCompleted')
    public importCompleted$: Observable<number>;

    public warenkorbImported$: Observable<number>;
    private isWarenkorbImported$: Observable<boolean>;

    constructor(private http: Http, private loadingCtrl: LoadingController) {
        const loader = this.loadingCtrl.create({
            content: 'Datensynchronisierung. Bitte warten...'
        });

        const warenkorbDe$ = this.warenkorbSelectedDe$
            .map(event => first((<HTMLInputElement>event.target).files))
            .filter(f => !!f.name.match('Erhebungsschema_DE'))
            .flatMap(file => readFileContents(file))
            .map(content => parseFile(content));
        const warenkorbFr$ = this.warenkorbSelectedFr$
            .map(event => first((<HTMLInputElement>event.target).files))
            .filter(f => !!f.name.match('Erhebungsschema_FR'))
            .flatMap(file => readFileContents(file))
            .map(content => parseFile(content));
        const warenkorbIt$ = this.warenkorbSelectedIt$
            .map(event => first((<HTMLInputElement>event.target).files))
            .filter(f => !!f.name.match('Erhebungsschema_IT'))
            .flatMap(file => readFileContents(file))
            .map(content => parseFile(content));

        const warenkorbCompleted$ = warenkorbDe$
            .combineLatest(warenkorbFr$, warenkorbIt$, (de: string[][], fr: string[][], it: string[][]) => ({ de, fr, it }))
            .publishReplay(1).refCount();

        this.warenkorbIsCompleted$ = warenkorbCompleted$.map(_ => true).startWith(false);

        this.importCompleted$ = this.createWarenkorbClicked$
            .withLatestFrom(warenkorbCompleted$, (_, warenkorb) => warenkorb)
            .do(x => loader.present())
            .map(x => buildTree(x))
            // ¡¡ TODO: talk to Wayne about this !!
            .flatMap(x => dropDatabase('warenkorb').then(_ => x).catch(_ => x))
            .flatMap(x => getDatabase('warenkorb').then(db => ({ warenkorb: x, db })).catch(_ => ({ warenkorb: x, db: <PouchDB.Database<PouchDB.Core.Encodable>>null })))
            .flatMap(({ warenkorb, db }) => Observable.fromPromise(db.put({ _id: 'warenkorb', products: warenkorb }).then(_ => warenkorb.length)))
            .publishReplay(1).refCount();

        this.importCompleted$
            .flatMap(x => putAdminUserToDatabase(http, 'warenkorb'))
            .do(x => loader.dismiss())
            .subscribe();

        this.warenkorbImported$ = this.importCompleted$.startWith(0)
            .publishReplay(1).refCount();
        this.isWarenkorbImported$ = this.warenkorbImported$.map(x => x > 0);
    }
}

import { Component, EventEmitter } from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as fromRoot from '../../../reducers';
import { getDatabase, getAllDocumentsForPrefix, dropDatabase, putUserToDatabase } from '../../../effects/pouchdb-utils';
import { Models as P } from 'lik-shared';
import { Observable } from 'rxjs';
import { Http } from '@angular/http';
import { CouchProperties } from '../../../../../../lik-shared/common/models';
import * as _ from 'lodash';

@Component({
    selector: 'pe-to-pms',
    templateUrl: 'pe-to-pms.html',
})
export class PreiserheberToPmsComponent {
    public preiserhebers$ = this.store.select(fromRoot.getPreiserhebers);
    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen);

    public selectablePreismeldestellen$: Observable<P.AdvancedPreismeldestelle[]>;

    public assignClicked$ = new EventEmitter<Event>();

    public peAssigned$: Observable<boolean>;

    public form: FormGroup;

    constructor(private formBuilder: FormBuilder, private store: Store<fromRoot.AppState>, private http: Http) {
        this.form = formBuilder.group({
            preiserheber: [null, Validators.required],
            preismeldestellen: [null, Validators.required]
        });

        const preiszuweisungen$ = getDatabase('preiszuweisungen').then(db =>
            db.allDocs({ include_docs: true })
                .then(result => result.rows.map(row => ({ preiserheberId: row.doc._id, preismeldestellen: <P.AdvancedPreismeldestelle[]>(<any>row.doc).preismeldestellen.map(x => x.pmsNummer) })))
        );

        this.selectablePreismeldestellen$ = this.form.get('preiserheber').valueChanges
            .filter(x => !!x)
            .withLatestFrom(preiszuweisungen$, (preiserheber, preiszuweisungen) => ({ preiserheber, preiszuweisungen }))
            .withLatestFrom(this.preismeldestellen$, ({ preiserheber, preiszuweisungen }, preismeldestellen) => ({ preiserheber, preiszuweisungen, preismeldestellen }))
            .map(({ preiserheber, preiszuweisungen, preismeldestellen }) => {
                return preismeldestellen;
                // const alreadyAssigned = _.reduce(preiszuweisungen, (prev, curr) => {
                //     return curr.preiserheberId !== preiserheber._id ? prev.concat(curr.preismeldestellen) : prev;
                // }, []);
                // return preismeldestellen.filter(x => alreadyAssigned.indexOf(x.pmsNummer) === -1);
            });

        const assignment$ = this.assignClicked$
            .filter(() => this.form.valid)
            .map(() => ({ preiserheber: <P.Erheber>this.form.get('preiserheber').value, preismeldestellen: <P.AdvancedPreismeldestelle[]>this.form.get('preismeldestellen').value }))
            .publishReplay(1).refCount();

        this.peAssigned$ = assignment$
            .flatMap(x => dropDatabase(x.preiserheber._id).then(db => ({ preiserheber: x.preiserheber, preismeldestellen: x.preismeldestellen })))
            .flatMap(({ preiserheber, preismeldestellen }) =>
                Observable.from(
                    preismeldestellen.map(pms =>
                        getDatabase('preismeldungen').then(db =>
                            db.allDocs(Object.assign({}, { include_docs: true }, getAllDocumentsForPrefix(`pm-ref/${pms.pmsNummer}`)))
                        ).then(result => <(P.Preismeldung & P.CouchProperties)[]>result.rows.map(row => Object.assign({}, row.doc, { _rev: undefined })))
                    )
                ).combineAll<(P.Preismeldung & P.CouchProperties)[][]>().map(allProducts =>
                    getDatabase('warenkorb')
                        .then(
                        warenkorbDb => warenkorbDb.allDocs({ include_docs: true })
                            .then(result => result.rows.map(row => Object.assign({}, row.doc, { _rev: undefined })))
                            .then(warenkorbProducts =>
                                getDatabase(preiserheber._id).then(db => {
                                    const erheber = Object.assign({}, preiserheber, { _id: 'erheber', _rev: undefined });
                                    const products = allProducts.reduce((acc, x) => acc.concat(x));
                                    const warenkorb = { _id: 'warenkorb', products: warenkorbProducts };
                                    return db.bulkDocs(<any>{
                                        docs: [
                                            erheber,
                                            ...preismeldestellen,
                                            ...products,
                                            warenkorb
                                        ]
                                    }).then(() => ({ preiserheber, preismeldestellen }));
                                })
                            )
                        )
                    ).flatMap(x => x)
            )
            .flatMap(({ preiserheber, preismeldestellen }) =>
                putUserToDatabase(http, preiserheber._id, { members: { names: [preiserheber._id] } })
                    .map(() => getDatabase('preiszuweisungen').then(db =>
                        db.get(preiserheber._id).then(doc => db.remove(<any>doc).then(_ => null).catch(_ => null)).catch(_ => null)
                        .then(_ => db.put({ _id: preiserheber._id, preismeldestellen }))
                    ))
            )
            .map(() => true)
            .startWith(false);

        this.store.dispatch({ type: 'PREISMELDESTELLE_LOAD' });
        this.store.dispatch({ type: 'PREISERHEBER_LOAD' });
    }

    private getSelectedPreiserheberId() {
        const erheber = this.form.get('preiserheber').value;
        return !!erheber ? erheber._id : null;
    }
}

import { Component, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import * as PouchDB from 'pouchdb';
import * as pouchDbAuthentication from 'pouchdb-authentication';
import { Observable, ReplaySubject } from 'rxjs';

import * as M from '../../common-models';
import * as fromRoot from '../../reducers';
import { getPreiserhebers } from '../../reducers/index';
import { getCurrentPreiserheber, CurrentPreiserheber } from '../../reducers/preiserheber';

PouchDB.plugin(pouchDbAuthentication);

@Component({
    templateUrl: 'preiserheber.html'
})
export class PreiserheberPage {
    public preiserhebers$ = this.store.select(fromRoot.getPreiserhebers);
    public currentPreiserheber$ = this.store.select(fromRoot.getCurrentPreiserheber).publishReplay(1).refCount();
    public selectPreiserheber$ = new EventEmitter<M.Erheber>();
    public clearSelectedPreiserheber$ = new EventEmitter();
    public save$ = new EventEmitter();
    public formValueChanged$ = new EventEmitter<string>();

    public form: FormGroup;

    // public preiserheberList$: Observable<M.Erheber[]>;

    // public preiserheberListRefresh$ = new ReplaySubject<Observable<Erheber>>();
    // public preiserheberSaveClicked$ = new EventEmitter<Event>();
    // public preiserheberEditClicked$ = new EventEmitter<Erheber>();

    constructor(private formBuilder: FormBuilder, private store: Store<fromRoot.AppState>) {
        // this.save$
        //     .subscribe(x => store.dispatch({ type: 'SAVE_PREISERHEBER' }));
            // why do I need this setTimeout - is it an Ionic bug?
            // .subscribe(x => setTimeout(() => store.dispatch({ type: 'SAVE_PREISERHEBER' })));
        
        const requestSelectPreiserheber$ = this.selectPreiserheber$
            .withLatestFrom(this.currentPreiserheber$.startWith(null), (selectedPreiserheber: M.Erheber, currentPreiserheber: M.CurrentPreiserheber) => ({
                selectedPreiserheber,
                currentPreiserheber,
                isCurrentModified: !!currentPreiserheber && currentPreiserheber.isModified
            }));

        requestSelectPreiserheber$
            .filter(x => !x.isCurrentModified)
            .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISERHEBER', payload: x.selectedPreiserheber._id }));
        
        this.clearSelectedPreiserheber$
            .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISERHEBER', payload: null}))

        this.form = formBuilder.group({
            firstName: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
            surname: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
            personFunction: [null, Validators.required],
            languageCode: ['de', Validators.required],
            telephone: [null],
            email: [null]
        });

        const distinctPreiserheber$ = this.currentPreiserheber$
            .filter(x => !!x)
            .distinctUntilKeyChanged('_id');
        
        distinctPreiserheber$
            .subscribe(erheber => {
                this.form.patchValue({
                    id: erheber._id,
                    firstName: erheber.firstName,
                    surname: erheber.surname,
                    personFunction: erheber.personFunction,
                    languageCode: erheber.languageCode,
                    telephone: erheber.telephone,
                    email: erheber.email
                });
            });
        
        this.formValueChanged$
            .subscribe(x => store.dispatch({ type: 'UPDATE_CURRENT_PREISERHEBER', payload: this.form.value }))
        
        const canSave$ = this.save$
            .map(x => ({ isValid: this.form.valid }))
            .publishReplay(1).refCount();
        
        canSave$.filter(x => x.isValid)
            .publishReplay(1).refCount()
            .withLatestFrom(this.save$)
            .subscribe(x => store.dispatch({ type: 'SAVE_PREISERHEBER' }));

        // this.preiserheberList$ = this.preiserheberListRefresh$
        //     .flatMap(x => x)
        //     .map<Erheber[]>(x => {
        //         const list = <Erheber[]>x.rows.filter(pe => pe != null).map(pe => pe.doc)
        //         if (this.isEditing()) this.preiserheberDetail = _.first(list.filter(x => x._id == this.preiserheberDetail._id))
        //         return list;
        //     });

        // this.preiserheberSaveClicked$
        //     .flatMap(_ => Observable.fromPromise(
        //         this.couch.put(this.createPreiserheberDocument(this.preiserheberDetail))
        //             .then(x => x)
        //             .catch(_ => Observable.of(null))
        //     ))
        //     .subscribe(x => {
        //         this.reloadList();
        //     });
        
        // this.preiserheberEditClicked$
        //     .do(x => console.log("clicked", x))
        //     .subscribe(erheber => this.preiserheberDetail = erheber);

        // this.reloadList();
    }

    // public reloadList() {
    //     this.preiserheberListRefresh$.next(
    //         Observable.fromPromise<Erheber>(
    //             this.couch.allDocs({ startkey: "erheber:", endkey: "erheber:\uffff", include_docs: true }).then().catch(_ => Observable.of([]))
    //         )
    //     );
    // }

    public isEditing() {
        return this.currentPreiserheber$.map(x => !!x && !!x._id);
    }

    // private createPreiserheberDocument(erheber: Erheber) {
    //     return Object.assign({}, this.preiserheberDetail, { _id: erheber._id || `erheber:${erheber.firstName}_${erheber.surname}` });
    // }

    // private getPreiserheberList(couch: PouchDB.Database<{}>) {
    //     return 
    // }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'PREISERHEBER_LOAD' });
    }
}

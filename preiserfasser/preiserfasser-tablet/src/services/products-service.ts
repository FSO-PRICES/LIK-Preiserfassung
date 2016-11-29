import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Http } from '@angular/http';

import * as P from '../preiserfasser-types';

@Injectable()
export class ProductsService {
    constructor(private http: Http) {
    }

    loadProducts(): Observable<P.Product[]> {
        return this.http.get('assets/data/products.json')
            .catch(err => ([]))
            .map(res => res.json() as P.Product[]);
    }
}

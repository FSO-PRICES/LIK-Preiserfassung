import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class ProductsService {
    constructor(private http: Http) {
    }

    loadProducts(): Observable<any[]> {
        // return Observable.of([[{ name: { de: 'barfoo' } }]]);
        return this.http.get('assets/data/products.json')
            .map(res => res.json());
    }

}

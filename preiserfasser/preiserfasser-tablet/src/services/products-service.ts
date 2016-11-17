import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Http } from '@angular/http';

@Injectable()
export class ProductsService {
    constructor(private http: Http) {
    }

    loadProducts(): Observable<any[]> {
        return this.http.get('assets/data/products.json')
            .map(res => res.json());
    }
}

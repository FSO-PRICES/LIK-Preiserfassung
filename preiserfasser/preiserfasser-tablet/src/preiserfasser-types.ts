import { ProductsService } from './services/products-service';
import { Product } from './reducers/productReducer';

export interface AppState {
    products: Product[];
}

export {
    ProductsService
}

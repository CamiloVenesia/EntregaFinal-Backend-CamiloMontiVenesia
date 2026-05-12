import { productModel } from '../../models/Product.js';

export default class ProductDAO {
    
    async getProducts(filter = {}, options = {}) {
        try {
            return await productModel.paginate(filter, options);
        } catch (error) {
            throw new Error(`Error al obtener productos: ${error.message}`);
        }
    }

    async getProductById(id) {
        try {
            return await productModel.findById(id);
        } catch (error) {
            throw new Error(`Error al buscar producto: ${error.message}`);
        }
    }

    async createProduct(product) {
        try {
            return await productModel.create(product);
        } catch (error) {
            throw new Error(`Error al crear producto: ${error.message}`);
        }
    }

    async updateProduct(id, product) {
        try {
            return await productModel.findByIdAndUpdate(id, product, { new: true });
        } catch (error) {
            throw new Error(`Error al actualizar producto: ${error.message}`);
        }
    }

    async deleteProduct(id) {
        try {
            return await productModel.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`Error al eliminar producto: ${error.message}`);
        }
    }
}
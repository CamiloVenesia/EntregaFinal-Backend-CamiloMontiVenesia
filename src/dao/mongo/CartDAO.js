import cartModel from '../../models/CartModel.js';

export default class CartDAO {
    async createCart() {
        try {
            return await cartModel.create({ products: [] });
        } catch (error) {
            throw new Error(`Error al crear el carrito: ${error.message}`);
        }
    }

    async getCartById(id) {
        try {
            return await cartModel.findOne({ _id: id }).populate('products.product');
        } catch (error) {
            throw new Error(`Error al obtener el carrito: ${error.message}`);
        }
    }

    async updateCart(id, cartData) {
        try {
            return await cartModel.updateOne({ _id: id }, cartData);
        } catch (error) {
            throw new Error(`Error al actualizar el carrito: ${error.message}`);
        }
    }
}
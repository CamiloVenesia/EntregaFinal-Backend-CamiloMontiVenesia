import fs from 'fs/promises';

export default class CartManager {
    constructor() {
        this.path = './src/dao/fs/carts.json';
    }

    async readFile() {
        try {
            const data = await fs.readFile(this.path, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    async createCart() {
        const carts = await this.readFile();
        
        const newId = carts.length > 0 ? carts[carts.length - 1].id + 1 : 1;
        
        const newCart = {
            id: newId,
            products: []
        };

        carts.push(newCart);
        await fs.writeFile(this.path, JSON.stringify(carts, null, 2));
        
        return newCart;
    }

    async getCartById(id) {
        const carts = await this.readFile();
        const cart = carts.find(c => c.id === id);
        
        if (!cart) throw new Error('Carrito no encontrado en el sistema de archivos');
        return cart;
    }

    async addProductToCart(cartId, productId) {
        const carts = await this.readFile();
        const cartIndex = carts.findIndex(c => c.id === cartId);

        if (cartIndex === -1) throw new Error('Carrito no encontrado');

        const productIndex = carts[cartIndex].products.findIndex(p => p.product === productId);

        if (productIndex !== -1) {
            carts[cartIndex].products[productIndex].quantity++;
        } else {
            carts[cartIndex].products.push({ product: productId, quantity: 1 });
        }

        await fs.writeFile(this.path, JSON.stringify(carts, null, 2));
        return carts[cartIndex];
    }
}
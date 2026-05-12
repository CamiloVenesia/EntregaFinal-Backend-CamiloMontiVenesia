import fs from 'fs/promises';

export default class ProductManager {
    constructor() {
        this.path = './src/dao/fs/products.json';
    }

    async readFile() {
        try {
            const data = await fs.readFile(this.path, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    async getProducts() {
        return await this.readFile();
    }

    async getProductById(id) {
        const products = await this.readFile();
        const product = products.find(p => p.id === id);
        
        if (!product) throw new Error('Producto no encontrado en el sistema de archivos');
        return product;
    }

    async addProduct(product) {
        const products = await this.readFile();
        
        if (products.some(p => p.code === product.code)) {
            throw new Error('El código del producto ya existe');
        }

        const newId = products.length > 0 ? products[products.length - 1].id + 1 : 1;
        
        const newProduct = {
            id: newId,
            status: true,
            ...product
        };

        products.push(newProduct);
        await fs.writeFile(this.path, JSON.stringify(products, null, 2));
        
        return newProduct;
    }

    async updateProduct(id, updatedFields) {
        const products = await this.readFile();
        const index = products.findIndex(p => p.id === id);
        
        if (index === -1) throw new Error('Producto no encontrado para actualizar');

        const { id: _, ...fieldsToUpdate } = updatedFields;

        products[index] = { ...products[index], ...fieldsToUpdate };
        await fs.writeFile(this.path, JSON.stringify(products, null, 2));
        
        return products[index];
    }

    async deleteProduct(id) {
        const products = await this.readFile();
        const index = products.findIndex(p => p.id === id);
        
        if (index === -1) throw new Error('Producto no encontrado para eliminar');

        products.splice(index, 1);
        await fs.writeFile(this.path, JSON.stringify(products, null, 2));
        
        return true;
    }
}
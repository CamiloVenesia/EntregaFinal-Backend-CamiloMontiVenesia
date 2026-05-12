import { Router } from 'express';
import ProductDAO from '../dao/mongo/ProductDAO.js';

const router = Router();
const productDAO = new ProductDAO();

// Función auxiliar para emitir eventos de WebSockets
const emitirActualizacionWebSockets = async (req) => {
    try {
        const updatedProducts = await productDAO.getProducts({}, { limit: 100, lean: true });
        req.app.get('socketio').emit('productosIniciales', updatedProducts.docs);
    } catch (error) {
        console.error("Error al emitir actualización de WebSockets:", error.message);
    }
};

// 1. GET /api/products (Listar con filtros y paginación)
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const sortOrder = req.query.sort; 
        const queryParam = req.query.query; 

        const options = { limit, page, lean: true };
        if (sortOrder) options.sort = { price: sortOrder === 'desc' ? -1 : 1 };

        let filter = {};
        if (queryParam) {
            if (queryParam.toLowerCase() === 'true' || queryParam.toLowerCase() === 'false') {
                filter.status = queryParam.toLowerCase() === 'true';
            } else {
                filter.category = queryParam;
            }
        }

        const result = await productDAO.getProducts(filter, options);

        const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
        const buildLink = (pageNumber) => {
            if (!pageNumber) return null;
            let link = `${baseUrl}?limit=${limit}&page=${pageNumber}`;
            if (sortOrder) link += `&sort=${sortOrder}`;
            if (queryParam) link += `&query=${queryParam}`;
            return link;
        };

        res.json({
            status: "success",
            payload: result.docs,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: buildLink(result.prevPage),
            nextLink: buildLink(result.nextPage)
        });

    } catch (error) {
        res.status(500).json({ status: "error", error: "Error al obtener productos: " + error.message });
    }
});

// 2. GET /api/products/:pid (Obtener por ID)
router.get('/:pid', async (req, res) => {
    try {
        const product = await productDAO.getProductById(req.params.pid);
        if (!product) return res.status(404).json({ status: "error", error: "Producto no encontrado" });
        res.json({ status: "success", payload: product });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
});

// 3. POST /api/products (Crear)
router.post('/', async (req, res) => {
    try {
        const newProduct = await productDAO.createProduct(req.body);
        await emitirActualizacionWebSockets(req);
        res.status(201).json({ status: "success", payload: newProduct });
    } catch (error) {
        res.status(400).json({ status: "error", error: error.message });
    }
});

// 4. PUT /api/products/:pid (Actualizar)
router.put('/:pid', async (req, res) => {
    try {
        const { _id, ...updateData } = req.body;
        const updatedProduct = await productDAO.updateProduct(req.params.pid, updateData);
        if (!updatedProduct) return res.status(404).json({ status: "error", error: "Producto no encontrado para actualizar" });
        
        await emitirActualizacionWebSockets(req);
        res.json({ status: "success", payload: updatedProduct });
    } catch (error) {
        res.status(400).json({ status: "error", error: error.message });
    }
});

// 5. DELETE /api/products/:pid (Borrar)
router.delete('/:pid', async (req, res) => {
    try {
        const deletedProduct = await productDAO.deleteProduct(req.params.pid);
        if (!deletedProduct) return res.status(404).json({ status: "error", error: "Producto no encontrado para eliminar" });

        await emitirActualizacionWebSockets(req);
        res.json({ status: "success", message: "Producto eliminado exitosamente" });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Error al intentar eliminar el producto" });
    }
});

export default router;
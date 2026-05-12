import { Router } from 'express';
import ProductDAO from '../dao/mongo/ProductDAO.js';
import CartDAO from '../dao/mongo/CartDAO.js';
import { isAuth, isUser, isAdmin } from '../middlewares/auth.js';

const router = Router();
const productDAO = new ProductDAO();
const cartDAO = new CartDAO();

// --- REDIRECCIÓN INICIAL ---
router.get('/', (req, res) => {
    res.redirect('/products');
});

// --- AUTENTICACIÓN ---
router.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/products');
    res.render('register');
});

router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/products');
    res.render('login');
});

// --- CATÁLOGO PÚBLICO ---
router.get('/products', async (req, res) => {
    try {
        const { page = 1, limit = 12, sort } = req.query;
        
        const options = { page: parseInt(page), limit: parseInt(limit), lean: true };
        if (sort) {
            options.sort = { price: sort === 'asc' ? 1 : -1 };
        }

        const result = await productDAO.getProducts({}, options);
        
        res.render('products', {
            products: result.docs,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: result.hasPrevPage ? `/products?page=${result.prevPage}&limit=${limit}${sort ? `&sort=${sort}` : ''}` : null,
            nextLink: result.hasNextPage ? `/products?page=${result.nextPage}&limit=${limit}${sort ? `&sort=${sort}` : ''}` : null,
            page: result.page,
            totalPages: result.totalPages,
            user: req.session.user
        });
    } catch (error) {
        res.status(500).render('error', { message: "Error interno al cargar el catálogo de productos" });
    }
});

// --- DETALLE DE PRODUCTO ---
router.get('/products/:pid', async (req, res) => {
    try {
        const product = await productDAO.getProductById(req.params.pid);
        if (!product) return res.status(404).render('error', { message: "Producto no encontrado" });

        const productoLimpio = JSON.parse(JSON.stringify(product));

        res.render('productDetail', {
            product: productoLimpio,
            user: req.session.user
        });
    } catch (error) {
        res.status(500).render('error', { message: "Error interno al procesar el detalle del producto" });
    }
});

// --- CARRITO (Usuarios con rol 'user') ---
router.get('/carts/:cid', isAuth, isUser, async (req, res) => {
    try {
        const cart = await cartDAO.getCartById(req.params.cid);
        if (!cart) return res.status(404).render('error', { message: "Carrito de compras no encontrado" });
        
        const carritoLimpio = JSON.parse(JSON.stringify(cart));
        carritoLimpio.products = (carritoLimpio.products || []).filter(item => item.product !== null);

        // Cálculo del total usando reduce (Mejor práctica JS)
        const totalCarrito = carritoLimpio.products.reduce((acc, item) => {
            item.subtotal = item.product.price * item.quantity;
            return acc + item.subtotal;
        }, 0);

        res.render('cart', { 
            cart: carritoLimpio, 
            totalCarrito,
            user: req.session.user 
        });
    } catch (error) {
        res.status(500).render('error', { message: "Error interno al cargar el carrito de compras" });
    }
});

// --- GESTIÓN EN VIVO (Administradores) ---
router.get('/realtimeproducts', isAuth, isAdmin, async (req, res) => {
    res.render('realTimeProducts', { user: req.session.user });
});

export default router;
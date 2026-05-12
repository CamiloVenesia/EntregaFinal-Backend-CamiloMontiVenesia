import { Router } from 'express';
import CartDAO from '../dao/mongo/CartDAO.js';
import ProductDAO from '../dao/mongo/ProductDAO.js';
import TicketDAO from '../dao/mongo/TicketDAO.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const cartDAO = new CartDAO();
const productDAO = new ProductDAO();
const ticketDAO = new TicketDAO();

// --- CONFIGURACIÓN DE SERVICIO DE EMAIL ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 1. Crear carrito (POST /api/carts)
router.post('/', async (req, res) => {
    try {
        const result = await cartDAO.createCart();
        res.status(201).json({ status: "success", payload: result });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});

// 2. Obtener carrito por ID (GET /api/carts/:cid)
router.get('/:cid', async (req, res) => {
    try {
        const cart = await cartDAO.getCartById(req.params.cid);
        if (!cart) return res.status(404).json({ status: "error", error: "Carrito no encontrado" });
        res.json({ status: "success", payload: cart });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});

// 3. Agregar producto al carrito (POST /api/carts/:cid/products/:pid)
router.post('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const cart = await cartDAO.getCartById(cid);
        if (!cart) return res.status(404).json({ status: "error", error: "Carrito no encontrado" });

        const productIndex = cart.products.findIndex(p => p.product._id.toString() === pid);
        if (productIndex !== -1) {
            cart.products[productIndex].quantity += 1;
        } else {
            cart.products.push({ product: pid, quantity: 1 });
        }

        await cartDAO.updateCart(cid, cart);
        res.json({ status: "success", message: "Producto agregado exitosamente", payload: cart });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});

// 4. Actualizar cantidad de producto (PUT /api/carts/:cid/products/:pid)
router.put('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { quantity } = req.body; 
        
        const cart = await cartDAO.getCartById(cid);
        if (!cart) return res.status(404).json({ status: "error", error: "Carrito no encontrado" });

        const productIndex = cart.products.findIndex(p => p.product._id.toString() === pid);
        if (productIndex !== -1) {
            cart.products[productIndex].quantity = quantity; 
        } else {
            return res.status(404).json({ status: "error", error: "Producto no encontrado en el carrito" });
        }

        await cartDAO.updateCart(cid, cart);
        res.json({ status: "success", message: "Cantidad actualizada correctamente" });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});

// 5. Eliminar producto del carrito (DELETE /api/carts/:cid/products/:pid)
router.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const cart = await cartDAO.getCartById(cid);
        if (!cart) return res.status(404).json({ status: "error", error: "Carrito no encontrado" });

        cart.products = cart.products.filter(p => p.product._id.toString() !== pid);

        await cartDAO.updateCart(cid, cart);
        res.json({ status: "success", message: "Producto removido del carrito" });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});

// 6. Vaciar carrito (DELETE /api/carts/:cid)
router.delete('/:cid', async (req, res) => {
    try {
        const cart = await cartDAO.getCartById(req.params.cid);
        if (!cart) return res.status(404).json({ status: "error", error: "Carrito no encontrado" });
        
        cart.products = [];
        await cartDAO.updateCart(req.params.cid, cart);
        res.json({ status: "success", message: "Carrito vaciado exitosamente" });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});

// 7. FINALIZAR COMPRA Y EMITIR TICKET (POST /api/carts/:cid/purchase)
router.post('/:cid/purchase', async (req, res) => {
    try {
        const cart = await cartDAO.getCartById(req.params.cid);
        if (!cart) return res.status(404).json({ status: "error", error: "Carrito no encontrado" });

        let totalAmount = 0;
        let productosNoComprados = []; 

        for (let item of cart.products) {
            if (!item.product) continue;

            const productEnDB = await productDAO.getProductById(item.product._id);
            
            if (productEnDB && productEnDB.stock >= item.quantity) {
                productEnDB.stock -= item.quantity;
                await productDAO.updateProduct(productEnDB._id, productEnDB);
                
                totalAmount += (productEnDB.price * item.quantity);
            } else {
                productosNoComprados.push(item);
            }
        }

        let ticketInfo = null;
        if (totalAmount > 0) {
            const codigoUnico = `TICKET-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
            const emailComprador = req.session.user ? req.session.user.email : 'cliente@no-registrado.com';

            const ticketData = {
                code: codigoUnico,
                amount: totalAmount,
                purchaser: emailComprador 
            };

            ticketInfo = await ticketDAO.createTicket(ticketData);

            // ENVÍO DE EMAIL 
            try {
                await transporter.sendMail({
                    from: `"CoderStore Oficial" <${process.env.EMAIL_USER}>`,
                    to: emailComprador,
                    subject: '🧾 Confirmación de compra - CoderStore',
                    html: `
                        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 4px; background-color: #ffffff;">
                            <h2 style="color: #000; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px;">CoderStore</h2>
                            <h3 style="color: #333; font-weight: normal; margin-top: 0;">Confirmación de Pedido</h3>
                            
                            <p style="color: #555; line-height: 1.6;">Hola, gracias por elegirnos. Tu pedido ha sido procesado exitosamente y ya lo estamos preparando para el envío.</p>
                            
                            <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #000; margin: 25px 0;">
                                <p style="margin: 8px 0; font-size: 0.9rem; color: #666; text-transform: uppercase; letter-spacing: 1px;">Referencia Ticket</p>
                                <p style="margin: 0 0 15px 0; font-weight: bold; color: #000;">${codigoUnico}</p>
                                
                                <p style="margin: 8px 0; font-size: 0.9rem; color: #666; text-transform: uppercase; letter-spacing: 1px;">Total Pagado</p>
                                <p style="margin: 0 0 15px 0; font-size: 1.4rem; color: #000; font-weight: bold;">$${totalAmount}</p>
                                
                                <p style="margin: 8px 0; font-size: 0.9rem; color: #666; text-transform: uppercase; letter-spacing: 1px;">Cuenta Asociada</p>
                                <p style="margin: 0; color: #000;">${emailComprador}</p>
                            </div>
                            
                            <p style="color: #888; font-size: 0.8rem; text-align: center; margin-top: 30px;">
                                © 2026 CoderStore. Todos los derechos reservados.
                            </p>
                        </div>
                    `
                });
                console.log("Notificación de compra enviada a:", emailComprador);
            } catch (mailError) {
                console.error("Error al despachar el correo de confirmación:", mailError);
            }
        }

        cart.products = productosNoComprados;
        await cartDAO.updateCart(req.params.cid, cart);

        if (productosNoComprados.length === 0) {
            res.json({ status: "success", message: "Transacción completada al 100%", ticket: ticketInfo });
        } else {
            res.json({ status: "partial", message: "Compra parcial: Stock insuficiente en algunos artículos", ticket: ticketInfo, noComprados: productosNoComprados });
        }

    } catch (error) {
        console.error("Fallo crítico en proceso de purchase:", error);
        res.status(500).json({ status: "error", error: "Error en el sistema de pagos" });
    }
});

export default router;
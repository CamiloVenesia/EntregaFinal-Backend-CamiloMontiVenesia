import { Router } from 'express';
import { userModel } from '../models/user.model.js';
import { createHash, isValidPassword } from '../utils/hash.js';
import CartDAO from '../dao/mongo/CartDAO.js';

const router = Router();
const cartDAO = new CartDAO();

// --- REGISTRO DE USUARIO ---
router.post('/register', async (req, res) => {
    const { first_name, last_name, email, age, password } = req.body;
    try {
        const existeUsuario = await userModel.findOne({ email });
        if (existeUsuario) {
            return res.status(400).json({ status: "error", error: "El correo electrónico ingresado ya se encuentra registrado." });
        }

        const nuevoCarrito = await cartDAO.createCart();

        const newUser = {
            first_name, 
            last_name, 
            email, 
            age,
            password: createHash(password),
            cart: nuevoCarrito._id,
            role: email === 'admin@coder.com' ? 'admin' : 'user'
        };

        await userModel.create(newUser);
        res.json({ status: "success", message: "Cuenta creada exitosamente. Ya puedes iniciar sesión." });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Error del servidor al intentar registrar la cuenta." });
    }
});

// --- AUTENTICACIÓN / LOGIN ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user || !isValidPassword(user, password)) {
            return res.status(401).json({ status: "error", error: "Credenciales inválidas. Verifica tu correo y contraseña." });
        }

        req.session.user = {
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            age: user.age,
            cart: user.cart,
            role: user.role
        };

        res.json({ status: "success", message: "Autenticación exitosa." });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Fallo interno en el sistema de autenticación." });
    }
});

// --- DESTRUCCIÓN DE SESIÓN ---
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if(err) return res.status(500).send("Fallo al intentar cerrar la sesión. Intente nuevamente.");
        res.redirect('/products');
    });
});

export default router;
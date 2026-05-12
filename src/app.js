import express from 'express';
import mongoose from 'mongoose';
import { engine } from 'express-handlebars';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { Server } from 'socket.io';

// Importación de Rutas y DAO
import sessionsRouter from './routes/sessions.router.js';
import productsRouter from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';
import viewsRouter from './routes/views.router.js';
import ProductDAO from './dao/mongo/ProductDAO.js';

// Inicialización de variables de entorno
dotenv.config();

const app = express();
// Usamos el puerto del entorno de producción, o el 8080 en local
const PORT = process.env.PORT || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middlewares Principales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, '..', 'public')));

// Configuración del Motor de Plantillas (Handlebars)
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', join(__dirname, 'views'));

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('🟢 Conectado a MongoDB de forma segura'))
    .catch((error) => {
        console.error('🔴 Error crítico al conectar con MongoDB:', error);
        process.exit(1); // Detiene el servidor si no hay base de datos
    });

// Configuración de Sesiones con MongoStore
app.use(session({
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL,
        ttl: 3600 // 1 hora de duración
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Endpoints / Rutas
app.use('/', viewsRouter);
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/api/sessions', sessionsRouter);

// Inicialización del Servidor HTTP
const httpServer = app.listen(PORT, () => {
    console.log(`🚀 Servidor en línea: http://localhost:${PORT}`);
});

// Configuración de WebSockets (Panel en Vivo)
const io = new Server(httpServer);
app.set('socketio', io);

const productDAO = new ProductDAO();

io.on('connection', async (socket) => {
    console.log('🔌 Nuevo cliente conectado a WebSockets');
    
    try {
        const result = await productDAO.getProducts({}, { limit: 100, lean: true });
        socket.emit('productosIniciales', result.docs);

        socket.on('agregarProducto', async (nuevoProducto, callback) => {
            try {
                await productDAO.createProduct(nuevoProducto);
                const actualizados = await productDAO.getProducts({}, { limit: 100, lean: true });
                io.emit('productosActualizados', actualizados.docs);
                if (callback) callback({ status: 'success' }); 
            } catch (error) {
                console.error("Error al agregar producto:", error.message);
                if (callback) callback({ status: 'error', message: error.message }); 
            }
        });

        socket.on('editarProducto', async (data, callback) => {
            try {
                const { id, ...camposActualizados } = data;
                await productDAO.updateProduct(id, camposActualizados);
                const actualizados = await productDAO.getProducts({}, { limit: 100, lean: true });
                io.emit('productosActualizados', actualizados.docs);
                if (callback) callback({ status: 'success' }); 
            } catch (error) {
                console.error("Error al editar producto:", error.message);
                if (callback) callback({ status: 'error', message: error.message }); 
            }
        });

        socket.on('eliminarProducto', async (idProducto) => {
            try {
                await productDAO.deleteProduct(idProducto);
                const actualizados = await productDAO.getProducts({}, { limit: 100, lean: true });
                io.emit('productosActualizados', actualizados.docs);
            } catch (error) {
                console.error("Error al borrar producto:", error.message);
            }
        });

    } catch (error) {
        console.error("Error general en WebSockets:", error.message);
    }
});
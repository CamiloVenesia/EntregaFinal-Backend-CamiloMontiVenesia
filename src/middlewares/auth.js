/**
 * Middleware para verificar si el usuario está autenticado.
 * Si no hay sesión activa, redirige al login.
 */
export const isAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
};

/**
 * Middleware para verificar si el usuario tiene rol 'user'.
 * Restringe el acceso a funciones de compra para administradores.
 */
export const isUser = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'user') {
        return next();
    }
    res.redirect('/products'); 
};

/**
 * Middleware para verificar si el usuario tiene rol 'admin'.
 * Restringe el acceso al panel de gestión en vivo.
 */
export const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.redirect('/products'); 
};
import bcrypt from 'bcrypt';

/**
 * Genera un hash seguro para la contraseña utilizando bcrypt.
 * @param {string} password - Contraseña en texto plano.
 * @returns {string} Contraseña encriptada.
 */
export const createHash = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

/**
 * Compara una contraseña en texto plano con el hash guardado en la base de datos.
 * @param {Object} user - Objeto de usuario que contiene la contraseña encriptada.
 * @param {string} password - Contraseña ingresada por el usuario.
 * @returns {boolean} Resultado de la comparación.
 */
export const isValidPassword = (user, password) => {
    return bcrypt.compareSync(password, user.password);
};
# 🚀 CoderStore - Proyecto Final Backend

Proyecto final desarrollado para el curso de Backend de Coderhouse. Consiste en una API RESTful robusta para un e-commerce, con persistencia en MongoDB, arquitectura DAO, y comunicación en tiempo real.

## ⚙️ Funcionalidades Principales y Flujo de Uso

El ecosistema de la página permite un flujo de compra completo (End-to-End):
1. **Catálogo y Filtros:** Los usuarios pueden navegar por los productos, filtrarlos y ver detalles con paginación incorporada.
2. **Carrito y Checkout:** Solo los usuarios registrados pueden agregar productos a su carrito. Al finalizar la compra (endpoint `/purchase`), el sistema verifica el stock, genera un Ticket de compra en formato JSON y **envía automáticamente un comprobante por correo electrónico** al usuario con los detalles de su pedido.
3. **Panel de Administración (Tiempo Real):** A través de WebSockets (`Socket.io`), los administradores pueden crear, editar o eliminar productos desde la vista "En Vivo", actualizando el catálogo para todos los clientes al instante sin necesidad de recargar la página.

## 🔐 Credenciales de Acceso (Testing)

Para que el tutor o la IA evaluadora puedan probar el panel de administración y las restricciones de rutas, se pueden utilizar las siguientes credenciales de prueba:
- **Rol:** Administrador
- **Email:** `admin@coder.com`
- **Contraseña:** `12345`

*(Nota de validación: Los perfiles con rol de administrador tienen restringida la acción de agregar productos al carrito y realizar compras).*

## 🛠️ Tecnologías Utilizadas
- **Core:** Node.js, Express.js
- **Base de Datos:** MongoDB (Mongoose), FileSystem (Patrón DAO)
- **Motores de Plantilla:** Handlebars
- **Comunicación Real-Time:** Socket.io
- **Autenticación y Seguridad:** MongoStore, bcrypt, validación de roles
- **Mailing:** Nodemailer (Envío de tickets)

## 📥 Guía de Instalación Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/CamiloVenesia/EntregaFinal-Backend-CamiloMontiVenesia.git

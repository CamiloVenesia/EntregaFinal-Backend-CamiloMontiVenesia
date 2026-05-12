const socket = io();

const contenedorProductos = document.getElementById('contenedorProductos');
const formAgregarProducto = document.getElementById('formAgregarProducto');
const formEditarProducto = document.getElementById('formEditarProducto');

let listaProductosGlobal = [];

// 1. Escuchar los productos (al conectar o al actualizarse)
socket.on('productosIniciales', renderizarProductos);
socket.on('productosActualizados', renderizarProductos);

function renderizarProductos(productos) {
    listaProductosGlobal = productos;
    contenedorProductos.innerHTML = ''; 
    
    if (productos.length === 0) {
        contenedorProductos.innerHTML = `<div class="col-12 text-center text-muted py-5 text-uppercase" style="letter-spacing:1px; font-size:0.8rem;">Inventario Vacío</div>`;
        return;
    }

    productos.forEach(prod => {
        const div = document.createElement('div');
        div.className = 'col';
        
        const imgUrl = prod.thumbnails && prod.thumbnails[0] ? prod.thumbnails[0] : 'https://via.placeholder.com/300x300?text=SIN+IMAGEN';

        div.innerHTML = `
            <div class="card h-100 border-0 rounded-0 bg-transparent" style="cursor: default;">
                
                <div class="position-absolute top-0 end-0 m-2 d-flex gap-2" style="z-index: 10;">
                    <button onclick="abrirModalEditar('${prod._id}')" class="btn btn-light rounded-0 shadow-sm border border-secondary d-flex justify-content-center align-items-center" style="width: 32px; height: 32px; transition:all 0.2s;" title="Editar">
                        <i class="bi bi-pencil-fill text-dark"></i>
                    </button>
                    <button onclick="borrarProducto('${prod._id}')" class="btn btn-dark rounded-0 shadow-sm d-flex justify-content-center align-items-center" style="width: 32px; height: 32px; transition:all 0.2s;" title="Eliminar">
                        <i class="bi bi-trash-fill text-white"></i>
                    </button>
                </div>

                <div class="position-relative overflow-hidden bg-light" style="height: 220px;">
                    <img src="${imgUrl}" class="w-100 h-100" style="object-fit: cover;">
                </div>
                
                <div class="card-body p-3 px-0 d-flex flex-column">
                    <span class="text-uppercase text-muted fw-bold mb-1" style="font-size: 0.65rem; letter-spacing: 1.5px;">
                        ${prod.category}
                    </span>
                    <h6 class="fw-bold text-dark mb-1 text-truncate" style="font-size: 0.95rem;">${prod.title}</h6>
                    
                    <div class="mt-auto pt-2 d-flex justify-content-between align-items-end">
                        <span class="text-dark fw-bold" style="font-size: 1.1rem;">$${prod.price}</span>
                        <small class="text-muted text-uppercase" style="font-size: 0.7rem; letter-spacing:1px;">Stock: ${prod.stock}</small>
                    </div>
                </div>
            </div>
        `;
        contenedorProductos.appendChild(div);
    });
}

// 2. AGREGAR Producto
formAgregarProducto.addEventListener('submit', (e) => {
    e.preventDefault();

    const nuevoProducto = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        price: Number(document.getElementById('price').value),
        stock: Number(document.getElementById('stock').value),
        code: document.getElementById('code').value,
        category: document.getElementById('category').value,
        thumbnails: [document.getElementById('thumbnail').value],
        status: true
    };

    socket.emit('agregarProducto', nuevoProducto, (respuesta) => {
        if (respuesta.status === 'success') {
            formAgregarProducto.reset();
            Swal.fire({
                toast: true, position: 'bottom-end', icon: 'success', 
                title: 'Producto publicado', showConfirmButton: false, timer: 2000, iconColor:'#000'
            });
        } else {
            Swal.fire({ icon: 'error', title: 'Error al publicar', text: respuesta.message, confirmButtonColor: '#000' });
        }
    });
});

// 3. EDITAR Producto
function abrirModalEditar(id) {
    const prod = listaProductosGlobal.find(p => p._id === id);
    if (!prod) return;

    document.getElementById('editId').value = prod._id;
    document.getElementById('editTitle').value = prod.title;
    document.getElementById('editDescription').value = prod.description;
    document.getElementById('editPrice').value = prod.price;
    document.getElementById('editStock').value = prod.stock;
    document.getElementById('editCode').value = prod.code; 
    document.getElementById('editCategory').value = prod.category;
    document.getElementById('editThumbnail').value = prod.thumbnails && prod.thumbnails[0] ? prod.thumbnails[0] : '';

    const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
    modal.show();
}

formEditarProducto.addEventListener('submit', (e) => {
    e.preventDefault();

    const datosEditados = {
        id: document.getElementById('editId').value,
        title: document.getElementById('editTitle').value,
        description: document.getElementById('editDescription').value,
        price: Number(document.getElementById('editPrice').value),
        stock: Number(document.getElementById('editStock').value),
        category: document.getElementById('editCategory').value,
        thumbnails: [document.getElementById('editThumbnail').value]
    };

    socket.emit('editarProducto', datosEditados, (respuesta) => {
        if (respuesta.status === 'success') {
            bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
            Swal.fire({
                toast: true, position: 'bottom-end', icon: 'success', 
                title: 'Cambios guardados', showConfirmButton: false, timer: 2000, iconColor:'#000'
            });
        } else {
            Swal.fire({ icon: 'error', title: 'Error al editar', text: respuesta.message, confirmButtonColor:'#000' });
        }
    });
});

// 4. BORRAR Producto
function borrarProducto(id) {
    Swal.fire({
        title: 'ELIMINAR PRODUCTO',
        text: "Esta acción es irreversible",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#000',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'ELIMINAR',
        cancelButtonText: 'CANCELAR'
    }).then((result) => {
        if (result.isConfirmed) {
            socket.emit('eliminarProducto', id);
            Swal.fire({
                toast: true, position: 'bottom-end', icon: 'error', 
                title: 'Producto eliminado', showConfirmButton: false, timer: 2000, iconColor: '#000'
            });
        }
    });
}
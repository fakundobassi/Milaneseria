// --- LÓGICA DEL CARRUSEL ---
function moverCarousel(idCarousel, direccion) {
    const carousel = document.getElementById(idCarousel);
    const inner = carousel.querySelector('.carousel-inner');
    const imagenes = inner.querySelectorAll('img');
    const totalImagenes = imagenes.length;

    // Obtenemos el índice actual donde está el carrusel
    let indexActual = parseInt(carousel.getAttribute('data-index')) || 0;

    // Sumamos o restamos dependiendo del botón (1 o -1)
    indexActual += direccion;

    // Si llegamos al final, volvemos a la primera. Si retrocedemos en la primera, vamos a la última.
    if (indexActual >= totalImagenes) indexActual = 0;
    if (indexActual < 0) indexActual = totalImagenes - 1;

    // Guardamos el nuevo índice
    carousel.setAttribute('data-index', indexActual);

    // Movemos el contenedor interno (cada imagen ocupa el 100% de ancho)
    const desplazamiento = -(indexActual * 100);
    inner.style.transform = `translateX(${desplazamiento}%)`;
}

function actualizarControlesCarrusel() {
    const carousels = document.querySelectorAll('.carousel');

    carousels.forEach(carousel => {
        const inner = carousel.querySelector('.carousel-inner');
        const imagenes = inner.querySelectorAll('img');
        const controles = carousel.querySelectorAll('.carousel-btn');

        if (imagenes.length <= 1) {
            controles.forEach(control => control.style.display = 'none');
        } else {
            controles.forEach(control => control.style.display = 'block');
        }
    });
}

function inicializarCarruselesTactiles() {
    actualizarControlesCarrusel();

    const carousels = document.querySelectorAll('.carousel');
    let touchStartX = 0;

    carousels.forEach(carousel => {
        carousel.addEventListener('touchstart', event => {
            touchStartX = event.changedTouches[0].clientX;
        }, {
            passive: true
        });

        carousel.addEventListener('touchend', event => {
            const touchEndX = event.changedTouches[0].clientX;
            const distancia = touchEndX - touchStartX;
            const umbral = 40;

            if (Math.abs(distancia) >= umbral) {
                moverCarousel(carousel.id, distancia < 0 ? 1 : -1);
            }
        }, {
            passive: true
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    inicializarCarruselesTactiles();
    actualizarContadorCarrito();
    actualizarEstadoApertura();
    setInterval(actualizarEstadoApertura, 60000);
});

function obtenerEstadoApertura() {
    const ahora = new Date();
    const dia = ahora.getDay();
    const hora = ahora.getHours();
    const minutos = ahora.getMinutes();
    const minutosTotales = hora * 60 + minutos;
    const apertura = 19 * 60;
    const cierre = 23 * 60 + 30;
    const diasAbiertos = [0, 3, 4, 5, 6]; // Domingo, Miércoles, Jueves, Viernes, Sábado
    const estaDiaAbierto = diasAbiertos.includes(dia);
    const estaHorarioValido = minutosTotales >= apertura && minutosTotales <= cierre;
    const abierto = estaDiaAbierto && estaHorarioValido;

    let mensaje;
    if (abierto) {
        mensaje = '¡Estamos tomando pedidos!';
    } else if (dia === 1 || dia === 2) {
        mensaje = 'Cerrado. Abrimos el Miércoles a las 19:00hs';
    } else {
        mensaje = 'Abrimos a las 19:00hs';
    }

    return {
        abierto,
        mensaje
    };
}

function actualizarEstadoApertura() {
    const statusBox = document.querySelector('.opening-status');
    const statusText = document.getElementById('opening-status-text');
    if (!statusBox || !statusText) return;

    const {
        abierto,
        mensaje
    } = obtenerEstadoApertura();
    statusText.textContent = mensaje;
    statusBox.classList.toggle('status-open', abierto);
    statusBox.classList.toggle('status-closed', !abierto);
}

// --- LÓGICA DEL CARRITO (Mantén lo que ya tenías debajo de esto) ---



let carrito = [];
let total = 0;

function agregarAlCarrito(nombreVariedad, idContenedor) {
    // 1. Encontrar la tarjeta (card) específica en el HTML
    const tarjeta = document.getElementById(idContenedor);

    // 2. Leer la opción base seleccionada (ej: XL Carne)
    const selectBase = tarjeta.querySelector('.opciones-base');
    const textoBase = selectBase.options[selectBase.selectedIndex].text.split(' - ')[0]; // Obtiene solo el nombre, ej: "XL Carne (Para 3)"
    const precioBase = parseInt(selectBase.value);

    // 3. Variables para sumar los extras
    let precioSubtotal = precioBase;
    let listaExtras = [];

    // 4. Buscar cantidades de huevos (inputs de número)
    const inputsNumero = tarjeta.querySelectorAll('input[type="number"].extra-quantity');
    inputsNumero.forEach(input => {
        const cantidad = parseInt(input.value) || 0;
        if (cantidad > 0) {
            const precio = parseInt(input.getAttribute('data-price'));
            const nombre = input.getAttribute('data-name');
            precioSubtotal += cantidad * precio;
            listaExtras.push(`${nombre} x${cantidad}`);
        }
    });

    // 5. Buscar qué checkboxes de extras están marcados (Fritas y Cheddar)
    const checkboxes = tarjeta.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
        precioSubtotal += parseInt(cb.value);
        listaExtras.push(cb.getAttribute('data-name'));
    });

    // 6. Armar el nombre final del producto para el ticket
    let nombreFinal = `${nombreVariedad} | ${textoBase}`;
    if (listaExtras.length > 0) {
        nombreFinal += ` (+ Extras: ${listaExtras.join(', ')})`;
    }

    // 7. Agregar al arreglo del carrito
    carrito.push({
        nombre: nombreFinal,
        precio: precioSubtotal
    });

    total += precioSubtotal;

    // 8. Mostrar en pantalla y desmarcar los campos para el próximo pedido
    actualizarVistaCarrito();
    checkboxes.forEach(cb => cb.checked = false);
    inputsNumero.forEach(input => input.value = 0);
}

function actualizarVistaCarrito() {
    const lista = document.getElementById('lista-carrito');
    const montoTotal = document.getElementById('monto-total');

    lista.innerHTML = '';

    if (carrito.length === 0) {
        lista.innerHTML = '<p class="carrito-vacio">El carrito está vacío. ¡Agrega unas milanesas!</p>';
    } else {
        carrito.forEach((item, index) => {
            const li = document.createElement('li');
            const precioFormateado = item.precio.toLocaleString('es-AR');

            // Crear contenedor para el item y el botón
            const itemContainer = document.createElement('div');
            itemContainer.className = 'cart-item-container';

            // Texto del item
            const itemText = document.createElement('span');
            itemText.textContent = `${item.nombre} .................... $${precioFormateado}`;
            itemText.className = 'cart-item-text';

            // Botón de eliminar
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.className = 'delete-item-btn';
            deleteBtn.onclick = () => eliminarDelCarrito(index);
            deleteBtn.title = 'Eliminar producto';

            itemContainer.appendChild(itemText);
            itemContainer.appendChild(deleteBtn);
            li.appendChild(itemContainer);
            lista.appendChild(li);
        });
    }

    montoTotal.textContent = total.toLocaleString('es-AR');

    // Actualizar el contador del botón flotante
    actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
    const cartCount = document.getElementById('cart-count');
    cartCount.textContent = carrito.length;
}

function actualizarVistaModalCarrito() {
    const lista = document.getElementById('modal-lista-carrito');
    const montoTotal = document.getElementById('modal-monto-total');

    lista.innerHTML = '';

    if (carrito.length === 0) {
        lista.innerHTML = '<p class="carrito-vacio">El carrito está vacío. ¡Agrega unas milanesas!</p>';
    } else {
        carrito.forEach((item, index) => {
            const li = document.createElement('li');
            const precioFormateado = item.precio.toLocaleString('es-AR');

            // Crear contenedor para el item y el botón
            const itemContainer = document.createElement('div');
            itemContainer.className = 'cart-item-container';

            // Texto del item
            const itemText = document.createElement('span');
            itemText.textContent = `${item.nombre} .................... $${precioFormateado}`;
            itemText.className = 'cart-item-text';

            // Botón de eliminar
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.className = 'delete-item-btn';
            deleteBtn.onclick = () => eliminarDelCarrito(index);
            deleteBtn.title = 'Eliminar producto';

            itemContainer.appendChild(itemText);
            itemContainer.appendChild(deleteBtn);
            li.appendChild(itemContainer);
            lista.appendChild(li);
        });
    }

    montoTotal.textContent = total.toLocaleString('es-AR');
}

function eliminarDelCarrito(index) {
    if (index >= 0 && index < carrito.length) {
        // Restar el precio del total
        total -= carrito[index].precio;

        // Eliminar el item del array
        carrito.splice(index, 1);

        // Actualizar las vistas
        actualizarVistaCarrito();
        actualizarVistaModalCarrito();
    }
}

function abrirModalCarrito() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = 'flex';

    // Sincronizar dirección del carrito principal al modal
    const mainDeliveryInput = document.getElementById('delivery-address');
    const modalDeliveryInput = document.getElementById('modal-delivery-address');
    if (mainDeliveryInput && modalDeliveryInput) {
        modalDeliveryInput.value = mainDeliveryInput.value;
    }

    actualizarVistaModalCarrito();
}

function cerrarModalCarrito() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = 'none';

    // Sincronizar dirección del modal al carrito principal
    const mainDeliveryInput = document.getElementById('delivery-address');
    const modalDeliveryInput = document.getElementById('modal-delivery-address');
    if (mainDeliveryInput && modalDeliveryInput) {
        mainDeliveryInput.value = modalDeliveryInput.value;
    }
}

// Cerrar modal al hacer clic fuera de ella
window.onclick = function (event) {
    const modal = document.getElementById('cart-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};
// --- FUNCIONALIDAD DE DRAG PARA EL BOTÓN FLOTANTE ---
document.addEventListener('DOMContentLoaded', function () {
    inicializarCarruselesTactiles();
    actualizarContadorCarrito();
    inicializarDragCarrito();
});

function inicializarDragCarrito() {
    const btn = document.getElementById('floating-cart-btn');
    let isDragging = false;
    let startX, startY, initialX, initialY;
    let hasMoved = false;

    // Cargar posición guardada y verificar si es válida
    const savedPos = localStorage.getItem('cartBtnPos');
    if (savedPos) {
        const pos = JSON.parse(savedPos);
        // Verificar si la posición está dentro de la pantalla
        const btnSize = window.innerWidth <= 480 ? 40 : 50;
        if (pos.left >= 0 && pos.top >= 0 && pos.left + btnSize <= window.innerWidth && pos.top + btnSize <= window.innerHeight) {
            btn.style.left = pos.left + 'px';
            btn.style.top = pos.top + 'px';
            btn.style.right = 'auto';
        } else {
            // Resetear posición si está fuera de la pantalla
            localStorage.removeItem('cartBtnPos');
            btn.style.left = 'auto';
            btn.style.top = '20px';
            btn.style.right = '20px';
        }
    }

    // Prevenir click si se movió
    btn.addEventListener('click', (e) => {
        if (hasMoved) {
            e.preventDefault();
            e.stopPropagation();
        }
    });

    // Desktop drag
    btn.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);

    // Mobile drag
    btn.addEventListener('touchstart', startDrag, {
        passive: false
    });
    document.addEventListener('touchmove', drag, {
        passive: false
    });
    document.addEventListener('touchend', endDrag);

    function startDrag(e) {
        isDragging = true;
        hasMoved = false;
        const event = e.touches ? e.touches[0] : e;
        startX = event.clientX;
        startY = event.clientY;
        const rect = btn.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        btn.style.cursor = 'grabbing';
    }

    function drag(e) {
        if (!isDragging) return;
        const event = e.touches ? e.touches[0] : e;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        // Solo considerar drag si movimiento > 5px
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            hasMoved = true;
            const newX = initialX + dx;
            const newY = initialY + dy;

            // Limitar dentro de la ventana
            const btnSize = window.innerWidth <= 480 ? 40 : 50;
            const maxX = window.innerWidth - btnSize;
            const maxY = window.innerHeight - btnSize;
            const clampedX = Math.max(0, Math.min(newX, maxX));
            const clampedY = Math.max(0, Math.min(newY, maxY));

            btn.style.left = clampedX + 'px';
            btn.style.top = clampedY + 'px';
            btn.style.right = 'auto';
            e.preventDefault();
        }
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        btn.style.cursor = 'move';

        if (hasMoved) {
            // Guardar posición solo si se movió
            const rect = btn.getBoundingClientRect();
            localStorage.setItem('cartBtnPos', JSON.stringify({
                left: rect.left,
                top: rect.top
            }));
        }
    }
}

function enviarWhatsApp() {
    if (carrito.length === 0) {
        alert("¡Debes agregar al menos una milanesa al carrito!");
        return;
    }

    const numero = "5492345548607";
    const fecha = new Date().toLocaleString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Obtener dirección de envío (del modal si está abierto, sino del carrito principal)
    let direccionEnvio = '';
    const modalDeliveryInput = document.getElementById('modal-delivery-address');
    const mainDeliveryInput = document.getElementById('delivery-address');

    if (modalDeliveryInput && modalDeliveryInput.value.trim()) {
        direccionEnvio = modalDeliveryInput.value.trim();
    } else if (mainDeliveryInput && mainDeliveryInput.value.trim()) {
        direccionEnvio = mainDeliveryInput.value.trim();
    }

    let mensaje = `🍕 *LA MILANESERÍA - NUEVO PEDIDO* 🍕\n\n`;
    mensaje += `📅 *Fecha y hora:* ${fecha}\n\n`;
    mensaje += `📋 *DETALLE DEL PEDIDO:*\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    carrito.forEach((item, index) => {
        const precioFormateado = item.precio.toLocaleString('es-AR');
        mensaje += `${index + 1}. *${item.nombre}*\n`;
        mensaje += `   💰 Valor: $${precioFormateado}\n\n`;
    });

    mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    const totalFormateado = total.toLocaleString('es-AR');
    const totalConEnvio = direccionEnvio ? `$${totalFormateado} +envío` : `$${totalFormateado}`;
    mensaje += `💵 *TOTAL A ABONAR: ${totalConEnvio}*\n\n`;

    if (direccionEnvio) {
        mensaje += `🏠 *DIRECCIÓN DE ENVÍO:* ${direccionEnvio}\n\n`;
    }

    mensaje += `📍 *Por favor, indícame:*\n`;
    if (!direccionEnvio) {
        mensaje += `   • Dirección de entrega\n`;
    }
    mensaje += `   • Método de pago preferido\n\n`;
    mensaje += `🙏 ¡Gracias por elegirnos! Esperamos verte pronto.`;

    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    mostrarConfirmacionWhatsApp(url);
}

function mostrarConfirmacionWhatsApp(url) {
    cerrarModalCarrito();
    const confirmationModal = document.getElementById('confirmation-modal');
    confirmationModal.style.display = 'flex';
    setTimeout(() => {
        confirmationModal.style.display = 'none';
        window.open(url, '_blank');
    }, 5000);
}

function cerrarConfirmacion() {
    const confirmationModal = document.getElementById('confirmation-modal');
    confirmationModal.style.display = 'none';
}
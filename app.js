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

document.addEventListener('DOMContentLoaded', inicializarCarruselesTactiles);

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
        carrito.forEach((item) => {
            const li = document.createElement('li');
            // Formateamos el número para que se vea con los puntos de los miles
            const precioFormateado = item.precio.toLocaleString('es-AR');
            li.textContent = `${item.nombre} .................... $${precioFormateado}`;
            lista.appendChild(li);
        });
    }

    montoTotal.textContent = total.toLocaleString('es-AR');
}

function enviarWhatsApp() {
    if (carrito.length === 0) {
        alert("¡Debes agregar al menos una milanesa al carrito!");
        return;
    }

    const numero = "5492345548607";
    let mensaje = "¡Hola La Milanesería! 👋 Me gustaría hacer el siguiente pedido:\n\n";

    carrito.forEach(item => {
        const precioFormateado = item.precio.toLocaleString('es-AR');
        mensaje += `🔸 *${item.nombre}* \n   Valor: $${precioFormateado}\n\n`;
    });

    const totalFormateado = total.toLocaleString('es-AR');
    mensaje += `*TOTAL A ABONAR: $${totalFormateado}*`;

    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}
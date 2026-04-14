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

    // 4. Buscar qué checkboxes de extras están marcados
    const checkboxes = tarjeta.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
        precioSubtotal += parseInt(cb.value);
        listaExtras.push(cb.getAttribute('data-name'));
    });

    // 5. Armar el nombre final del producto para el ticket
    let nombreFinal = `${nombreVariedad} | ${textoBase}`;
    if (listaExtras.length > 0) {
        nombreFinal += ` (+ Extras: ${listaExtras.join(', ')})`;
    }

    // 6. Agregar al arreglo del carrito
    carrito.push({
        nombre: nombreFinal,
        precio: precioSubtotal
    });

    total += precioSubtotal;

    // 7. Mostrar en pantalla y desmarcar los checkboxes para el próximo pedido
    actualizarVistaCarrito();
    checkboxes.forEach(cb => cb.checked = false);
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
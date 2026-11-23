// app.js - UI, pre-permiso y consumo de geo-helper.js

const $ = (id) => document.getElementById(id);

const btnAdjuntar = $('btn-adjuntar');
const tarjetaPre = $('tarjeta-prepermiso');
const btnConfirmar = $('btn-confirmar');
const btnCancelar = $('btn-cancelar');
const estadoEl = $('estado');
const resultado = $('resultado');
const manual = $('selector-manual');
const ayudaDenegado = $('ayuda-denegado');
const zonaGuardada = $('zona-guardada');

function mostrarEstado(texto, tipo) {
    estadoEl.textContent = texto;
    estadoEl.className = 'estado ' + (tipo || '');
    estadoEl.hidden = !texto;
}

function ocultarTodo() {
    tarjetaPre.hidden = true;
    manual.hidden = true;
    ayudaDenegado.hidden = true;
    resultado.hidden = true;
    mostrarEstado('');
}

function habilitarSelectorManualZona(mostrarAyuda) {
    manual.hidden = false;
    ayudaDenegado.hidden = !mostrarAyuda;
}

function renderizarResultadoUbicacion(u) {
    const calidad = clasificarPrecision(u.precisionMetros);
    $('r-lat').textContent = u.latitud.toFixed(6);
    $('r-lon').textContent = u.longitud.toFixed(6);
    $('r-acc').textContent = u.precisionMetros + ' m';
    $('r-hora').textContent = new Date(u.timestamp).toLocaleTimeString();
    const badge = $('r-badge');
    badge.textContent = calidad.etiqueta;
    badge.className = 'badge ' + calidad.clase;
    resultado.hidden = false;
}

function leerUbicacion() {
    tarjetaPre.hidden = true;
    mostrarEstado('Obteniendo coordenadas...', 'cargando');
    btnAdjuntar.disabled = true;

    // Se ejecuta directamente desde un clic (requisito de iOS/Safari)
    return obtenerUbicacionActual({ enableHighAccuracy: true, timeout: 8000 })
        .then((ubicacion) => {
        mostrarEstado('Ubicación obtenida.', 'ok');
        renderizarResultadoUbicacion(ubicacion);
        })
        .catch((error) => {
        console.warn('[Geo] Fallback activado:', error.message);
        mostrarEstado(error.message, 'error');
        habilitarSelectorManualZona(error.codigo === 1);
        })
        .finally(() => {
        btnAdjuntar.disabled = false;
        });
}

btnAdjuntar.addEventListener('click', () => {
    ocultarTodo();
    consultarEstadoPermisoGeo().then((estado) => {
        if (estado === 'granted') {
        leerUbicacion();
        } else if (estado === 'denied') {
        mostrarEstado('El permiso de ubicación está bloqueado.', 'error');
        habilitarSelectorManualZona(true);
        } else {
        tarjetaPre.hidden = false; // 'prompt': explicar antes de pedir
        }
    });
});

btnConfirmar.addEventListener('click', leerUbicacion);

btnCancelar.addEventListener('click', () => {
    tarjetaPre.hidden = true;
    habilitarSelectorManualZona(false);
});

$('form-zona').addEventListener('submit', (e) => {
    e.preventDefault();
    const zona = $('zona').value;
    if (!zona) return;
    zonaGuardada.textContent = 'Zona seleccionada manualmente: ' + zona;
    zonaGuardada.hidden = false;
});

// Registro del Service Worker (rutas relativas)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('[SW] registrado:', reg.scope))
        .catch((err) => console.error('[SW] error:', err));
    });
}
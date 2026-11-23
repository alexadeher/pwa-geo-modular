// geo-helper.js - Módulo reutilizable de geolocalización (Vanilla JS, sin async/await)

function traducirErrorGeolocalizacion(error) {
    switch (error.code) {
        case 1: // PERMISSION_DENIED
        return 'Permiso de ubicación denegado. Puedes ingresar tu zona manualmente.';
        case 2: // POSITION_UNAVAILABLE
        return 'No fue posible determinar tu ubicación (señal GPS o Wi-Fi no disponible).';
        case 3: // TIMEOUT
        return 'Se agotó el tiempo de espera intentando obtener las coordenadas.';
        default:
        return 'Ocurrió un error inesperado al consultar la ubicación.';
    }
}

function obtenerUbicacionActual(opcionesPersonalizadas) {
    const opciones = Object.assign(
        {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000
        },
        opcionesPersonalizadas
    );

    return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
        reject(new Error('Este navegador no soporta la API de Geolocalización.'));
        return;
        }

        navigator.geolocation.getCurrentPosition(
        (posicion) => {
            resolve({
            latitud: posicion.coords.latitude,
            longitud: posicion.coords.longitude,
            precisionMetros: Math.round(posicion.coords.accuracy),
            timestamp: posicion.timestamp
            });
        },
        (error) => {
            const err = new Error(traducirErrorGeolocalizacion(error));
            err.codigo = error.code; // 1, 2 o 3, útil para decidir el Plan B
            reject(err);
        },
        opciones
        );
    });
}

function consultarEstadoPermisoGeo() {
    if (!('permissions' in navigator)) {
        return Promise.resolve('prompt');
    }
    return navigator.permissions.query({ name: 'geolocation' })
        .then((resultado) => resultado.state) // 'granted' | 'denied' | 'prompt'
        .catch(() => 'prompt'); // Safari antiguo / entornos restringidos
}

// Clasifica la señal según el margen de error (accuracy) en metros
function clasificarPrecision(metros) {
    if (metros < 30) {
        return { etiqueta: 'Precisión GPS Alta', clase: 'alta' };
    }
    return { etiqueta: 'Ubicación Aproximada (Wi-Fi / IP)', clase: 'aprox' };
}
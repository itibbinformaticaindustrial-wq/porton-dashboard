// ============================================================
// emergencia.js - Overlay de emergencia
// ITIBB - Informática Industrial
// ============================================================
// emergenciaRemotaLocal se define aquí porque emergencia.js
// carga ANTES que mqtt-client.js y necesita acceder a ella.
// mqtt-client.js la actualiza directamente al recibir MQTT.
// ============================================================

let emergenciaActivaLocal  = false;
let emergenciaRemotaLocal  = false;  // ← DEFINIDA AQUÍ, actualizada desde mqtt-client.js

function mostrarEmergencia(mostrar) {
    const overlay     = document.getElementById('emergenciaOverlay');
    const divClave    = document.getElementById('emergenciaContrasena');
    const btnRecargar = document.getElementById('btnRecargarEmergencia');
    const infoTipo    = document.getElementById('emergenciaTipo');

    if (!overlay) {
        console.error("❌ No se encontró #emergenciaOverlay en el DOM");
        return;
    }

    console.log("mostrarEmergencia() →", mostrar, "| remota:", emergenciaRemotaLocal);

    if (mostrar) {
        overlay.style.display = 'flex';
        emergenciaActivaLocal = true;

        if (emergenciaRemotaLocal) {
            // Emergencia REMOTA → formulario de contraseña
            if (divClave)    divClave.style.display    = 'block';
            if (btnRecargar) btnRecargar.style.display = 'none';
            if (infoTipo)    infoTipo.textContent      = 'PARADA REMOTA ACTIVADA';
        } else {
            // Emergencia FÍSICA → solo informar, sin contraseña
            if (divClave)    divClave.style.display    = 'none';
            if (btnRecargar) btnRecargar.style.display = 'block';
            if (infoTipo)    infoTipo.textContent      = 'PARADA FÍSICA ACTIVADA';
        }

    } else {
        // ESP32 confirmó que la emergencia terminó → ocultar
        overlay.style.display = 'none';
        emergenciaActivaLocal = false;
        const campo = document.getElementById('contrasenaEmergencia');
        const error = document.getElementById('errorContrasena');
        if (campo) campo.value       = '';
        if (error) error.textContent = '';
    }
}

function desactivarEmergenciaRemotaUI() {
    const campo = document.getElementById('contrasenaEmergencia');
    const error = document.getElementById('errorContrasena');
    if (!campo) return;

    const contrasena = campo.value.trim();
    if (!contrasena) {
        if (error) error.textContent = '⚠️ Ingrese la contraseña';
        return;
    }

    if (typeof enviarComando === 'function') {
        enviarComando('DESACTIVAR_EMERGENCIA_REMOTA:' + contrasena);
    }

    if (error) error.textContent = '⏳ Verificando en el ESP32...';

    // Si en 4s el ESP32 no responde con emergenciaActiva:false → incorrecta
    setTimeout(() => {
        if (emergenciaActivaLocal) {
            if (error) error.textContent = '❌ Contraseña incorrecta';
        }
    }, 4000);
}

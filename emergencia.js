// ============================================================
// emergencia.js - Overlay de emergencia
// ITIBB - Informática Industrial
// ============================================================

let emergenciaActivaLocal = false;
let emergenciaRemotaLocal = false; // actualizada desde mqtt-client.js

function mostrarEmergencia(mostrar) {
    const overlay     = document.getElementById('emergenciaOverlay');
    const divClave    = document.getElementById('emergenciaContrasena');
    const btnRecargar = document.getElementById('btnRecargarEmergencia');
    const infoTipo    = document.getElementById('emergenciaTipo');

    if (!overlay) {
        console.error("❌ #emergenciaOverlay no encontrado en el DOM");
        return;
    }

    console.log("🚨 mostrarEmergencia:", mostrar, "| remota:", emergenciaRemotaLocal);

    if (mostrar) {
        // ✅ Activar con clase .visible (el CSS maneja display:flex)
        overlay.classList.add('visible');
        emergenciaActivaLocal = true;

        if (emergenciaRemotaLocal) {
            // Emergencia REMOTA → mostrar formulario de contraseña
            if (divClave)    divClave.style.display    = 'block';
            if (btnRecargar) btnRecargar.style.display = 'none';
            if (infoTipo)    infoTipo.textContent      = 'PARADA REMOTA ACTIVADA';
        } else {
            // Emergencia FÍSICA → solo informar
            if (divClave)    divClave.style.display    = 'none';
            if (btnRecargar) btnRecargar.style.display = 'block';
            if (infoTipo)    infoTipo.textContent      = 'PARADA FÍSICA ACTIVADA';
        }
    } else {
        // ✅ Ocultar quitando clase .visible
        overlay.classList.remove('visible');
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

    // Si en 4s el ESP32 no responde con emergenciaActiva:false,
    // la contraseña era incorrecta
    setTimeout(() => {
        if (emergenciaActivaLocal) {
            if (error) error.textContent = '❌ Contraseña incorrecta';
        }
    }, 4000);
}

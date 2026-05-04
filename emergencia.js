// ============================================================
// emergencia.js - Overlay de emergencia
// ITIBB - Informática Industrial
// ============================================================

let emergenciaActivaLocal = false;

function mostrarEmergencia(mostrar) {
    const overlay = document.getElementById('emergenciaOverlay');
    if (!overlay) return;

    if (mostrar) {
        // ✅ CORRECCIÓN: sin guarda — siempre actualizamos el tipo
        // por si cambió de física a remota o viceversa
        overlay.style.display = 'flex';
        emergenciaActivaLocal = true;

        const divClave    = document.getElementById('emergenciaContrasena');
        const btnRecargar = document.getElementById('btnRecargarEmergencia');
        const infoTipo    = document.getElementById('emergenciaTipo');

        if (emergenciaRemotaLocal) {
            // Emergencia REMOTA → formulario de contraseña
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
        // Ocultar — ESP32 confirmó que la emergencia terminó
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

    // Si en 4s el ESP32 no envía emergenciaActiva:false → contraseña incorrecta
    setTimeout(() => {
        if (emergenciaActivaLocal) {
            if (error) error.textContent = '❌ Contraseña incorrecta';
        }
    }, 4000);
}

// ============================================================
// emergencia.js - Lógica del overlay de emergencia
// ITIBB - Informática Industrial
// ============================================================
// NOTA: Este archivo define mostrarEmergencia y
// desactivarEmergenciaRemotaUI de forma ÚNICA.
// ui.js NO debe redefinir estas funciones.
// ============================================================

let emergenciaActivaLocal = false;

/**
 * Muestra u oculta el overlay de emergencia.
 * Si es emergencia remota: pide contraseña.
 * Si es física: muestra botón recargar y recarga automáticamente.
 */
function mostrarEmergencia(mostrar) {
    const overlay = document.getElementById('emergenciaOverlay');
    if (!overlay) return;

    if (mostrar) {
        if (emergenciaActivaLocal) return; // ya está mostrado
        overlay.style.display = 'flex';
        emergenciaActivaLocal = true;

        const divClave    = document.getElementById('emergenciaContrasena');
        const btnRecargar = document.getElementById('btnRecargarEmergencia');
        const infoTipo    = document.getElementById('emergenciaTipo');

        if (emergenciaRemotaLocal) {
            // Emergencia remota → formulario de contraseña
            if (divClave)    divClave.style.display    = 'block';
            if (btnRecargar) btnRecargar.style.display = 'none';
            if (infoTipo)    infoTipo.textContent      = 'PARADA REMOTA ACTIVADA';
        } else {
            // Emergencia física → solo informar y recargar
            if (divClave)    divClave.style.display    = 'none';
            if (btnRecargar) btnRecargar.style.display = 'block';
            if (infoTipo)    infoTipo.textContent      = 'PARADA FÍSICA ACTIVADA';
            setTimeout(() => location.reload(), 4000);
        }
    } else {
        if (!emergenciaActivaLocal) return;
        overlay.style.display = 'none';
        emergenciaActivaLocal = false;
        // Limpiar campo de contraseña
        const campo = document.getElementById('contrasenaEmergencia');
        if (campo) campo.value = '';
        const error = document.getElementById('errorContrasena');
        if (error) error.textContent = '';
    }
}

/**
 * Envía comando de desactivación de emergencia remota con contraseña.
 * La validación real la hace el ESP32; aquí solo manejamos el UI.
 */
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
        enviarComando(`DESACTIVAR_EMERGENCIA_REMOTA:${contrasena}`);
    }

    // Respuesta optimista: el ESP32 confirmará vía MQTT
    // Si la contraseña es incorrecta, el ESP32 NO enviará
    // emergenciaActiva:false, así que el overlay seguirá visible.
    if (error) error.textContent = '⏳ Verificando...';

    // Si en 3s no hubo respuesta positiva del ESP32, mostrar error
    setTimeout(() => {
        if (emergenciaActivaLocal) {
            if (error) error.textContent = '❌ Contraseña incorrecta';
        }
    }, 3000);
}

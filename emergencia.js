// ============================================================
// emergencia.js - Overlay de emergencia
// ITIBB - Informática Industrial
// ============================================================

// ✅ Protección: solo definir funciones si NO existen ya en window
// Esto evita sobrescribir las funciones de ui.js

if (typeof window.mostrarEmergencia === 'undefined') {
    
    let emergenciaActivaLocal = false;
    let emergenciaRemotaLocal = false;

    function mostrarEmergencia(mostrar) {
        console.log("🛑 mostrarEmergencia desde emergencia.js (legacy)");
        const overlay = document.getElementById('emergenciaOverlay');
        const divClave = document.getElementById('emergenciaContrasena');
        const btnRecargar = document.getElementById('btnRecargarEmergencia');
        const infoTipo = document.getElementById('emergenciaTipo');

        if (!overlay) return;

        if (mostrar) {
            overlay.classList.add('visible');
            emergenciaActivaLocal = true;

            if (emergenciaRemotaLocal) {
                if (divClave) divClave.style.display = 'block';
                if (btnRecargar) btnRecargar.style.display = 'none';
                if (infoTipo) infoTipo.textContent = 'PARADA REMOTA ACTIVADA';
            } else {
                if (divClave) divClave.style.display = 'none';
                if (btnRecargar) btnRecargar.style.display = 'block';
                if (infoTipo) infoTipo.textContent = 'PARADA FÍSICA ACTIVADA';
            }
        } else {
            overlay.classList.remove('visible');
            emergenciaActivaLocal = false;
            const campo = document.getElementById('contrasenaEmergencia');
            const error = document.getElementById('errorContrasena');
            if (campo) campo.value = '';
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

        setTimeout(() => {
            if (emergenciaActivaLocal) {
                if (error) error.textContent = '❌ Contraseña incorrecta';
            }
        }, 4000);
    }
    
    console.log("✅ emergencia.js cargado (modo legacy - sin conflictos)");
    
} else {
    console.log("⚠️ emergencia.js: funciones ya existen en ui.js, no se sobrescriben");
}

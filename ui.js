// ============================================================
// ui.js - Lógica de interfaz de usuario
// ITIBB - Informática Industrial
// ============================================================
// IMPORTANTE: mostrarMensaje, mostrarEmergencia y
// desactivarEmergenciaRemotaUI están definidas en otros archivos.
// Este archivo NO las redefine.
// ============================================================

let permisoEspecialLocal = false;
let adminAutorizado      = false;
let sincronizado         = false;
let panelAbierto         = true;

// ============================================================
// ESTADO DEL PORTÓN
// ============================================================
function updatePortonUI(estado) {
    const estadoDiv = document.getElementById('estadoPorton');
    const panel     = document.getElementById('puerta');       // .gate-panel
    const label     = document.getElementById('gateLabelInner');
    const btnAbrir  = document.getElementById('btnAbrir');
    const btnCerrar = document.getElementById('btnCerrar');

    if (!estadoDiv) return;

    if (estado === "ABIERTO") {
        estadoDiv.textContent = '🔓 PORTÓN ABIERTO';
        estadoDiv.className   = 'gate-status abierto';
        if (panel) panel.className = 'gate-panel abierto';
        if (label) {
            label.textContent = 'ABIERTO';
            label.style.color = 'rgba(74,222,128,0.9)';
        }
    } else if (estado === "CERRADO") {
        estadoDiv.textContent = '🔒 PORTÓN CERRADO';
        estadoDiv.className   = 'gate-status cerrado';
        if (panel) panel.className = 'gate-panel';
        if (label) {
            label.textContent = 'CERRADO';
            label.style.color = 'rgba(248,113,113,0.8)';
        }
    } else {
        estadoDiv.textContent = '⚠️ PORTÓN ENTREABIERTO';
        estadoDiv.className   = 'gate-status intermedio';
        if (panel) panel.className = 'gate-panel intermedio';
        if (label) {
            label.textContent = 'INTERMEDIO';
            label.style.color = 'rgba(251,191,36,0.9)';
        }
    }

    // Bloquear botones si fuera de horario y sin permiso
    const permitido = verificarAccesoActivo();
    if (btnAbrir)  { btnAbrir.disabled  = !permitido; btnAbrir.classList.toggle('btn-bloqueado',  !permitido); }
    if (btnCerrar) { btnCerrar.disabled = !permitido; btnCerrar.classList.toggle('btn-bloqueado', !permitido); }
}

// ============================================================
// CONFIGURACIÓN / TOGGLES / BADGES
// ============================================================
function updateConfiguracion(data) {
    // ✅ Nombres de campos exactos que publica el ESP32 en mqtt.h:
    // fotoHabilitado, modoAuto, botonFisicoHabilitado, pirHabilitado,
    // modoHorario, chapaActiva, emergenciaActiva, permisoEspecial

    const enHorario = verificarAccesoActivo();

    // Toggles — sincronizar estado real del ESP32
    setToggle('toggleFoto',    data.fotoHabilitado);
    setToggle('toggleAuto',    data.modoAuto);
    setToggle('toggleBoton',   data.botonFisicoHabilitado);
    setToggle('togglePIR',     data.pirHabilitado);
    setToggle('toggleHorario', data.modoHorario);

    // Bloquear toggles visualmente si fuera de horario
    // (el permiso especial los desbloquea)
    ['toggleFoto','toggleAuto','toggleBoton','togglePIR'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (enHorario) {
            el.classList.remove('disabled');
        } else {
            el.classList.add('disabled');
        }
    });
    // toggleHorario siempre disponible
    const th = document.getElementById('toggleHorario');
    if (th) th.classList.remove('disabled');

    // Badges
    setBadge('chapaBadge',  data.chapaActiva            ? '🔐 Chapa: ON'   : '🔐 Chapa: OFF',  data.chapaActiva            ? 'badge-on' : '');
    setBadge('botonBadge',  data.botonFisicoHabilitado   ? '🎮 Botón: ON'  : '🎮 Botón: OFF',  data.botonFisicoHabilitado  ? 'badge-on' : '');
    setBadge('pirBadge',    data.pirHabilitado           ? '🚶 PIR: ON'    : '🚶 PIR: OFF',    data.pirHabilitado          ? 'badge-on' : '');
    setBadge('horarioBadge',data.modoHorario             ? '⏰ Horario: ON': '⏰ Horario: FUERA',data.modoHorario           ? 'badge-on' : '');

    // Badge emergencia
    const eBadge = document.getElementById('emergenciaBadge');
    if (eBadge) {
        if (data.emergenciaActiva) {
            eBadge.textContent = '🛑 EMERGENCIA';
            eBadge.className   = 'badge badge-emergencia activa';
        } else {
            eBadge.textContent = '✅ Sin emergencia';
            eBadge.className   = 'badge badge-emergencia';
        }
    }

    // Permiso especial
    permisoEspecialLocal = !!data.permisoEspecial;
    const permisoDiv = document.getElementById('permisoEstado');
    if (permisoDiv) {
        permisoDiv.textContent = permisoEspecialLocal ? '🔑 Permiso especial activo' : '';
        permisoDiv.className   = permisoEspecialLocal ? 'permiso-estado activo' : 'permiso-estado';
    }

    // Banner horario
    const banner = document.getElementById('horarioBanner');
    if (banner) {
        banner.textContent = enHorario
            ? '✅ Horario activo — Acceso habilitado'
            : '⏰ Fuera del horario de acceso';
        banner.className = 'horario-banner ' + (enHorario ? 'horario-activo' : 'horario-inactivo');
    }

    // Estado del horario en el panel
    actualizarEstadoHorario();

    if (!sincronizado) {
        sincronizado = true;
        console.log("✅ Sincronizado con ESP32:", data);
        mostrarMensaje("✅ Sincronizado con ESP32");
    }
}

function setToggle(id, activo) {
    const el = document.getElementById(id);
    if (!el) return;
    if (activo) el.classList.add('active');
    else        el.classList.remove('active');
}

function setBadge(id, texto, claseExtra = '') {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = texto;
    // Limpiar clases dinámicas y agregar la nueva
    el.classList.remove('badge-on');
    if (claseExtra) el.classList.add(claseExtra);
}

// ============================================================
// SENSORES FINALES DE CARRERA
// ============================================================
function updateSensores(data) {
    const cardAbierto  = document.getElementById('sensorAbiertoBox');
    const cardCerrado  = document.getElementById('sensorCerradoBox');
    const valAbierto   = document.getElementById('sensorAbiertoVal');
    const valCerrado   = document.getElementById('sensorCerradoVal');

    if (valAbierto) valAbierto.textContent  = data.abierto  ? '🟢 Activo' : '⚪ Inactivo';
    if (valCerrado) valCerrado.textContent  = data.cerrado  ? '🟢 Activo' : '⚪ Inactivo';
    if (cardAbierto) cardAbierto.classList.toggle('activo', !!data.abierto);
    if (cardCerrado) cardCerrado.classList.toggle('activo', !!data.cerrado);
}

// ============================================================
// CONTADOR DE CICLOS
// ============================================================
function updateContador(data) {
    const el = document.getElementById('contadorValor');
    if (el && data.ciclos !== undefined) el.textContent = data.ciclos;
}

// ============================================================
// ESTADO DE CONEXIÓN
// ============================================================
function updateConnectionStatus(connected) {
    const statusText = document.getElementById('statusText');
    if (statusText) {
        statusText.innerHTML = connected
            ? '<span class="status-led online"></span> Conectado'
            : '<span class="status-led offline"></span> Desconectado';
    }
    actualizarBadgeMQTT(connected);
}

function actualizarBadgeMQTT(conectado) {
    const badge = document.getElementById('mqttBadge');
    if (!badge) return;
    badge.textContent = conectado ? '🌍 MQTT: OK' : '🌍 MQTT: Desconectado';
    badge.className   = conectado ? 'badge badge-mqtt badge-on' : 'badge badge-mqtt';
}

function updateEsp32Status(online) {
    const el = document.getElementById('esp32StatusText');
    if (el) {
        el.innerHTML = online
            ? '<span class="status-led online"></span> Conectado'
            : '<span class="status-led offline"></span> Sin respuesta';
    }
}

function iniciarHeartbeatCheck() {
    setInterval(() => {
        if (ultimoHeartbeat && Date.now() - ultimoHeartbeat > CONFIG.tiempos.heartbeatTimeout) {
            updateEsp32Status(false);
        }
    }, 5000);
}

// ============================================================
// TIMESTAMP
// ============================================================
function actualizarTimestamp(texto = null) {
    const ts = document.getElementById('timestamp');
    if (!ts) return;
    ts.textContent = texto || `🕐 Actualizado: ${new Date().toLocaleTimeString('es-BO')}`;
}

// ============================================================
// RELOJ (CORREGIDO - SIN LLAMADA HTTP)
// ============================================================
function iniciarReloj() {
    function tick() {
        const relojDiv = document.getElementById('reloj');
        if (!relojDiv) return;
        const ahora   = new Date();
        const fecha   = ahora.toLocaleDateString('es-BO', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
        const hora    = ahora.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        relojDiv.textContent = `${fecha}  ${hora}`;
        // ❌ ELIMINADO: No se envía hora al ESP32 (usa NTP o MQTT)
    }
    tick();
    setInterval(tick, 1000);
}

// ⚠️ FUNCIÓN DESHABILITADA - El ESP32 ya tiene su propia hora (NTP)
function enviarHoraAlESP32(ahora = new Date()) {
    // Esta función ya no es necesaria porque:
    // 1. La página está en HTTPS y el ESP32 en HTTP (bloqueado por Mixed Content)
    // 2. El ESP32 ya puede obtener la hora por NTP (Internet)
    // 3. Si se necesita sincronización, se puede hacer por MQTT
    return;
}

// ============================================================
// BOTONES PRINCIPALES
// ============================================================
function configurarBotones() {
    const btnAbrir  = document.getElementById('btnAbrir');
    const btnCerrar = document.getElementById('btnCerrar');
    if (btnAbrir)  btnAbrir.onclick  = () => { if (!btnAbrir.disabled)  enviarComando("ABRIR"); };
    if (btnCerrar) btnCerrar.onclick = () => { if (!btnCerrar.disabled) enviarComando("CERRAR"); };
}

// ============================================================
// PANEL COLAPSABLE DE SENSORES
// ============================================================
function togglePanel() {
    const content = document.getElementById('panelContent');
    const arrow   = document.getElementById('panelArrow');
    if (!content) return;
    panelAbierto = !panelAbierto;
    content.classList.toggle('collapsed', !panelAbierto);
    if (arrow) arrow.classList.toggle('collapsed', !panelAbierto);
}

// ============================================================
// TOGGLES DE SENSORES
// ============================================================
function toggleSensor()      { enviarComando("TOGGLE_FOTO");    }
function toggleModoAuto()    { enviarComando("TOGGLE_AUTO");    }
function toggleBotonFisico() { enviarComando("TOGGLE_BOTON");   }
function togglePIR()         { enviarComando("TOGGLE_PIR");     }
function toggleHorario()     { enviarComando("TOGGLE_HORARIO"); }

// ============================================================
// PERMISO ESPECIAL
// ============================================================
function activarPermisoConTiempo() {
    const input = document.getElementById('permisoMinutos');
    if (!input) return;
    let minutos = parseInt(input.value);
    if (isNaN(minutos) || minutos < 5)   minutos = 5;
    if (minutos > 120)                   minutos = 120;
    input.value = minutos;
    enviarComando(`ACTIVAR_PERMISO:${minutos}`);
    mostrarMensaje(`🔑 Permiso especial activado por ${minutos} min`);
}

// ============================================================
// ADMINISTRADOR
// ============================================================
function mostrarAdmin() {
    const pass = prompt("🔐 Contraseña de administrador:");
    if (!pass) return;
    if (pass === CONFIG.seguridad.claveAdmin) {
        adminAutorizado = true;
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) adminPanel.style.display = 'block';
        mostrarMensaje("🔓 Acceso ADMIN concedido");
    } else {
        alert("❌ Contraseña incorrecta");
    }
}

function abrirTemporalAdmin() {
    if (!adminAutorizado) {
        mostrarMensaje("⛔ No autorizado");
        return;
    }
    if (!confirm("¿Abrir el portón por 1 minuto?")) return;
    enviarComando("ADMIN_ABRIR");
    mostrarMensaje("🔓 Portón abierto por 1 minuto (ADMIN)");
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) adminPanel.style.display = 'none';
    adminAutorizado = false;
}

// ============================================================
// EMERGENCIA REMOTA
// ============================================================
function activarEmergenciaRemotaUI() {
    if (!confirm("⚠️ ¿Activar parada de emergencia remota?\nEsto detendrá el motor y bloqueará el portón.")) return;
    enviarComando("ACTIVAR_EMERGENCIA_REMOTA");
    mostrarMensaje("🛑 Activando emergencia remota...");
}

// ============================================================
// HORARIO — bloqueo visual fuera de horario
// ============================================================
function verificarAccesoActivo() {
    if (permisoEspecialLocal) return true;
    const ahora   = new Date();
    const dia     = ahora.getDay();
    const minutos = ahora.getHours() * 60 + ahora.getMinutes();
    const inicio  = CONFIG.horario.horaInicio * 60 + CONFIG.horario.minInicio;
    const fin     = CONFIG.horario.horaFin    * 60 + CONFIG.horario.minFin;
    return CONFIG.horario.diasActivos.includes(dia) && minutos >= inicio && minutos < fin;
}

function actualizarEstadoHorario() {
    const badge   = document.getElementById('horarioBadge');
    const btnP    = document.getElementById('btnPermiso');
    const acceso  = verificarAccesoActivo();

    if (badge) {
        badge.textContent = acceso ? '⏰ Horario: ACTIVO' : '⏰ Horario: FUERA';
        badge.className   = acceso ? 'badge badge-horario badge-on' : 'badge badge-horario';
    }

    // Panel de sensores — opacidad si está bloqueado
    const panel = document.getElementById('panelContent');
    if (panel) {
        panel.classList.toggle('fuera-horario', !acceso);
    }

    // Botón permiso siempre activo (para dar acceso desde fuera)
    if (btnP) {
        btnP.disabled   = false;
        btnP.title      = acceso ? 'Activo en horario normal' : 'Activar para acceder fuera de horario';
    }
}

// ============================================================
// HISTORIAL — Vista "Historial"
// ============================================================
function actualizarTablaHistorial() {
    const tbody    = document.getElementById('historyBody');
    const totalEl  = document.getElementById('totalEvents');
    const mesEl    = document.getElementById('monthEvents');
    const promEl   = document.getElementById('avgDaily');
    if (!tbody) return;

    const desde  = document.getElementById('dateFrom')?.value  || '';
    const hasta  = document.getElementById('dateTo')?.value    || '';
    const filtro = document.getElementById('eventTypeFilter')?.value || 'all';

    const eventos = cargarHistorial(filtro, desde, hasta);

    if (eventos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;opacity:0.6">Sin eventos registrados</td></tr>';
    } else {
        tbody.innerHTML = eventos.slice(0, 200).map(e => {
            const fecha = new Date(e.fecha).toLocaleString('es-BO');
            return `<tr>
                <td>${fecha}</td>
                <td>${e.tipo}</td>
                <td>${e.detalle || '—'}</td>
            </tr>`;
        }).join('');
    }

    // Estadísticas
    const todos = cargarHistorial();
    if (totalEl) totalEl.textContent = todos.length;

    const mesActual = new Date().getMonth();
    const estesMes  = todos.filter(e => new Date(e.fecha).getMonth() === mesActual);
    if (mesEl) mesEl.textContent = estesMes.length;

    // Promedio diario (últimos 7 días)
    const hace7 = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const ultimos7 = todos.filter(e => e.fecha >= hace7);
    if (promEl) promEl.textContent = Math.round(ultimos7.length / 7);
}

function filterHistory()  { actualizarTablaHistorial(); }
function resetFilters() {
    const desde  = document.getElementById('dateFrom');
    const hasta  = document.getElementById('dateTo');
    const filtro = document.getElementById('eventTypeFilter');
    if (desde)  desde.value  = '';
    if (hasta)  hasta.value  = '';
    if (filtro) filtro.value = 'all';
    actualizarTablaHistorial();
}

function clearEventsWithPassword() {
    const pass = prompt("🔐 Contraseña para eliminar historial:");
    if (!pass) return;
    if (pass === CONFIG.seguridad.claveAdmin) {
        if (confirm("¿Eliminar todo el historial? Esta acción no se puede deshacer.")) {
            limpiarHistorial();
            actualizarTablaHistorial();
            mostrarMensaje("🗑️ Historial eliminado");
        }
    } else {
        alert("❌ Contraseña incorrecta");
    }
}

// ============================================================
// INICIALIZACIÓN GLOBAL
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    // Actualizar estado de horario cada minuto
    actualizarEstadoHorario();
    setInterval(actualizarEstadoHorario, 60000);
});

console.log("✅ ui.js SmartGate cargado");

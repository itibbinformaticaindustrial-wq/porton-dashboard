// ============================================================
// mqtt-client.js - Conexión MQTT y manejo de mensajes
// ITIBB - Informática Industrial
// ============================================================

let client          = null;
let mqttConectado   = false;
let ultimoHeartbeat = 0;
let mensajeTimeout  = null;

// ============================================================
// CONEXIÓN
// ============================================================
function conectarMQTT() {
    const options = {
        username:        CONFIG.mqtt.username,
        password:        CONFIG.mqtt.password,
        clientId:        "smartgate_web_" + Math.random().toString(16).substring(2, 10),
        clean:           true,
        keepalive:       60,
        reconnectPeriod: CONFIG.tiempos.reconectar
    };

    client = mqtt.connect(CONFIG.mqtt.broker, options);

    client.on('connect', () => {
        console.log("✅ MQTT conectado");
        mqttConectado = true;
        updateConnectionStatus(true);
        actualizarBadgeMQTT(true);

        // Suscripciones existentes
        client.subscribe(CONFIG.mqtt.topics.estado);
        client.subscribe(CONFIG.mqtt.topics.sensores);
        client.subscribe(CONFIG.mqtt.topics.heartbeat);
        client.subscribe(CONFIG.mqtt.topics.contador);
        
        // 🆕 SUSCRIBIRSE AL TOPIC DE EMERGENCIA
        client.subscribe("porton/emergencia");
        console.log("📡 Suscrito a porton/emergencia");

        mostrarMensaje("🟢 Conectado — solicitando estado...");
        setTimeout(() => enviarComando("ESTADO"), 600);
    });

    client.on('message', (topic, message) => {
        const payload = message.toString();

        // 🆕 PROCESAR TOPIC DE EMERGENCIA (prioridad máxima)
        if (topic === "porton/emergencia") {
            console.log("🛑 EMERGENCIA recibida en topic específico:", payload);
            
            if (payload === "ACTIVA_FISICA") {
                console.log("🔴 Emergencia FÍSICA activada");
                if (typeof window.mostrarOverlayEmergencia === 'function') {
                    window.mostrarOverlayEmergencia(false);  // false = emergencia física
                }
            } else if (payload === "ACTIVA_REMOTA") {
                console.log("🔴 Emergencia REMOTA activada");
                if (typeof window.mostrarOverlayEmergencia === 'function') {
                    window.mostrarOverlayEmergencia(true);   // true = emergencia remota
                }
            } else if (payload === "DESACTIVADA") {
                console.log("🟢 Emergencia desactivada");
                if (typeof window.ocultarOverlayEmergencia === 'function') {
                    window.ocultarOverlayEmergencia();
                }
            }
            return;  // No procesar más este mensaje
        }

        // ── Heartbeat ─────────────────────────────────────────
        if (topic === CONFIG.mqtt.topics.heartbeat) {
            ultimoHeartbeat = Date.now();
            updateEsp32Status(true);
            return;
        }

        // ── Parsear JSON para los demás topics ─────────────────
        let data = null;
        try {
            data = JSON.parse(payload);
        } catch (e) {
            console.warn("JSON inválido:", payload);
            return;
        }

        // ── Procesar por topic ─────────────────────────────────
        if (topic === CONFIG.mqtt.topics.estado) {
            // ── EMERGENCIA (fallback por si no llega el topic específico) ──
            if (data.emergenciaActiva === true) {
                window.emergenciaRemotaLocal = (data.emergenciaRemotaActiva === true);
                console.log("🛑 Emergencia detectada (fallback) — remota:", window.emergenciaRemotaLocal);
                
                if (typeof window.mostrarOverlayEmergencia === 'function') {
                    window.mostrarOverlayEmergencia(window.emergenciaRemotaLocal);
                } else if (typeof mostrarEmergencia === 'function') {
                    mostrarEmergencia(true);
                }
            } else if (data.emergenciaActiva === false) {
                window.emergenciaRemotaLocal = false;
                console.log("✅ Emergencia desactivada (fallback)");
                
                if (typeof window.ocultarOverlayEmergencia === 'function') {
                    window.ocultarOverlayEmergencia();
                } else if (typeof mostrarEmergencia === 'function') {
                    mostrarEmergencia(false);
                }
            }

            // ── Estado del portón y configuración ─────────────
            if (data.estado) updatePortonUI(data.estado);
            updateConfiguracion(data);
            actualizarTimestamp();

        } else if (topic === CONFIG.mqtt.topics.sensores) {
            updateSensores(data);
        } else if (topic === CONFIG.mqtt.topics.contador) {
            updateContador(data);
        }
    });

    client.on('error', (err) => {
        console.error("❌ MQTT Error:", err);
        mqttConectado = false;
        updateConnectionStatus(false);
        updateEsp32Status(false);
        actualizarBadgeMQTT(false);
    });

    client.on('offline', () => {
        mqttConectado = false;
        updateConnectionStatus(false);
        actualizarBadgeMQTT(false);
    });

    client.on('reconnect', () => {
        mostrarMensaje("🔄 Reconectando...");
    });
}

// ============================================================
// ENVÍO DE COMANDOS
// ============================================================
function enviarComando(cmd) {
    if (!client || !mqttConectado) {
        mostrarMensaje("⚠️ Sin conexión con MQTT", 4000);
        return;
    }
    client.publish(CONFIG.mqtt.topics.comandos, cmd);
    if (cmd !== "ESTADO") {
        mostrarMensaje(`📤 Comando enviado: ${cmd}`);
        actualizarTimestamp(`📨 Enviado: ${cmd}`);
    }
    guardarEvento(cmd);
}

// ============================================================
// TOAST
// ============================================================
function mostrarMensaje(mensaje, duracion = CONFIG.tiempos.mensajeFlotante) {
    const msgDiv = document.getElementById('mensajeFlotante');
    if (!msgDiv) return;
    msgDiv.textContent    = mensaje;
    msgDiv.style.display  = 'block';
    msgDiv.style.opacity  = '1';
    if (mensajeTimeout) clearTimeout(mensajeTimeout);
    mensajeTimeout = setTimeout(() => {
        msgDiv.style.opacity = '0';
        setTimeout(() => { msgDiv.style.display = 'none'; }, 300);
    }, duracion);
}

// ============================================================
// HISTORIAL LOCAL
// ============================================================
function guardarEvento(tipo, detalle = '') {
    try {
        const eventos = JSON.parse(localStorage.getItem('historial_principal') || '[]');
        eventos.unshift({ fecha: new Date().toISOString(), tipo, detalle });
        if (eventos.length > 500) eventos.splice(500);
        localStorage.setItem('historial_principal', JSON.stringify(eventos));
    } catch(e) { console.warn("Error guardando evento:", e); }
}

function cargarHistorial(filtroTipo = 'all', desde = '', hasta = '') {
    try {
        let eventos = JSON.parse(localStorage.getItem('historial_principal') || '[]');
        if (filtroTipo !== 'all') eventos = eventos.filter(e => e.tipo === filtroTipo);
        if (desde) eventos = eventos.filter(e => e.fecha >= desde);
        if (hasta) eventos = eventos.filter(e => e.fecha <= hasta + 'T23:59:59');
        return eventos;
    } catch(e) { return []; }
}

function limpiarHistorial() {
    localStorage.removeItem('historial_principal');
}

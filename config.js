// ============================================================
// config.js - Configuración global del sistema SmartGate
// ITIBB - Informática Industrial
// ============================================================

const CONFIG = {
    mqtt: {
        broker: "wss://d21941469193416fabcba46336fd0980.s1.eu.hivemq.cloud:8884/mqtt",
        username: "porton_itibb",
        password: "Porton2026",
        topics: {
            comandos:  "porton/comandos",
            estado:    "porton/estado",
            sensores:  "porton/sensores",
            heartbeat: "porton/heartbeat",
            contador:  "porton/contador/valor"
        }
    },
    tiempos: {
        heartbeatTimeout: 30000,   // ms sin heartbeat → ESP32 offline
        reconectar:       5000,    // ms entre reintentos MQTT
        mensajeFlotante:  3000     // ms que dura el toast
    },
    horario: {
        // Debe coincidir con config.h del ESP32
        horaInicio:  7,
        minInicio:   30,
        horaFin:     14,
        minFin:      0,
        diasActivos: [1, 2, 3, 4, 5]  // Lunes–Viernes (0=Dom)
    },
    seguridad: {
        claveEmergencia: "123",
        claveAdmin:      "12345"
    }
};

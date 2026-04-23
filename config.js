const CONFIG = {
    mqtt: {
        broker: "wss://d21941469193416fabcba46336fd0980.s1.eu.hivemq.cloud:8884/mqtt",
        username: "porton_itibb",
        password: "Porton2026",
        topics: {
            comandos: "porton/comandos",
            estado: "porton/estado",
            sensores: "porton/sensores",
            heartbeat: "porton/heartbeat"
        }
    },
    tiempos: {
        heartbeatTimeout: 30000
    }
};

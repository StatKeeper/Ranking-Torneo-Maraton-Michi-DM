// Renderiza el Ranking Acumulado General en la Clasificación General
function renderTablaRankingGeneral() {
    const tbody = document.getElementById("tabla-clasificacion");
    const tituloHeader = document.querySelector("#main-content h1");

    const datosGuardados = localStorage.getItem("ranking_acumulado_general");

    // Identificar la última fecha y partida procesadas desde el localStorage
    let ultimaJornada = "Fecha 01";
    let ultimaPartida = "Partida 1";

    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (clave.startsWith("registros_")) {
            const partesClave = clave.split("_");
            if (partesClave.length >= 4) {
                ultimaJornada = partesClave[2];
                ultimaPartida = partesClave[3];
            }
        }
    }

    // Formato del título dinámico según reglas
    const ahora = new Date();
    const fechaHoraStr = ahora.toLocaleString('es-PE', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });

    if (tituloHeader) {
        tituloHeader.textContent = `Ranking Michi DM Dinámico ${ultimaJornada} ${ultimaPartida} ${fechaHoraStr}`;
    }

    if (!datosGuardados) {
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; color: #6c757d; padding: 15px;">
                        No hay partidas registradas aún en el ranking acumulado.
                    </td>
                </tr>
            `;
        }
        return;
    }

    const acumuladoMap = JSON.parse(datosGuardados);
    let jugadores = Object.values(acumuladoMap);

    // Priorizar ordenamiento por Puntos (pts) de mayor a menor
    jugadores.sort((a, b) => b.pts - a.pts);

    if (!tbody) return;
    tbody.innerHTML = "";

    jugadores.forEach((jug, index) => {
        const pos = index + 1;
        const pj = jug.pg + jug.pp;
        const pctVictoria = pj > 0 ? ((jug.pg / pj) * 100).toFixed(1) + "%" : "0.0%";

        // Círculos de color según ranking (1-5 Verde, 6-10 Amarillo, 11-15 Naranja, 16+ Gris)
        let colorCirculo = "#6c757d"; // Gris
        if (pos <= 5) colorCirculo = "#198754"; // Verde
        else if (pos <= 10) colorCirculo = "#ffc107"; // Amarillo
        else if (pos <= 15) colorCirculo = "#fd7e14"; // Naranja

        // Columna Variación (0 para debuts o sin cambios)
        const variacion = jug.var !== undefined ? jug.var : 0;
        const varTexto = variacion > 0 ? `+${variacion}` : `${variacion}`;

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>
                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${colorCirculo}; margin-right:5px;"></span>
                <strong>${pos}</strong>
            </td>
            <td>${varTexto}</td>
            <td><strong>${jug.jugador}</strong></td>
            <td><span style="color: #0d6efd; font-weight: bold;">${jug.pts}</span></td>
            <td>${pj}</td>
            <td>${jug.pg}</td>
            <td>${jug.pp}</td>
            <td>${pctVictoria}</td>
            <td><em>${jug.ultimoSuceso || 'Sin participación'}</em></td>
        `;

        tbody.appendChild(tr);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderTablaRankingGeneral();
});
Paso 2: Actualizar index.html
Reemplaza todo el contenido de tu archivo index.html para vincular el script js/ranking.js:

HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ranking Maratón Michi DM - Clasificación General</title>
    <link rel="stylesheet" href="css/estilos.css">
</head>
<body>

    <div id="sidebar">
        <h3>🔐 Panel de Control</h3>
        <label>Contraseña de Admin:</label>
        <input type="password" id="admin-pass" placeholder="Ingresa contraseña">
        <div id="status-mode" class="status-badge status-espectador">Modo Espectador</div>
    </div>

    <div id="main-content">
        <h1>🏆 Ranking Maratón Michi DM</h1>

        <div class="tabs">
            <a href="index.html" class="tab-btn active">📊 Clasificación general</a>
            <a href="estadisticas.html" class="tab-btn">📈 Estadísticas y Tiempos</a>
            <a href="candidatos.html" class="tab-btn">⭐ Candidatos al Jugador de la Fecha</a>
            <a href="galeria.html" class="tab-btn admin-only">🖼️ Galería y Registro Masivo</a>
            <a href="correccion.html" class="tab-btn admin-only">📝 Corrección de Nombres</a>
        </div>

        <h2>📊 Clasificación General</h2>
        
        <div class="card">
            <h3>Tabla de Posiciones</h3>
            <table>
                <thead>
                    <tr>
                        <th>Pos</th>
                        <th>Var</th>
                        <th>Jugador</th>
                        <th>Pts</th>
                        <th>PJ</th>
                        <th>PG</th>
                        <th>PP</th>
                        <th>% Victoria</th>
                        <th>Último Suceso</th>
                    </tr>
                </thead>
                <tbody id="tabla-clasificacion">
                    <tr>
                        <td colspan="9" style="text-align: center;">Cargando datos del torneo...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <script src="js/auth.js"></script>
    <script src="js/ranking.js"></script>
</body>
</html>

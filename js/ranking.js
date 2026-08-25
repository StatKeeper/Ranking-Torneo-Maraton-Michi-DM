// Renderiza la Clasificación General / Ranking Acumulado
function renderTablaRankingGeneral() {
    const tbody = document.getElementById("tabla-ranking-body");
    const tituloRanking = document.getElementById("titulo-ranking-dinamico");

    const datosGuardados = localStorage.getItem("ranking_acumulado_general");

    if (!datosGuardados) {
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="15" style="text-align: center; color: #6c757d; padding: 15px;">
                        No hay partidas registradas aún en el ranking acumulado.
                    </td>
                </tr>
            `;
        }
        return;
    }

    const acumuladoMap = JSON.parse(datosGuardados);
    let jugadores = Object.values(acumuladoMap);
    
    // Ordenar por puntos de mayor a menor
    jugadores.sort((a, b) => b.pts - a.pts);

    // Identificar la última fecha y partida registradas
    let ultimaJornada = "Fecha 01";
    let ultimaPartida = "Partida 1";
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const clave = localStorage.key(i);
        if (clave.startsWith("registros_")) {
            const partesClave = clave.split("_");
            if (partesClave.length >= 4) {
                ultimaJornada = partesClave[2];
                ultimaPartida = partesClave[3];
                break;
            }
        }
    }

    // Título dinámico con fecha y hora actual
    const ahora = new Date();
    const fechaHoraStr = ahora.toLocaleString('es-PE', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });

    if (tituloRanking) {
        tituloRanking.textContent = `Ranking Michi DM Dinámico ${ultimaJornada} - ${ultimaPartida} (${fechaHoraStr})`;
    }

    if (!tbody) return;

    tbody.innerHTML = "";

    jugadores.forEach((jug, index) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td><strong>${jug.jugador}</strong></td>
            <td><span style="color: #0d6efd; font-weight: bold;">${jug.pts}</span></td>
            <td>${jug.pg}</td>
            <td>${jug.pp}</td>
            <td>${jug.e}</td>
            <td>${jug.r}</td>
            <td>${jug.m}</td>
            <td>${jug.o}</td>
            <td>${jug.s}</td>
            <td>${jug.rch}</td>
            <td>${jug.mg}</td>
            <td>${jug.rlp}</td>
            <td><em>${jug.ultimoSuceso || 'Sin participación'}</em></td>
        `;
        tbody.appendChild(tr);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderTablaRankingGeneral();
});

function guardarEquivalencia() {
    let antiguo = document.getElementById("historial-antiguo").value.trim();
    let oficial = document.getElementById("nick-oficial").value.trim();
    
    if (!antiguo && !oficial) {
        alert("Por favor ingresa al menos un nombre.");
        return;
    }

    // Si es un jugador nuevo sin historial antiguo, asigna el nick oficial a ambos campos
    let esJugadorNuevo = false;
    if (!antiguo) {
        antiguo = oficial;
        esJugadorNuevo = true;
    } else if (!oficial) {
        oficial = antiguo;
    }

    const existente = equivalencias.find(e => e.antiguo.toLowerCase() === antiguo.toLowerCase());
    
    if (existente) {
        existente.oficial = oficial;
    } else {
        const nuevoId = equivalencias.length > 0 ? Math.max(...equivalencias.map(e => e.id)) + 1 : 1;
        equivalencias.push({ 
            id: nuevoId, 
            antiguo: antiguo, 
            oficial: oficial,
            esNuevo: esJugadorNuevo || (antiguo === oficial)
        });
    }
    
    document.getElementById("historial-antiguo").value = "";
    document.getElementById("nick-oficial").value = "";
    renderTabla();
}

function renderTabla() {
    const tbodyEq = document.getElementById("tabla-equivalencias");
    const tbodyDet = document.getElementById("tabla-detectados");
    
    if (tbodyEq) tbodyEq.innerHTML = "";
    if (tbodyDet) tbodyDet.innerHTML = "";

    let contadorDetectados = 0;

    equivalencias.forEach(eq => {
        // TABLA SUPERIOR: Muestra a TODOS (100+ jugadores)
        if (tbodyEq) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${eq.id}</strong></td>
                <td>${eq.antiguo}</td>
                <td>${eq.oficial}</td>
            `;
            tbodyEq.appendChild(tr);
        }

        // TABLA INFERIOR: Muestra sólo corregidos o nuevos registrados
        const esCorregido = eq.antiguo !== eq.oficial;
        const esNuevoRegistrado = eq.esNuevo;

        if (tbodyDet && (esCorregido || esNuevoRegistrado)) {
            contadorDetectados++;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${eq.id}</strong></td>
                <td>${eq.antiguo}</td>
                <td><strong>${eq.oficial}</strong></td>
                <td>
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; background: ${esCorregido ? '#d1e7dd' : '#cff4fc'}; color: ${esCorregido ? '#0f5132' : '#055160'};">
                        ${esCorregido ? '✏️ Corregido' : '✨ Nuevo Jugador'}
                    </span>
                </td>
            `;
            tbodyDet.appendChild(tr);
        }
    });

    if (tbodyDet && contadorDetectados === 0) {
        tbodyDet.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: #6c757d; padding: 15px;">
                    No hay jugadores corregidos ni nuevos registrados todavía.
                </td>
            </tr>
        `;
    }
}

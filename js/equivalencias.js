let equivalencias = [
    { id: 1, antiguo: "123 Dabs", oficial: "123 Dabs" },
    { id: 2, antiguo: "12Kills", oficial: "12Kills" },
    { id: 3, antiguo: "AAAwesomeGuy", oficial: "AAAwesomeGuy" },
    { id: 4, antiguo: "Anciano", oficial: "Anciano" },
    { id: 5, antiguo: "AntiBuddy", oficial: "AntiBuddy" },
    { id: 6, antiguo: "B AZAR360", oficial: "B AZAR360" },
    { id: 7, antiguo: "B. Rommel", oficial: "[cLm] bLiTzKrIeG*RoMMeL" },
    { id: 8, antiguo: "Benums", oficial: "Benums" },
    { id: 9, antiguo: "Bio Tine", oficial: "Bio Tine" },
    { id: 10, antiguo: "BlackHorse", oficial: "BlackHorse" },
    { id: 13, antiguo: "BullRunner", oficial: "BullRunner" },
    { id: 14, antiguo: "carlinhos", oficial: "carlinhos" },
    { id: 15, antiguo: "cumplear", oficial: "cumplear" },
    { id: 16, antiguo: "Dia Dia 02", oficial: "Dia Dia 02" },
    { id: 17, antiguo: "Diego Leal", oficial: "[cLm] Diego Leal" },
    { id: 18, antiguo: "Donald Trump", oficial: "Donald Trump" },
    { id: 19, antiguo: "Ecbert", oficial: "Ecbert" },
    { id: 20, antiguo: "Elraf", oficial: "Elraf" },
    { id: 21, antiguo: "Erik Barbaro", oficial: "Erik Tha Barbaro" },
    { id: 22, antiguo: "Euphory", oficial: "GJ Euphory" },
    { id: 23, antiguo: "Falco Lombardi", oficial: "Falco Lombardi" }
];

function renderTabla() {
    const tbody = document.getElementById("tabla-equivalencias");
    if (!tbody) return;
    tbody.innerHTML = "";
    equivalencias.forEach(eq => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${eq.id}</strong></td>
            <td>${eq.antiguo}</td>
            <td>${eq.oficial}</td>
        `;
        tbody.appendChild(tr);
    });
}

function guardarEquivalencia() {
    const antiguo = document.getElementById("historial-antiguo").value.trim();
    const oficial = document.getElementById("nick-oficial").value.trim();
    
    if (!antiguo || !oficial) {
        alert("Por favor completa ambos campos.");
        return;
    }

    const nuevoId = equivalencias.length > 0 ? Math.max(...equivalencias.map(e => e.id)) + 1 : 1;
    equivalencias.push({ id: nuevoId, antiguo: antiguo, oficial: oficial });
    
    document.getElementById("historial-antiguo").value = "";
    document.getElementById("nick-oficial").value = "";
    renderTabla();
}

function eliminarEquivalencia() {
    const id = parseInt(document.getElementById("id-borrar").value);
    if (isNaN(id)) {
        alert("Ingresa un ID válido.");
        return;
    }
    
    equivalencias = equivalencias.filter(e => e.id !== id);
    document.getElementById("id-borrar").value = "";
    renderTabla();
}

document.addEventListener("DOMContentLoaded", renderTabla);

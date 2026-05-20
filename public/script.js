// Lógica de Pestañas - recibir el evento como parámetro
function switchTab(tabId, event) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Configuración global de Chart.js
Chart.defaults.color = '#cbd5e1';
Chart.defaults.font.family = "'Outfit', sans-serif";
Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.1)';

let charts = [];
let allData = [];
let currentPage = 1;
const rowsPerPage = 20;

// Definición de las columnas de la tabla (en inglés interno, etiquetas en español)
const columnsSchema = [
    { key: 'age', label: 'Edad', visible: true },
    { key: 'gender', label: 'Género', visible: true },
    { key: 'daily_social_media_hours', label: 'Horas Redes Sociales', visible: true },
    { key: 'platform_usage', label: 'Plataforma', visible: true },
    { key: 'sleep_hours', label: 'Horas Sueño', visible: true },
    { key: 'screen_time_before_sleep', label: 'Pantalla pre-Sueño', visible: true },
    { key: 'academic_performance', label: 'Desempeño Académico', visible: true },
    { key: 'physical_activity', label: 'Actividad Física', visible: true },
    { key: 'social_interaction_level', label: 'Interacción Social', visible: true },
    { key: 'stress_level', label: 'Nivel de Estrés', visible: true },
    { key: 'anxiety_level', label: 'Nivel Ansiedad', visible: true },
    { key: 'addiction_level', label: 'Nivel Adicción', visible: true },
    { key: 'depression_label', label: 'Depresión', visible: true }
];

async function fetchDataAndRender() {
    try {
        const response = await fetch('/api/data');

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            console.warn('No se recibieron datos de la API');
            return;
        }

        console.log(`Datos cargados: ${data.length} registros`);
        allData = data;
        
        // Mostrar total de registros
        document.getElementById('totalRecords').innerText = `Total de registros: ${allData.length}`;
        
        renderColumnFilters();
        renderTable();
        renderCharts(allData);

    } catch (error) {
        console.error('Error al obtener datos:', error);
    }
}

function renderTableHeaders() {
    const tableHead = document.getElementById('tableHead');
    if (!tableHead) return;
    
    let html = '<tr>';
    columnsSchema.forEach(col => {
        if (col.visible) {
            html += `<th>${col.label}</th>`;
        }
    });
    html += '</tr>';
    tableHead.innerHTML = html;
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    renderTableHeaders();

    // Paginar de 20 en 20
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = allData.slice(start, end);

    pageData.forEach(row => {
        const tr = document.createElement('tr');
        
        let rowHtml = '';
        columnsSchema.forEach(col => {
            if (col.visible) {
                let val = row[col.key];
                
                // Formateo y traducciones específicas en base al tipo de columna
                if (col.key === 'gender') {
                    val = val === 'male' ? 'Masculino' : val === 'female' ? 'Femenino' : val;
                } else if (col.key === 'platform_usage') {
                    val = val === 'Both' ? 'Ambas' : val;
                } else if (col.key === 'social_interaction_level') {
                    const trans = { 'low': 'Bajo', 'medium': 'Medio', 'high': 'Alto' };
                    val = trans[val] || val;
                } else if (col.key === 'depression_label') {
                    val = Number(val) === 1 ? 'Sí' : 'No';
                }
                
                rowHtml += `<td>${val !== undefined && val !== null ? val : '-'}</td>`;
            }
        });
        
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });

    updatePaginationControls();
}

function renderColumnFilters() {
    const container = document.getElementById('columnPillsContainer');
    if (!container) return;
    
    let html = '';
    columnsSchema.forEach((col, index) => {
        html += `
            <label class="column-pill ${col.visible ? 'active' : ''}">
                <input type="checkbox" ${col.visible ? 'checked' : ''} onchange="toggleColumnVisibility(${index}, this.checked)">
                <span>${col.label}</span>
            </label>
        `;
    });
    container.innerHTML = html;
}

function toggleColumnVisibility(index, isChecked) {
    columnsSchema[index].visible = isChecked;
    renderColumnFilters();
    renderTable();
}

function toggleAllColumns(visible) {
    columnsSchema.forEach(col => col.visible = visible);
    renderColumnFilters();
    renderTable();
}

function renderCharts(data) {
    // Destruir gráficas anteriores si existen
    charts.forEach(chart => chart.destroy());
    charts = [];

    // 1. Horas de Sueño vs Nivel de Estrés (Promedio agrupado por horas de sueño en Barras)
    const sleepGroups = {};
    data.forEach(d => {
        const sleep = Math.round(Number(d.sleep_hours));
        if (!sleepGroups[sleep]) sleepGroups[sleep] = { sum: 0, count: 0 };
        sleepGroups[sleep].sum += Number(d.stress_level);
        sleepGroups[sleep].count += 1;
    });

    const sleepLabels = Object.keys(sleepGroups).map(Number).sort((a, b) => a - b);
    const avgStress = sleepLabels.map(s => parseFloat((sleepGroups[s].sum / sleepGroups[s].count).toFixed(2)));

    const ctx1 = document.getElementById('sleepStressChart').getContext('2d');
    charts.push(new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: sleepLabels.map(s => `${s} hrs`),
            datasets: [{
                label: 'Promedio de Nivel de Estrés',
                data: avgStress,
                backgroundColor: 'rgba(56, 189, 248, 0.8)',
                borderColor: '#38bdf8',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: 'Horas de Sueño', color: '#38bdf8' },
                    grid: { color: 'rgba(255,255,255,0.08)' }
                },
                y: {
                    title: { display: true, text: 'Nivel de Estrés Promedio (0–10)', color: '#38bdf8' },
                    min: 0, max: 10,
                    grid: { color: 'rgba(255,255,255,0.08)' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Estrés Promedio: ${ctx.parsed.y}`
                    }
                }
            }
        }
    }));

    // 2. Uso Diario de Redes vs Actividad Física (Promedio agrupado por horas de redes en Barras)
    const socialGroups = {};
    data.forEach(d => {
        const social = Math.round(Number(d.daily_social_media_hours));
        if (!socialGroups[social]) socialGroups[social] = { sum: 0, count: 0 };
        socialGroups[social].sum += Number(d.physical_activity);
        socialGroups[social].count += 1;
    });

    const socialLabels = Object.keys(socialGroups).map(Number).sort((a, b) => a - b);
    const avgPhysical = socialLabels.map(s => parseFloat((socialGroups[s].sum / socialGroups[s].count).toFixed(2)));

    const ctx2 = document.getElementById('socialPhysicalChart').getContext('2d');
    charts.push(new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: socialLabels.map(s => `${s} hrs`),
            datasets: [{
                label: 'Actividad Física Promedio (hrs)',
                data: avgPhysical,
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderColor: '#8b5cf6',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: 'Horas en Redes Sociales', color: '#8b5cf6' },
                    grid: { color: 'rgba(255,255,255,0.08)' }
                },
                y: {
                    title: { display: true, text: 'Actividad Física Promedio (hrs/día)', color: '#8b5cf6' },
                    grid: { color: 'rgba(255,255,255,0.08)' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Act. Física Promedio: ${ctx.parsed.y}h`
                    }
                }
            }
        }
    }));

    // 3. Edad vs Promedio de Horas en Redes Sociales (Barras)
    const ageGroups = {};
    data.forEach(d => {
        const age = d.age;
        if (!ageGroups[age]) ageGroups[age] = { sum: 0, count: 0 };
        ageGroups[age].sum += Number(d.daily_social_media_hours);
        ageGroups[age].count += 1;
    });

    const ages = Object.keys(ageGroups).map(Number).sort((a, b) => a - b);
    const avgSocialHours = ages.map(age => parseFloat((ageGroups[age].sum / ageGroups[age].count).toFixed(2)));

    const ctx3 = document.getElementById('ageSocialChart').getContext('2d');
    charts.push(new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: ages,
            datasets: [{
                label: 'Promedio de Horas en Redes',
                data: avgSocialHours,
                backgroundColor: 'rgba(236, 72, 153, 0.8)',
                borderColor: '#ec4899',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: 'Edad', color: '#ec4899' },
                    grid: { color: 'rgba(255,255,255,0.08)' }
                },
                y: {
                    title: { display: true, text: 'Promedio de Horas/Día', color: '#ec4899' },
                    grid: { color: 'rgba(255,255,255,0.08)' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Promedio: ${ctx.parsed.y}h`
                    }
                }
            }
        }
    }));

    // Definición de colores premium para marcas de redes sociales
    const platformColorsMap = {
        'Instagram': 'rgba(225, 48, 108, 0.8)',
        'TikTok': 'rgba(254, 44, 85, 0.8)',
        'Ambas': 'rgba(139, 92, 246, 0.8)',
        'YouTube': 'rgba(239, 68, 68, 0.8)',
        'Facebook': 'rgba(59, 130, 246, 0.8)'
    };
    const defaultColorsList = [
        'rgba(56, 189, 248, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(168, 85, 247, 0.8)'
    ];

    const getColorsForLabels = (labels) => {
        return labels.map((label, index) => platformColorsMap[label] || defaultColorsList[index % defaultColorsList.length]);
    };

    // 4. Gráfica de Pastel: Uso de Plataformas - Hombres
    const malePlatforms = {};
    data.filter(d => d.gender && d.gender.toLowerCase() === 'male').forEach(d => {
        let platform = d.platform_usage || 'Otros';
        if (platform === 'Both') platform = 'Ambas';
        malePlatforms[platform] = (malePlatforms[platform] || 0) + 1;
    });
    const maleLabels = Object.keys(malePlatforms);
    const maleValues = Object.values(malePlatforms);

    const ctx4 = document.getElementById('platformMaleChart').getContext('2d');
    charts.push(new Chart(ctx4, {
        type: 'pie',
        data: {
            labels: maleLabels,
            datasets: [{
                data: maleValues,
                backgroundColor: getColorsForLabels(maleLabels),
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#cbd5e1', boxWidth: 12, padding: 15 }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const val = ctx.raw;
                            const pct = ((val / total) * 100).toFixed(1);
                            return ` ${ctx.label}: ${val} (${pct}%)`;
                        }
                    }
                }
            }
        }
    }));

    // 5. Gráfica de Pastel: Uso de Plataformas - Mujeres
    const femalePlatforms = {};
    data.filter(d => d.gender && d.gender.toLowerCase() === 'female').forEach(d => {
        let platform = d.platform_usage || 'Otros';
        if (platform === 'Both') platform = 'Ambas';
        femalePlatforms[platform] = (femalePlatforms[platform] || 0) + 1;
    });
    const femaleLabels = Object.keys(femalePlatforms);
    const femaleValues = Object.values(femalePlatforms);

    const ctx5 = document.getElementById('platformFemaleChart').getContext('2d');
    charts.push(new Chart(ctx5, {
        type: 'pie',
        data: {
            labels: femaleLabels,
            datasets: [{
                data: femaleValues,
                backgroundColor: getColorsForLabels(femaleLabels),
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#cbd5e1', boxWidth: 12, padding: 15 }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const val = ctx.raw;
                            const pct = ((val / total) * 100).toFixed(1);
                            return ` ${ctx.label}: ${val} (${pct}%)`;
                        }
                    }
                }
            }
        }
    }));

    // 6. Horas en Redes vs Desempeño Académico (Barras)
    const academicGroups = {};
    data.forEach(d => {
        const social = Math.round(Number(d.daily_social_media_hours));
        if (!academicGroups[social]) academicGroups[social] = { sum: 0, count: 0 };
        academicGroups[social].sum += Number(d.academic_performance);
        academicGroups[social].count += 1;
    });

    const socialAcs = Object.keys(academicGroups).map(Number).sort((a, b) => a - b);
    const avgAcademic = socialAcs.map(s => parseFloat((academicGroups[s].sum / academicGroups[s].count).toFixed(2)));

    const ctx6 = document.getElementById('socialAcademicChart').getContext('2d');
    charts.push(new Chart(ctx6, {
        type: 'bar',
        data: {
            labels: socialAcs.map(s => `${s} hrs`),
            datasets: [{
                label: 'Desempeño Académico Promedio',
                data: avgAcademic,
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: '#22c55e',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: 'Horas en Redes Sociales', color: '#22c55e' },
                    grid: { color: 'rgba(255,255,255,0.08)' }
                },
                y: {
                    title: { display: true, text: 'Desempeño Académico Promedio', color: '#22c55e' },
                    grid: { color: 'rgba(255,255,255,0.08)' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Desempeño Promedio: ${ctx.parsed.y}`
                    }
                }
            }
        }
    }));
}

// Funciones para Paginación de Tabla
function updatePaginationControls() {
    const totalPages = Math.ceil(allData.length / rowsPerPage);
    document.getElementById('pageInfo').innerText = `Página ${currentPage} de ${totalPages || 1}`;
    
    document.getElementById('prevBtn').disabled = (currentPage === 1);
    document.getElementById('nextBtn').disabled = (currentPage === totalPages || totalPages === 0);
}

function nextPage() {
    const totalPages = Math.ceil(allData.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
        // Hace scroll suave arriba de la tabla al cambiar de página
        document.querySelector('.table-container').scrollTop = 0;
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
        document.querySelector('.table-container').scrollTop = 0;
    }
}

// Iniciar al cargar la página
document.addEventListener('DOMContentLoaded', fetchDataAndRender);

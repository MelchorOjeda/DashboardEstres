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
        renderTable(data);
        renderCharts(data);

    } catch (error) {
        console.error('Error al obtener datos:', error);
    }
}

function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    data.forEach(row => {
        const tr = document.createElement('tr');
        // Propiedades en inglés, labels en español
        tr.innerHTML = `
            <td>${row.age}</td>
            <td>${row.gender === 'male' ? 'Masculino' : row.gender === 'female' ? 'Femenino' : row.gender}</td>
            <td>${row.daily_social_media_hours}</td>
            <td>${row.platform_usage}</td>
            <td>${row.sleep_hours}</td>
            <td>${row.screen_time_before_sleep}</td>
            <td>${row.academic_performance}</td>
            <td>${row.physical_activity}</td>
            <td>${row.social_interaction_level}</td>
            <td>${row.stress_level}</td>
            <td>${row.anxiety_level}</td>
            <td>${row.addiction_level}</td>
            <td>${row.depression_label}</td>
        `;
        tbody.appendChild(tr);
    });
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
}

// Iniciar al cargar la página
document.addEventListener('DOMContentLoaded', fetchDataAndRender);

// Importa las variables y funciones necesarias desde logic.js
import { APP_STATE, leagues, leagueThemes, formationMap, mainThemeSubtitles, _, areColorsSimilar, saveState, uploadedInjuryImagesHome, uploadedInjuryImagesAway, uploadedOddsImages } from './logic.js';

// Variables para el estado de la UI que no necesitan ser guardadas en localStorage
let draggedPlayer = null;
let editedPlayer = null;
let currentEditorTeam = null;
let formationEditTeam = null;
let playerToSubstitute = null;
let activePasteTarget = null;

// --- ============================================ ---
// --- THEME MANAGEMENT ---
// --- ============================================ ---

export function applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('selectedTheme', themeName);
    document.querySelectorAll('#analysis-settings-container .theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === themeName);
    });
}

export function applyMainTheme(themeName) {
    const pageSelector = document.getElementById('page-selector');
    const subtitleEl = document.getElementById('main-subtitle');
    if (pageSelector) {
        pageSelector.setAttribute('data-main-theme', themeName);
        localStorage.setItem('selectedMainTheme', themeName);
    }
    if (subtitleEl && mainThemeSubtitles[themeName]) {
        subtitleEl.textContent = mainThemeSubtitles[themeName];
    }
}

// --- ============================================ ---
// --- PAGE & MODAL MANAGEMENT ---
// --- ============================================ ---

export function showAnalysisPanel(league) {
    document.getElementById('page-selector').classList.add('hidden');
    document.getElementById('page-analysis').classList.remove('hidden');
    document.body.classList.add('analysis-active');

    const importerTitle = document.querySelector('#importer-title');
    if (importerTitle) {
        importerTitle.textContent = `Cargar Configuración de ${league.name}`;
    }

    const themePanel = document.getElementById('analysis-theme-panel');
    const themeButtonsContainer = themePanel.querySelector('.flex.gap-2');
    const themes = leagueThemes[league.type] || leagueThemes.premier;

    themeButtonsContainer.innerHTML = '';
    themes.forEach(theme => {
        const button = document.createElement('button');
        button.className = 'theme-btn';
        button.dataset.theme = theme.id;
        button.title = theme.name;
        const span = document.createElement('span');
        span.style.cssText = `display: block; width: 20px; height: 20px; border-radius: 50%; background: ${theme.gradient};`;
        if (theme.border) {
            span.style.border = theme.border;
        }
        button.appendChild(span);
        button.addEventListener('click', () => applyTheme(theme.id));
        themeButtonsContainer.appendChild(button);
    });

    const savedTheme = localStorage.getItem('selectedTheme');
    const defaultTheme = themes[0].id;
    const validThemes = themes.map(t => t.id);
    applyTheme(savedTheme && validThemes.includes(savedTheme) ? savedTheme : defaultTheme);
}

export function initializeSelectorPage() {
    // Inicializa los temas al cargar la página
    (function initializeTheme() {
        const savedTheme = localStorage.getItem('selectedTheme') || 'premier-30';
        applyTheme(savedTheme);
    })();
    (function initializeMainTheme() {
        const savedMainTheme = localStorage.getItem('selectedMainTheme') || 'galactico';
        applyMainTheme(savedMainTheme);
    })();

    const leagueGrid = document.getElementById('league-grid');
    if (leagueGrid) {
        leagueGrid.innerHTML = '';
        leagues.forEach(league => {
            const card = document.createElement('div');
            card.className = 'league-card rounded-lg p-4 flex flex-col items-center justify-center aspect-square text-center';
            card.innerHTML = `
                <img src="${league.logo}" alt="${league.name}" class="w-16 h-16 object-contain mb-3" 
                     loading="lazy" decoding="async" 
                     onerror="this.src='https://placehold.co/64x64/2a3c38/f0e6d2?text=?'; this.onerror=null;">
                <h3 class="font-semibold text-sm">${league.name}</h3>
                <p class="text-xs">${league.country}</p>
            `;
            if (league.isKhipuEnabled) {
                card.addEventListener('click', () => {
                    APP_STATE.currentLeagueType = league.type;
                    showAnalysisPanel(league);
                    showImporter();
                });
            } else {
                card.style.cursor = 'not-allowed';
                card.style.opacity = '0.5';
                card.addEventListener('click', () => alert(`El panel de análisis para "${league.name}" no está disponible en esta versión.`));
            }
            leagueGrid.appendChild(card);
        });
    }
}

function updateClassicSelection() {
    const classicsGrid = document.getElementById('classics-buttons-grid');
    if (!classicsGrid) return;

    const buttons = classicsGrid.querySelectorAll('.classic-button');
    buttons.forEach(btn => btn.classList.remove('selected'));

    if (!APP_STATE.selectedHome || !APP_STATE.selectedAway) return;

    const selectedHome = APP_STATE.selectedHome;
    const selectedAway = APP_STATE.selectedAway;

    for (const button of buttons) {
        const home = button.dataset.home;
        const away = button.dataset.away;

        if ((home === selectedHome && away === selectedAway) || (home === selectedAway && away === selectedHome)) {
            button.classList.add('selected');
            break; 
        }
    }
}

export function showTeamSelector() {
    const homeList = document.getElementById('home-team-list');
    const awayList = document.getElementById('away-team-list');
    const openGeneratorBtn = document.getElementById('open-workbench-btn');
    const classicsContainer = document.getElementById('classics-container');
    const classicsGrid = document.getElementById('classics-buttons-grid');

    homeList.innerHTML = '';
    awayList.innerHTML = '';
    if(classicsGrid) classicsGrid.innerHTML = '';
    APP_STATE.selectedHome = null;
    APP_STATE.selectedAway = null;
    openGeneratorBtn.disabled = true;

    const teamNames = Object.keys(APP_STATE.database.teams).sort();
    teamNames.forEach(teamName => {
        const team = APP_STATE.database.teams[teamName];
        const item = document.createElement('div');
        item.className = 'team-selection-item';
        item.dataset.teamName = teamName;
        item.innerHTML = `<img src="${team.logoUrl}" alt="${teamName}" loading="lazy" width="24" height="24"><span>${teamName}</span>`;

        const homeItem = item.cloneNode(true);
        const awayItem = item.cloneNode(true);

        homeItem.addEventListener('click', () => {
            APP_STATE.selectedHome = teamName;
            document.querySelectorAll('#home-team-list .team-selection-item').forEach(el => el.classList.remove('selected'));
            homeItem.classList.add('selected');
            if (APP_STATE.selectedHome && APP_STATE.selectedAway) {
                openGeneratorBtn.disabled = false;
            }
            updateClassicSelection();
        });
        awayItem.addEventListener('click', () => {
            APP_STATE.selectedAway = teamName;
            document.querySelectorAll('#away-team-list .team-selection-item').forEach(el => el.classList.remove('selected'));
            awayItem.classList.add('selected');
            if (APP_STATE.selectedHome && APP_STATE.selectedAway) {
                openGeneratorBtn.disabled = false;
            }
            updateClassicSelection();
        });

        homeList.appendChild(homeItem);
        awayList.appendChild(awayItem);
    });

    const classics = _.get(APP_STATE, 'database.classics', {});
    if (classics && Object.keys(classics).length > 0) {
        classicsContainer.classList.remove('hidden');
        for (const classicName in classics) {
            const classicData = classics[classicName];
            const [team1Name, team2Name] = classicData.teams;
            
            const button = document.createElement('button');
            button.className = 'classic-button';
            button.dataset.home = team1Name;
            button.dataset.away = team2Name;
            
            const updateButtonContent = () => {
                button.innerHTML = `
                    <img src="${_.get(APP_STATE, `database.teams.${button.dataset.home}.logoUrl`, '')}" alt="${button.dataset.home}">
                    <span class="text-xs font-bold">${classicName}</span>
                    <img src="${_.get(APP_STATE, `database.teams.${button.dataset.away}.logoUrl`, '')}" alt="${button.dataset.away}">`;
            };
            updateButtonContent();
            
            // --- INICIO: LÓGICA DE INTERCAMBIO DE LOCALÍA ---
            button.addEventListener('click', () => {
                const isAlreadySelected = button.classList.contains('selected');

                if (isAlreadySelected) {
                    // Si ya está seleccionado, intercambia la localía
                    const tempHome = button.dataset.home;
                    button.dataset.home = button.dataset.away;
                    button.dataset.away = tempHome;
                    updateButtonContent(); // Actualiza los logos en el botón
                } else {
                    // Si no está seleccionado, simplemente lo selecciona
                    document.querySelectorAll('#classics-buttons-grid .classic-button').forEach(btn => btn.classList.remove('selected'));
                    button.classList.add('selected');
                }
                
                // En ambos casos, actualiza el estado y las listas
                APP_STATE.selectedHome = button.dataset.home;
                APP_STATE.selectedAway = button.dataset.away;

                document.querySelectorAll('#home-team-list .team-selection-item').forEach(el => el.classList.toggle('selected', el.dataset.teamName === APP_STATE.selectedHome));
                document.querySelectorAll('#away-team-list .team-selection-item').forEach(el => el.classList.toggle('selected', el.dataset.teamName === APP_STATE.selectedAway));
                openGeneratorBtn.disabled = false;
            });
            // --- FIN: LÓGICA DE INTERCAMBIO DE LOCALÍA ---

            classicsGrid.appendChild(button);
        }
    } else {
        if (classicsContainer) classicsContainer.classList.add('hidden');
    }

    document.getElementById('file-importer-modal').classList.add('hidden');
    document.getElementById('team-selection-modal').classList.remove('hidden');
    APP_STATE.activePage = 'team-selection';
}

export function showImporter() {
    document.getElementById('file-upload-form').reset();
    document.querySelectorAll('.file-upload-label .upload-text').forEach(span => {
        span.textContent = span.dataset.defaultText;
        span.classList.remove('filename');
    });
    document.querySelectorAll('.file-upload-card').forEach(card => card.classList.remove('file-loaded'));
    document.querySelectorAll('.upload-checkmark').forEach(check => check.classList.add('hidden'));

    document.getElementById('team-selection-modal').classList.add('hidden');
    document.getElementById('main-app-container').classList.add('hidden');
    document.getElementById('main-app-container').classList.remove('flex');
    document.getElementById('file-importer-modal').classList.remove('hidden');
    APP_STATE.activePage = 'selector';
}


// --- ============================================ ---
// --- CORE RENDERING ---
// --- ============================================ ---

function renderStaticData(container, data) {
    const leagueName = leagues.find(l => l.type === APP_STATE.currentLeagueType)?.name || 'LIGA LOCAL';
    container.querySelector('#league-subtitle').textContent = `${leagueName.toUpperCase()} // DATA: INCA STATS`;
    container.querySelector('#match-title').textContent = `${data.homeTeam.name} vs ${data.awayTeam.name}`;
    container.querySelector('#pick-title').textContent = data.pick.market.toUpperCase();
    container.querySelector('#pick-logo-home').src = data.homeTeam.logoUrl;
    container.querySelector('#pick-logo-away').src = data.awayTeam.logoUrl;
    container.querySelector('#metrics-logo-home').src = data.homeTeam.logoUrl;
    container.querySelector('#metrics-logo-away').src = data.awayTeam.logoUrl;
}

function renderFundamentals(container, items) {
    const fundamentalsContainer = container.querySelector('#fundamentals-container');
    fundamentalsContainer.innerHTML = '';
    const icons = [ '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 text-accent-green flex-shrink-0"><path d="m12 3-1.41 1.41L16.17 10H4v4h12.17l-5.58 5.59L12 21l8-8-8-8z"/></svg>', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-accent-green flex-shrink-0"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>' ];
    (items || []).forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'flex items-start gap-3';
        el.innerHTML = `${icons[index % icons.length]}<div><h4 class="font-bold text-sm" style="color: var(--text-primary);">${item.title}</h4><p class="text-xs" style="color: var(--text-secondary);">${item.desc}</p></div>`;
        fundamentalsContainer.appendChild(el);
    });
}

function renderKeyPlayers(container, data) {
    const keyPlayersContainer = container.querySelector('#key-players-container');
    keyPlayersContainer.innerHTML = '';
    ['home', 'away'].forEach(type => {
        const player = _.get(data, `keyPlayers.${type}`, null);
        const card = document.createElement('div');
        card.className = 'relative rounded-lg overflow-hidden h-full text-white shadow-lg group';
        if (!player || !player.name) {
            card.innerHTML = `<div class="relative rounded-lg h-full text-white/50 flex items-center justify-center bg-black/20"><p class="text-sm">Protagonista no definido</p></div>`;
        } else {
            const specialtyStats = player.specialty_stats || {};
            const metricMap = {
                "Tiros": [ { label: "Remates Totales p/90", key: "remates_totales_p90" }, { label: "Remates a Puerta p/90", key: "remates_a_puerta_p90" }, { label: "Toques Área Rival p/90", key: "toques_area_rival_p90" } ],
                "Tiros a Puerta": [ { label: "Tiros a Puerta p/90", key: "tiros_a_puerta_p90" }, { label: "% Tiros a Puerta", key: "porcentaje_tiros_a_puerta" }, { label: "Goles por Tiro a Puerta", key: "goles_por_tiro_a_puerta" } ],
                "Tackles": [ { label: "Entradas Exitosas p/90", key: "entradas_exitosas_p90" }, { label: "Intercepciones p/90", key: "intercepciones_p90" }, { label: "Recuperaciones p/90", key: "recuperaciones_balon_p90" } ],
                "Tarjetas": [ { label: "Tarjetas Amarillas", key: "tarjetas_amarillas_totales" }, { label: "Faltas por Tarjeta", key: "faltas_por_tarjeta" }, { label: "Entradas Malogradas p/90", key: "entradas_malogradas_p90" } ],
                "Mayor Rematador": [ { label: "Remates Totales p/90", key: "remates_totales_p90" }, { label: "Remates a Puerta p/90", key: "remates_a_puerta_p90" }, { label: "Toques Área Rival p/90", key: "toques_area_rival_p90" } ],
                "Remates a Puerta": [ { label: "Tiros a Puerta p/90", key: "tiros_a_puerta_p90" }, { label: "% Tiros a Puerta", key: "porcentaje_tiros_a_puerta" }, { label: "Goles por Tiro a Puerta", key: "goles_por_tiro_a_puerta" } ],
                "Más Entradas": [ { label: "Entradas Exitosas p/90", key: "entradas_exitosas_p90" }, { label: "Intercepciones p/90", key: "intercepciones_p90" }, { label: "Recuperaciones p/90", key: "recuperaciones_balon_p90" } ],
                "Faltas Cometidas": [ { label: "Faltas Cometidas p/90", key: "faltas_cometidas_p90" }, { label: "Presiones Exitosas p/90", key: "presiones_exitosas_p90" }, { label: "% Duelos Def. Ganados", key: "porcentaje_duelos_defensivos_ganados" } ],
                "Más Amonestado": [ { label: "Tarjetas Amarillas", key: "tarjetas_amarillas_totales" }, { label: "Faltas por Tarjeta", key: "faltas_por_tarjeta" }, { label: "Entradas Malogradas p/90", key: "entradas_malogradas_p90" } ],
                "Provoca Saques de Meta": [ { label: "Regates Exitosos p/90", key: "regates_exitosos_p90" }, { label: "Pases Clave p/90", key: "pases_clave_p90" }, { label: "Acciones Creación Tiro p/90", key: "acciones_creacion_tiro_p90" } ],
                "Concede Saques de Banda": [ { label: "Despejes p/90", key: "despejes_p90" }, { label: "Bloqueos p/90", key: "bloqueos_p90" }, { label: "Intercepciones p/90", key: "intercepciones_p90" } ]
            };
            const metricsToShow = metricMap[player.specialty] || [];
            const statsHtml = metricsToShow.map(metric => `<div class="flex justify-between items-baseline"><p class="text-[10px] text-white/80">${metric.label}</p><p class="font-bold text-xs text-white">${specialtyStats[metric.key] ?? 'N/A'}</p></div>`).join('');
            card.innerHTML = `<div class="absolute inset-0 bg-cover transition-transform duration-300 ease-in-out group-hover:scale-105" style="background-image: url('${player.photoUrl}'); background-position: center 20%;"></div><div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent"></div><div class="relative p-1.5 h-full flex flex-col justify-end"><div><p class="font-bold text-base leading-tight" style="text-shadow: 1px 1px 3px #000;">${player.name}</p><p class="text-xs text-gray-300 font-semibold">${player.position || 'Posición no definida'}</p></div><div class="mt-1 pt-1 border-t border-white/20 space-y-0.5">${statsHtml}</div></div>`;
        }
        card.dataset.teamType = type;
        card.classList.add('cursor-pointer');
        keyPlayersContainer.appendChild(card);
    });
}

function renderTacticalContext(container, data) {
    const refereeData = _.get(APP_STATE, `database.referees.${data.referee}`, {});
    const heatmapContainer = container.querySelector('#heatmap-container');
    container.querySelector('#scenario-container').innerHTML = `<p>🏟️ ${data.stadium || 'N/A'}</p><p>📍 ${data.location || 'N/A'}</p>`;
    container.querySelector('#home-manager-name').textContent = data.homeTeam.manager || 'N/A';
    container.querySelector('#away-manager-name').textContent = data.awayTeam.manager || 'N/A';
    container.querySelector('#home-formation-display').textContent = data.homeTeam.formation;
    container.querySelector('#away-formation-display').textContent = data.awayTeam.formation;
    container.querySelector('#ref-name').textContent = data.referee || 'N/A';
    container.querySelector('#ref-fouls').textContent = (refereeData.fouls_per_game || 0).toFixed(2);
    container.querySelector('#ref-yellows').textContent = (refereeData.yellows_per_game || 0).toFixed(2);
    container.querySelector('#ref-reds').textContent = (refereeData.reds_per_game || 0).toFixed(2);

    heatmapContainer.innerHTML = `<div class="pitch-shield left" style="background-image: url('${data.homeTeam.logoUrl}')"></div><div class="pitch-shield right" style="background-image: url('${data.awayTeam.logoUrl}')"></div><svg viewBox="0 0 105 68" class="absolute top-0 left-0 w-full h-full opacity-60"><rect x=".25" y=".25" width="104.5" height="67.5" stroke="rgba(255,255,255,0.2)" fill="none"/><path d="M52.5,0 L52.5,68" stroke="rgba(255,255,255,0.2)"/><circle cx="52.5" cy="34" r="9.15" stroke="rgba(255,255,255,0.2)" fill="none"/><rect x="0" y="13.84" width="16.5" height="40.32" stroke="rgba(255,255,255,0.2)" fill="none"/><rect x="88.5" y="13.84" width="16.5" height="40.32" stroke="rgba(255,255,255,0.2)" fill="none"/><rect x="0" y="24.84" width="5.5" height="18.32" stroke="rgba(255,255,255,0.2)" fill="none"/><rect x="99.5" y="24.84" width="5.5" height="18.32" stroke="rgba(255,255,255,0.2)" fill="none"/></svg>`;

    (data.homeTeam.lineup || []).forEach((player, index) => {
        const pos = player.coords;
        const el = document.createElement('div'); el.className = 'player-marker'; el.style.left = `${pos.x}%`; el.style.top = `${pos.y}%`; el.dataset.team = 'home'; el.dataset.id = `home-${index}`;
        el.innerHTML = `<div class="player-number">${player.number}</div><div class="player-name">${player.name.split(' ').pop()}</div>`; heatmapContainer.appendChild(el);
    });
    (data.awayTeam.lineup || []).forEach((player, index) => {
        const pos = player.coords;
        const el = document.createElement('div'); el.className = 'player-marker'; el.style.left = `${pos.x}%`; el.style.top = `${pos.y}%`; el.dataset.team = 'away'; el.dataset.id = `away-${index}`;
        el.innerHTML = `<div class="player-number">${player.number}</div><div class="player-name">${player.name.split(' ').pop()}</div>`; heatmapContainer.appendChild(el);
    });
    updatePlayerStyles(container, 'home', data);
    updatePlayerStyles(container, 'away', data);
}

function renderKeyStats(container, stats, hColor, aColor) {
    const keyStatsContainer = container.querySelector('#key-stats-container');
    keyStatsContainer.innerHTML = '';
    (stats || []).forEach(stat => {
        const home = parseFloat(stat.home);
        const away = parseFloat(stat.away);
        const homePerc = (home + away > 0) ? (home / (home + away)) * 100 : 50;
        const blendMargin = 2.5;
        const startBlend = Math.max(0, homePerc - blendMargin);
        const endBlend = Math.min(100, homePerc + blendMargin);
        const statEl = document.createElement('div');
        statEl.innerHTML = `<div class="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-center"><p class="font-bold text-base text-left" style="color: ${hColor}; text-shadow: 0px 0px 5px #000, 0px 0px 5px #000;">${stat.home}</p><h4 class="text-xs font-bold text-gradient">${stat.metric}</h4><p class="font-bold text-base text-right" style="color: ${aColor}; text-shadow: 0px 0px 5px #000, 0px 0px 5px #000;">${stat.away}</p></div><div class="w-full bg-black/30 rounded-full h-1.5 mt-0.5"><div class="h-1.5 rounded-full" style="background: linear-gradient(to right, ${hColor} ${startBlend}%, ${aColor} ${endBlend}%);"></div></div>`;
        keyStatsContainer.appendChild(statEl);
    });
}

export function updatePick(container, odds, stake) {
    container.querySelector('#pick-odds').textContent = odds;
    container.querySelector('#stake-value').textContent = stake;
    const vis = container.querySelector('#stake-visual');
    vis.innerHTML = '';
    const activeBars = Math.round((stake / 25) * 10);
    for (let i = 0; i < 10; i++) {
        const bar = document.createElement('div');
        bar.className = 'w-1.5 rounded-sm';
        bar.style.height = `${(i + 1) * 2 + 4}px`;
        bar.style.backgroundColor = i < activeBars ? 'var(--accent-green)' : 'var(--stake-bar-inactive)';
        vis.appendChild(bar);
    }
}

export function renderAll(data) {
    if (!data) return;
    const mainContainer = document.getElementById('main-app-container');
    renderStaticData(mainContainer, data);
    renderFundamentals(mainContainer, data.fundamentals);
    let homeColor = data.homeTeam.shieldColor || '#FFFFFF';
    let awayColor = data.awayTeam.shieldColor || '#FFFFFF';

    if (data.homeTeam.name.toLowerCase().includes('real madrid')) {
        homeColor = '#FFFFFF';
    }
    if (data.awayTeam.name.toLowerCase().includes('real madrid')) {
        awayColor = '#FFFFFF';
    }

    if (areColorsSimilar(homeColor, awayColor)) {
        awayColor = '#FFFFFF';
        if (areColorsSimilar(homeColor, '#FFFFFF')) {
            awayColor = data.awayTeam.secondaryColor || '#CCCCCC';
        }
    }
    renderKeyStats(mainContainer, data.keyStats, homeColor, awayColor);
    renderKeyPlayers(mainContainer, data);
    renderTacticalContext(mainContainer, data);
    const score = data.verdict_score, stake = score >= 95 ? 25 : score >= 85 ? 20 : score >= 75 ? 15 : score >= 65 ? 10 : 5;
    updatePick(mainContainer, data.odds, stake);
}

// --- ============================================ ---
// --- UI INTERACTIONS & EVENT HANDLERS ---
// --- ============================================ ---

export function startDrag(e, el) {
    saveState();
    draggedPlayer = el;
    draggedPlayer.classList.add('player-dragging');
    e.preventDefault();
}

export function drag(e) {
    if (!draggedPlayer) return;
    e.preventDefault();
    const heatmapContainer = document.getElementById('heatmap-container');
    const pitchRect = heatmapContainer.getBoundingClientRect();
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    let x = clientX - pitchRect.left;
    let y = clientY - pitchRect.top;
    const team = draggedPlayer.dataset.team;
    const halfWidth = pitchRect.width / 2;

    if (team === 'home') {
        x = Math.max(0, Math.min(x, halfWidth));
    } else {
        x = Math.max(halfWidth, Math.min(x, pitchRect.width));
    }
    y = Math.max(0, Math.min(y, pitchRect.height));

    let newXpercent = (x / pitchRect.width) * 100;
    let newYpercent = (y / pitchRect.height) * 100;

    if (!checkCollisions(newXpercent, newYpercent, team, draggedPlayer.dataset.id)) {
        draggedPlayer.style.left = `${newXpercent}%`;
        draggedPlayer.style.top = `${newYpercent}%`;
    }
}

export function endDrag() {
    if (!draggedPlayer) return;

    const teamType = draggedPlayer.dataset.team;
    const playerIndex = parseInt(draggedPlayer.dataset.id.split('-')[1], 10);
    const lineup = teamType === 'home' ? APP_STATE.currentMatch.homeTeam.lineup : APP_STATE.currentMatch.awayTeam.lineup;

    if (lineup[playerIndex]) {
        lineup[playerIndex].coords = {
            x: parseFloat(draggedPlayer.style.left),
            y: parseFloat(draggedPlayer.style.top)
        };
    }

    draggedPlayer.classList.remove('player-dragging');
    draggedPlayer = null;
}

function checkCollisions(newX, newY, team, currentPlayerId) {
    const heatmapContainer = document.getElementById('heatmap-container');
    const players = document.querySelectorAll(`.player-marker[data-team="${team}"]`);
    const pitchRect = heatmapContainer.getBoundingClientRect();
    const newXpx = newX / 100 * pitchRect.width;
    const newYpx = newY / 100 * pitchRect.height;
    const collisionThreshold = 25;
    for (const playerEl of players) {
        if (playerEl.dataset.id === currentPlayerId) continue;
        const otherXpx = (parseFloat(playerEl.style.left) / 100) * pitchRect.width;
        const otherYpx = (parseFloat(playerEl.style.top) / 100) * pitchRect.height;
        const distance = Math.sqrt(Math.pow(newXpx - otherXpx, 2) + Math.pow(newYpx - otherYpx, 2));
        if (distance < collisionThreshold) return true;
    }
    return false;
}

export function openEditModal(el) {
    editedPlayer = el;
    document.getElementById('edit-player-name').value = el.querySelector('.player-name').textContent;
    document.getElementById('edit-player-number').value = el.querySelector('.player-number').textContent;
    document.getElementById('edit-player-modal').classList.remove('hidden');
}

export function closeEditModal() {
    document.getElementById('edit-player-modal').classList.add('hidden');
    editedPlayer = null;
}

export function savePlayerChanges() {
    if (!editedPlayer) return;
    saveState();
    const newName = document.getElementById('edit-player-name').value;
    const newNumber = document.getElementById('edit-player-number').value;
    if (newName) editedPlayer.querySelector('.player-name').textContent = newName;
    if (newNumber) editedPlayer.querySelector('.player-number').textContent = newNumber;
    closeEditModal();
}

export function toggleColorEditor(team) {
    const colorEditorPanel = document.getElementById('color-editor-panel');
    const isOpen = colorEditorPanel.classList.contains('is-open');
    if (isOpen && currentEditorTeam === team) {
        colorEditorPanel.classList.remove('is-open');
        currentEditorTeam = null;
    } else {
        currentEditorTeam = team;
        populateColorEditor(team);
        colorEditorPanel.classList.add('is-open');
    }
}

function populateColorEditor(team) {
    const teamName = team === 'home' ? APP_STATE.currentMatch.homeTeam.name : APP_STATE.currentMatch.awayTeam.name;
    const teamData = APP_STATE.database.teams[teamName];
    document.getElementById('color-picker-title').textContent = `Diseño Uniforme: ${teamName}`;
    document.getElementById('jersey-color-input').value = teamData.jerseyColor;
    document.getElementById('gk-jersey-color-input').value = teamData.gkJerseyColor;
    document.getElementById('number-color-input').value = teamData.numberColor;
}

export function applyJerseyStylesFromPanel() {
    if (!currentEditorTeam) return;
    saveState();
    const teamName = currentEditorTeam === 'home' ? APP_STATE.currentMatch.homeTeam.name : APP_STATE.currentMatch.awayTeam.name;
    const teamData = APP_STATE.database.teams[teamName];
    teamData.jerseyColor = document.getElementById('jersey-color-input').value;
    teamData.gkJerseyColor = document.getElementById('gk-jersey-color-input').value;
    teamData.numberColor = document.getElementById('number-color-input').value;
    updatePlayerStyles(document.getElementById('main-app-container'), currentEditorTeam, APP_STATE.currentMatch);
}

function updatePlayerStyles(container, team, data) {
    const teamName = team === 'home' ? data.homeTeam.name : data.awayTeam.name;
    const teamData = APP_STATE.database.teams[teamName] || {};

    if (Object.keys(teamData).length === 0) {
        console.error(`[updatePlayerStyles] No se encontraron datos para el equipo: "${teamName}"`);
        return;
    }

    container.querySelectorAll(`.player-marker[data-team="${team}"]`).forEach((playerEl) => {
        const numberEl = playerEl.querySelector('.player-number');
        if (numberEl) {
            const playerId = playerEl.dataset.id;
            const playerIndex = parseInt(playerId.split('-')[1], 10);
            const lineup = team === 'home' ? data.homeTeam.lineup : data.awayTeam.lineup;

            if (lineup && lineup[playerIndex]) {
                const player = lineup[playerIndex];
                const isGk = player.position === 'GK';
                
                numberEl.style.backgroundColor = isGk ? teamData.gkJerseyColor : teamData.jerseyColor;
                numberEl.style.color = teamData.numberColor;
            }
        }
    });
}

export function openFormationMenu(team) {
    formationEditTeam = team;
    const teamData = team === 'home' ? APP_STATE.currentMatch.homeTeam : APP_STATE.currentMatch.awayTeam;
    document.getElementById('formation-modal-title').textContent = `Seleccionar Formación: ${teamData.name}`;
    const container = document.getElementById('formation-buttons-container');
    container.innerHTML = '';
    Object.keys(formationMap).forEach(key => {
        const button = document.createElement('button');
        button.className = 'menu-button font-bold py-2 px-4 rounded-lg';
        button.textContent = key;
        button.onclick = () => {
            saveState();
            teamData.formation = key;
            const newCoords = formationMap[key];
            teamData.lineup.forEach((player, i) => {
                if(team === 'home') player.coords = { x: newCoords[i].x / 2, y: newCoords[i].y };
                else player.coords = { x: 50 + (100 - newCoords[i].x) / 2, y: newCoords[i].y };
            });
            renderAll(APP_STATE.currentMatch);
            document.getElementById('formation-modal').classList.add('hidden');
        };
        container.appendChild(button);
    });
    document.getElementById('formation-modal').classList.remove('hidden');
}

export function openRefereeMenu() {
    const container = document.getElementById('referee-buttons-container');
    container.innerHTML = '';
    Object.keys(APP_STATE.database.referees).sort().forEach(refName => {
        const button = document.createElement('button');
        button.className = 'menu-button font-bold py-2 px-4 rounded-lg text-left';
        button.textContent = refName;
        button.onclick = () => { selectReferee(refName); };
        container.appendChild(button);
    });
    document.getElementById('referee-modal').classList.remove('hidden');
}

function selectReferee(refName) {
    saveState();
    APP_STATE.currentMatch.referee = refName;
    renderAll(APP_STATE.currentMatch);
    document.getElementById('referee-modal').classList.add('hidden');
}

export function openSubstitutionBench(e, el) {
    e.preventDefault();
    playerToSubstitute = el;
    const teamType = el.dataset.team;
    const teamName = teamType === 'home' ? APP_STATE.currentMatch.homeTeam.name : APP_STATE.currentMatch.awayTeam.name;
    const allTeamPlayers = APP_STATE.database.players[teamName];
    const teamData = APP_STATE.database.teams[teamName];
    const currentLineup = teamType === 'home' ? APP_STATE.currentMatch.homeTeam.lineup : APP_STATE.currentMatch.awayTeam.lineup;
    const playersOnPitchNames = new Set(currentLineup.map(p => p.name));
    const substitutes = allTeamPlayers.filter(p => !playersOnPitchNames.has(p.name));
    
    const categorizedPlayers = { 'Arqueros': [], 'Defensas': [], 'Mediocampistas': [], 'Delanteros': [] };
    const positionMap = { 'GK': 'Arqueros', 'DEF': 'Defensas', 'MID': 'Mediocampistas', 'FWD': 'Delanteros' };
    substitutes.forEach(player => {
        const positionGroup = positionMap[player.position];
        if (positionGroup) categorizedPlayers[positionGroup].push(player);
    });
    
    const benchPlayerList = document.getElementById('bench-player-list');
    benchPlayerList.innerHTML = '';
    const jerseySvg = `<svg viewBox="0 0 60 55" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 10C25 10 22 7 22 4C22 1 25 0 30 0C35 0 38 1 38 4C38 7 35 10 30 10Z" fill="#AEAEAE"/><path d="M30 11C24 11 20.5 8 20.5 4.5C20.5 1.5 24 0.5 30 0.5C36 0.5 39.5 1.5 39.5 4.5C39.5 8 36 11 30 11Z" stroke="#E0E0E0" stroke-width="2.5" transform="translate(0, -1)"/><path d="M20.5 5.5C18 7 15 7.5 12.5 8L0 12L3 21L9 54.5H51L57 21L60 12L47.5 8C45 7.5 42 7 39.5 5.5L38 4C35 1 30 1 30 1S25 1 22 4L20.5 5.5Z" class="jersey-color-path"/><path d="M20.5 5.5C18 7 15 7.5 12.5 8L0 12V24L10 54.5H30V5.5C27 5.5 23 5.5 20.5 5.5Z" fill="black" fill-opacity="0.1"/></svg>`; 
    
    for (const position in categorizedPlayers) { 
        const group = categorizedPlayers[position];
        if (group.length > 0) { 
            const groupContainer = document.createElement('div');
            groupContainer.className = 'bench-player-group';
            const groupHeader = document.createElement('h4');
            groupHeader.className = 'bench-player-group-header';
            groupHeader.textContent = position;
            groupContainer.appendChild(groupHeader);
            const grid = document.createElement('div');
            grid.className = 'bench-player-grid'; 
            group.forEach(player => { 
                const playerCard = document.createElement('div');
                playerCard.className = 'bench-player-card';
                const isGk = player.position === 'GK';
                const jerseyColor = isGk ? teamData.gkJerseyColor : teamData.jerseyColor;
                const numberColor = teamData.numberColor; 
                playerCard.innerHTML = `<div class="jersey-icon">${jerseySvg}<span class="jersey-number-on-card" style="color: ${numberColor};">${player.number}</span></div><span class="bench-player-name">${player.name}</span>`; 
                playerCard.querySelector('.jersey-color-path').style.fill = jerseyColor;
                playerCard.onclick = () => { swapPlayers(player); };
                grid.appendChild(playerCard); 
            }); 
            groupContainer.appendChild(grid);
            benchPlayerList.appendChild(groupContainer); 
        } 
    } 
    document.getElementById('bench-panel').classList.add('is-open'); 
}

function swapPlayers(newPlayer) { 
    if (!playerToSubstitute) return; 
    saveState();
    const team = playerToSubstitute.dataset.team; 
    const lineup = team === 'home' ? APP_STATE.currentMatch.homeTeam.lineup : APP_STATE.currentMatch.awayTeam.lineup; 
    const idParts = playerToSubstitute.dataset.id.split('-'); 
    const oldPlayerIndex = parseInt(idParts[1], 10);
    if (oldPlayerIndex >= 0 && oldPlayerIndex < lineup.length) { 
        const oldPlayer = lineup[oldPlayerIndex];
        newPlayer.coords = oldPlayer.coords;
        lineup[oldPlayerIndex] = newPlayer; 
        renderAll(APP_STATE.currentMatch); 
        document.getElementById('bench-panel').classList.remove('is-open'); 
    }
    playerToSubstitute = null;
}

export function openKeyPlayerSelector(teamType) {
    const teamName = teamType === 'home' ? APP_STATE.currentMatch.homeTeam.name : APP_STATE.currentMatch.awayTeam.name;
    const faces = APP_STATE.database.faces[teamName];
    if (!faces) { alert(`No se encontraron protagonistas para ${teamName}`); return; }
    
    const modal = document.getElementById('key-player-selector-modal');
    const title = document.getElementById('key-player-modal-title');
    const grid = document.getElementById('key-player-selection-grid');
    
    title.textContent = `Seleccionar Protagonista para ${teamName}`;
    grid.innerHTML = '';
    
    for (const specialtyKey in faces) {
        const player = faces[specialtyKey];
        const item = document.createElement('div');
        item.className = 'selection-item';
        item.innerHTML = `<img src="${player.photoUrl}" alt="${player.name}"><p class="player-name">${player.name}</p><p class="player-specialty">${specialtyKey}</p>`;
        item.onclick = () => {
            saveState();
            const selectedPlayer = { ...player, specialty: specialtyKey };
            APP_STATE.currentMatch.keyPlayers[teamType] = selectedPlayer;
            renderAll(APP_STATE.currentMatch);
            modal.classList.add('hidden');
        };
        grid.appendChild(item);
    }
    modal.classList.remove('hidden');
}

export function addOddsImages(files) {
    const previewGrid = document.getElementById('odds-preview-grid');
    const newFiles = Array.from(files);

    newFiles.forEach(file => {
        uploadedOddsImages.push(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            const container = document.createElement('div');
            container.className = 'img-preview-container';
            container.innerHTML = `<img src="${e.target.result}" class="img-preview"><button class="img-delete-btn">&times;</button>`;
            container.querySelector('.img-delete-btn').onclick = () => {
                const index = uploadedOddsImages.indexOf(file);
                if (index > -1) uploadedOddsImages.splice(index, 1);
                container.remove();
            };
            previewGrid.appendChild(container);
        }
        reader.readAsDataURL(file);
    });
}

export function addInjuryImages(files, teamType) {
    const previewGrid = document.getElementById(`injury-preview-grid-${teamType}`);
    const imageArray = teamType === 'home' ? uploadedInjuryImagesHome : uploadedInjuryImagesAway;
    const newFiles = Array.from(files);

    newFiles.forEach(file => {
        if (imageArray.length >= 2) {
            alert(`Puedes subir un máximo de 2 imágenes para las bajas del equipo ${teamType}.`);
            return;
        }
        imageArray.push(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            const container = document.createElement('div');
            container.className = 'img-preview-container';
            container.innerHTML = `<img src="${e.target.result}" class="img-preview"><button class="img-delete-btn">&times;</button>`;
            container.querySelector('.img-delete-btn').onclick = () => {
                const index = imageArray.indexOf(file);
                if (index > -1) imageArray.splice(index, 1);
                container.remove();
            };
            previewGrid.appendChild(container);
        }
        reader.readAsDataURL(file);
    });
}

export function openAIGeneratorModal() {
    if (!APP_STATE.currentMatch) { alert("Primero abre la mesa de trabajo."); return; }
    const modal = document.getElementById('ai-generator-modal');
    const refereeSelect = document.getElementById('generator-referee-select');
            
    if (APP_STATE.currentLeagueType === 'champions') {
        const stageSelect = document.getElementById('generator-stage-select');
        const firstLegContainer = document.getElementById('first-leg-score-container');
        const leagueDayContainer = document.getElementById('league-stage-day-container');
        
        stageSelect.innerHTML = '';
        const stages = [ "Fase de Liga", "Play-off (Ida)", "Play-off (Vuelta)", "Octavos de Final (Ida)", "Octavos de Final (Vuelta)", "Cuartos de Final (Ida)", "Cuartos de Final (Vuelta)", "Semifinal (Ida)", "Semifinal (Vuelta)", "Final" ];
        stages.forEach(stage => {
            const option = document.createElement('option');
            option.textContent = stage;
            stageSelect.appendChild(option);
        });

        if (!stageSelect.dataset.listenerAttached) {
            stageSelect.addEventListener('change', (e) => {
                const value = e.target.value.toLowerCase();
                firstLegContainer.classList.toggle('hidden', !value.includes('vuelta'));
                leagueDayContainer.classList.toggle('hidden', !value.includes('fase de liga'));
            });
            stageSelect.dataset.listenerAttached = 'true';
        }
        stageSelect.dispatchEvent(new Event('change'));
    }
    
    refereeSelect.innerHTML = '';
    Object.keys(APP_STATE.database.referees).sort().forEach(refName => {
        const option = document.createElement('option');
        option.value = refName;
        option.textContent = refName;
        if (refName === APP_STATE.currentMatch.referee) option.selected = true;
        refereeSelect.appendChild(option);
    });

    const classicContainer = document.getElementById('classic-matchups-container');
    const classicGrid = document.getElementById('classic-matchups-grid');
    
    if (classicContainer && classicGrid) {
        classicGrid.innerHTML = '';
        classicContainer.classList.add('hidden');

        if (APP_STATE.currentLeagueType === 'champions') {
            const currentHome = APP_STATE.currentMatch.home;
            const currentAway = APP_STATE.currentMatch.away;
            const motivationTextarea = document.getElementById('generator-motivation-textarea');
            const classicMatches = [
                { teams: ['Real Madrid', 'FC Barcelona'], name: 'El Clásico', text: 'El Clásico. La rivalidad más grande del fútbol mundial. La intensidad y la presión están al máximo, independientemente del estado de forma.' },
                { teams: ['FC Bayern Munich', 'Borussia Dortmund'], name: 'Der Klassiker', text: 'Der Klassiker. Intensa rivalidad alemana en el escenario europeo. Partidos que suelen ser muy tácticos y disputados.' },
                { teams: ['Manchester United', 'Liverpool FC'], name: 'North-West Derby', text: 'Derbi del Noroeste de Inglaterra. Una de las rivalidades más históricas y feroces. La pasión de la afición se traslada al campo.' },
                { teams: ['AC Milan', 'Inter'], name: 'Derby della Madonnina', text: 'Derby de Milán. La ciudad se paraliza. El orgullo y la historia están en juego, resultando en partidos muy emocionales.' }
            ];
            classicMatches.forEach(match => {
                if (match.teams.includes(currentHome) && match.teams.includes(currentAway)) {
                    const homeTeamData = APP_STATE.database.teams[currentHome];
                    const awayTeamData = APP_STATE.database.teams[currentAway];
                    if (homeTeamData && awayTeamData) {
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.className = 'classic-button';
                        button.innerHTML = `<img src="${homeTeamData.logoUrl}" alt="${homeTeamData.name}"><span class="text-xs font-bold">${match.name}</span><img src="${awayTeamData.logoUrl}" alt="${awayTeamData.name}">`;
                        button.addEventListener('click', () => {
                            motivationTextarea.value = (motivationTextarea.value ? motivationTextarea.value + '\n\n' : '') + match.text;
                            document.querySelectorAll('#classic-matchups-grid .classic-button').forEach(b => b.classList.remove('selected'));
                            button.classList.add('selected');
                        });
                        classicGrid.appendChild(button);
                    }
                }
            });
            if (classicGrid.children.length > 0) {
                classicContainer.classList.remove('hidden');
            }
        }
    }

    document.getElementById('main-app-container').classList.add('hidden');
    modal.classList.remove('hidden');
}

export function closeAIGeneratorModal() {
    const modal = document.getElementById('ai-generator-modal');
    modal.classList.add('hidden');
    if(APP_STATE.currentMatch){
        document.getElementById('main-app-container').classList.remove('hidden');
    }
}
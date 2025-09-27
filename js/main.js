// Importa todos los módulos necesarios
import * as logic from './logic.js';
import * as ui from './ui.js';

// --- ============================================ ---
// --- APPLICATION INITIALIZATION ---
// --- ============================================ ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar el estado guardado y restaurar la UI si es necesario
    loadAndRestoreAppState();

    // 2. Inicializar la página de selección de ligas
    ui.initializeSelectorPage();

    // 3. Configurar todos los event listeners de la aplicación
    setupEventListeners();
});

// --- ============================================ ---
// --- STATE RESTORATION ---
// --- ============================================ ---

function loadAndRestoreAppState() {
    const savedStateJSON = localStorage.getItem('khipuProState');
    if (!savedStateJSON) return;

    try {
        const savedState = JSON.parse(savedStateJSON);
        logic.APP_STATE.database = savedState.database || {};
        logic.APP_STATE.currentMatch = savedState.currentMatch || null;
        logic.APP_STATE.selectedHome = savedState.selectedHome || null;
        logic.APP_STATE.selectedAway = savedState.selectedAway || null;
        logic.APP_STATE.activePage = savedState.activePage || 'selector';
        logic.APP_STATE.analysisGenerated = savedState.analysisGenerated || false;
        logic.APP_STATE.currentLeagueType = savedState.currentLeagueType || null;

        // Restaurar la UI basada en el estado guardado
        if (logic.APP_STATE.activePage === 'analysis' && logic.APP_STATE.currentMatch) {
            const league = logic.leagues.find(l => l.type === logic.APP_STATE.currentLeagueType) || logic.leagues[0];
            const mainContainer = document.getElementById('main-app-container');
            const template = document.getElementById('main-content-template');

            ui.showAnalysisPanel(league);
            mainContainer.innerHTML = '';
            mainContainer.appendChild(template.content.cloneNode(true));

            const headerTextEl = mainContainer.querySelector('header .text-right p');
            if (headerTextEl) {
                let headerText = '"THE BEST LEAGUE IN THE WORD"';
                if (logic.APP_STATE.currentLeagueType === 'champions') {
                    headerText = 'Noches Mágicas de Champions';
                } else if (logic.APP_STATE.currentLeagueType === 'laliga') {
                    headerText = 'La Liga de las Estrellas';
                }
                headerTextEl.textContent = headerText;
            }

            ui.renderAll(logic.APP_STATE.currentMatch);
            document.getElementById('file-importer-modal').classList.add('hidden');
            document.getElementById('team-selection-modal').classList.add('hidden');
            mainContainer.classList.remove('hidden');
            mainContainer.classList.add('flex');
            
        } else if (logic.APP_STATE.activePage === 'team-selection' && Object.keys(logic.APP_STATE.database).length > 0) {
            const league = logic.leagues.find(l => l.type === logic.APP_STATE.currentLeagueType) || logic.leagues[0];
            ui.showAnalysisPanel(league);
            document.getElementById('file-importer-modal').classList.add('hidden');
            ui.showTeamSelector();
        }
    } catch (e) {
        console.error("Error al cargar el estado de la aplicación, iniciando de cero:", e);
        localStorage.removeItem('khipuProState');
    }
}


// --- ============================================ ---
// --- EVENT LISTENERS SETUP ---
// --- ============================================ ---

function setupEventListeners() {

    // --- PAGE SELECTOR THEME PANEL ---
    const toggleBtn = document.getElementById('main-settings-toggle-btn');
    const settingsPanel = document.getElementById('main-settings-panel');
    if (toggleBtn && settingsPanel) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsPanel.classList.toggle('is-open');
        });
        document.addEventListener('click', (e) => {
            if (settingsPanel.classList.contains('is-open') && !e.target.closest('#main-settings-panel')) {
                settingsPanel.classList.remove('is-open');
            }
        });
    }
    document.querySelectorAll('.theme-preview-btn').forEach(button => {
        button.addEventListener('click', () => {
            ui.applyMainTheme(button.dataset.mainTheme);
        });
    });

    // --- FILE UPLOAD ---
    const form = document.getElementById('file-upload-form');
    if (form) {
        form.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', () => {
                const card = document.getElementById(`card-${input.id}`);
                const textSpan = card.querySelector('.upload-text');
                const checkmark = card.querySelector('.upload-checkmark');
                if (input.files.length > 0) {
                    card.classList.add('file-loaded');
                    textSpan.textContent = input.files[0].name;
                    textSpan.classList.add('filename');
                    checkmark.classList.remove('hidden');
                } else {
                    card.classList.remove('file-loaded');
                    textSpan.textContent = textSpan.dataset.defaultText;
                    textSpan.classList.remove('filename');
                    checkmark.classList.add('hidden');
                }
            });
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            // INICIO: MODIFICACIÓN PARA CLÁSICOS
            const fileIds = ['league-file', 'players-file', 'referees-file', 'faces-file', 'tournament-data-file', 'classics-file'];
            const filePromises = fileIds.map(id => {
                const fileInput = document.getElementById(id);
                return fileInput && fileInput.files.length > 0 ? logic.readFileAsJson(fileInput.files[0]) : Promise.resolve(null);
            });
            
            try {
                const [leagueData, players, referees, faces, tournamentData, classics] = await Promise.all(filePromises);
                
                if (!leagueData || !players || !referees || !faces || !tournamentData) {
                    alert("Por favor, asegúrate de seleccionar todos los archivos requeridos (excepto Clásicos que es opcional).");
                    return;
                }

                logic.APP_STATE.database = {
                    teams: leagueData.teams,
                    theme: leagueData.theme,
                    players, referees,
                    faces: faces.player_stats || faces,
                    tournamentData,
                    classics // Puede ser null si no se carga
                };
                // FIN: MODIFICACIÓN PARA CLÁSICOS

                ui.showTeamSelector();
                logic.saveFullAppState();
            } catch (error) {
                alert(`Error al cargar los archivos: ${error.message}`);
                console.error(error);
            }
        });
    }

    // --- NAVIGATION & MODALS ---
    document.getElementById('back-to-importer-btn')?.addEventListener('click', ui.showImporter);

    document.getElementById('open-workbench-btn')?.addEventListener('click', () => {
        if (logic.APP_STATE.selectedHome && logic.APP_STATE.selectedAway) {
            if (logic.APP_STATE.selectedHome === logic.APP_STATE.selectedAway) {
                alert("Por favor, selecciona dos equipos diferentes.");
                return;
            }
            prepareAndShowWorkbench(logic.APP_STATE.selectedHome, logic.APP_STATE.selectedAway);
        }
    });

    document.getElementById('close-generator-modal')?.addEventListener('click', ui.closeAIGeneratorModal);

    document.getElementById('reset-session-btn')?.addEventListener('click', () => {
        if (confirm("¿Estás seguro de que quieres reiniciar la sesión? Se perderá toda la información cargada y el análisis actual.")) {
            localStorage.removeItem('khipuProState');
            location.reload();
        }
    });

    const captureModeBtn = document.getElementById('capture-mode-btn');
    if (captureModeBtn) {
        captureModeBtn.addEventListener('click', () => {
            document.getElementById('main-app-container').classList.toggle('capture-mode');
            document.getElementById('page-analysis').classList.toggle('capture-mode-active');
            captureModeBtn.classList.toggle('active');
        });
    }

    // --- AI & GENERATION ---
    document.getElementById('generate-analysis-btn-unified')?.addEventListener('click', handleAIGeneration);
    document.getElementById('detect-injuries-btn-home')?.addEventListener('click', () => handleInjuryDetection('home'));
    document.getElementById('detect-injuries-btn-away')?.addEventListener('click', () => handleInjuryDetection('away'));
    document.getElementById('generator-retry-btn')?.addEventListener('click', () => {
        document.getElementById('generator-error-container').classList.add('hidden');
        handleAIGeneration();
    });

    // --- DYNAMIC MODALS & KEYBOARD SHORTCUTS ---
    setupDynamicModalAndKeyboardListeners();

    // --- IMAGE PASTING ---
    setupImagePasteListeners();
    
    // --- EVENTOS DELEGADOS PARA ELEMENTOS DINÁMICOS ---
    const mainContainer = document.getElementById('main-app-container');

    mainContainer.addEventListener('click', (e) => {
        const keyPlayerCard = e.target.closest('#key-players-container .group');
        if (keyPlayerCard && keyPlayerCard.dataset.teamType) {
            ui.openKeyPlayerSelector(keyPlayerCard.dataset.teamType);
        }
    });

    mainContainer.addEventListener('contextmenu', (e) => {
        const playerMarker = e.target.closest('.player-marker');
        if (playerMarker) {
            e.preventDefault();
            ui.openSubstitutionBench(e, playerMarker);
        }
    });

    mainContainer.addEventListener('dblclick', (e) => {
        const playerMarker = e.target.closest('.player-marker');
        if (playerMarker) {
            ui.openEditModal(playerMarker);
        }
    });

    mainContainer.addEventListener('mousedown', (e) => {
        const playerMarker = e.target.closest('.player-marker');
        if (playerMarker) ui.startDrag(e, playerMarker);
    });
    mainContainer.addEventListener('touchstart', (e) => {
        const playerMarker = e.target.closest('.player-marker');
        if (playerMarker) ui.startDrag(e, playerMarker, { passive: false });
    });
    document.addEventListener('mousemove', ui.drag);
    document.addEventListener('touchmove', ui.drag, { passive: false });
    document.addEventListener('mouseup', ui.endDrag);
    document.addEventListener('touchend', ui.endDrag);
}

// --- ============================================ ---
// --- HELPER FUNCTIONS FOR MAIN.JS ---
// --- ============================================ ---

function prepareAndShowWorkbench(homeTeamName, awayTeamName) {
    logic.APP_STATE.history = [];
    logic.APP_STATE.analysisGenerated = false;

    const homeTeamData = logic.APP_STATE.database.teams[homeTeamName];
    const awayTeamData = logic.APP_STATE.database.teams[awayTeamName];
    const homeTournamentStats = logic.findTeamStats(homeTeamName);
    const awayTournamentStats = logic.findTeamStats(awayTeamName);
    const homeLineup = logic.generateStartingLineup(logic.APP_STATE.database.players[homeTeamName] || []);
    const awayLineup = logic.generateStartingLineup(logic.APP_STATE.database.players[awayTeamName] || []);

    const homeCoords = logic.formationMap["4-3-3"];
    homeLineup.forEach((player, i) => player.coords = { x: homeCoords[i].x / 2, y: homeCoords[i].y });

    const awayCoords = logic.formationMap["4-3-3"];
    awayLineup.forEach((player, i) => player.coords = { x: 50 + (100 - awayCoords[i].x) / 2, y: awayCoords[i].y });

    const homeYellows = logic._.get(homeTournamentStats, 'home_stats.yellow_cards_per_game', 0);
    const homeReds = logic._.get(homeTournamentStats, 'home_stats.red_cards_per_game', 0);
    const awayYellows = logic._.get(awayTournamentStats, 'away_stats.yellow_cards_per_game', 0);
    const awayReds = logic._.get(awayTournamentStats, 'away_stats.red_cards_per_game', 0);

    logic.APP_STATE.currentMatch = {
        home: homeTeamName,
        away: awayTeamName,
        pick: { market: "Pick no definido" },
        odds: "1.00",
        fundamentals: [],
        keyStats: [
            { metric: 'Remates', home: Number((logic._.get(homeTournamentStats, 'home_stats.shots_per_game', 0)).toFixed(1)), away: Number((logic._.get(awayTournamentStats, 'away_stats.shots_per_game', 0)).toFixed(1)) },
            { metric: 'Remates a Puerta', home: Number((logic._.get(homeTournamentStats, 'home_stats.shots_on_target_per_game', 0)).toFixed(1)), away: Number((logic._.get(awayTournamentStats, 'away_stats.shots_on_target_per_game', 0)).toFixed(1)) },
            { metric: 'Faltas Cometidas', home: Number((logic._.get(homeTournamentStats, 'home_stats.fouls_per_game', 0)).toFixed(1)), away: Number((logic._.get(awayTournamentStats, 'away_stats.fouls_per_game', 0)).toFixed(1)) },
            { metric: 'Saques de Esquina', home: Number((logic._.get(homeTournamentStats, 'home_stats.corners_per_game', 0)).toFixed(1)), away: Number((logic._.get(awayTournamentStats, 'away_stats.corners_per_game', 0)).toFixed(1)) },
            { metric: 'Total de Tarjetas', home: Number((homeYellows + (homeReds * 2)).toFixed(1)), away: Number((awayYellows + (awayReds * 2)).toFixed(1)) },
        ],
        keyPlayers: { home: Object.values(logic.APP_STATE.database.faces[homeTeamName] || {})[0], away: Object.values(logic.APP_STATE.database.faces[awayTeamName] || {})[0] },
        referee: Object.keys(logic.APP_STATE.database.referees)[0],
        stadium: homeTeamData.stadium || "Estadio no definido",
        location: homeTeamData.location || "Ubicación no definida",
        homeTeam: { name: homeTeamName, ...homeTeamData, formation: "4-3-3", lineup: homeLineup },
        awayTeam: { name: awayTeamName, ...awayTeamData, formation: "4-3-3", lineup: awayLineup }
    };

    const mainContainer = document.getElementById('main-app-container');
    const template = document.getElementById('main-content-template');
    mainContainer.innerHTML = '';
    mainContainer.appendChild(template.content.cloneNode(true));
    
    const headerTextEl = mainContainer.querySelector('header .text-right p');
    if (headerTextEl) {
        let headerText = '"THE BEST LEAGUE IN THE WORD"';
        if (logic.APP_STATE.currentLeagueType === 'champions') {
            headerText = 'Noches Mágicas de Champions';
        } else if (logic.APP_STATE.currentLeagueType === 'laliga') {
            headerText = 'La Liga de las Estrellas';
        }
        headerTextEl.textContent = headerText;
    }
    
    ui.renderAll(logic.APP_STATE.currentMatch);

    document.getElementById('team-selection-modal').classList.add('hidden');
    mainContainer.classList.remove('hidden');
    mainContainer.classList.add('flex');
    
    const logoUploadInput = mainContainer.querySelector('#league-logo-upload');
    if (logoUploadInput) {
        logoUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    mainContainer.querySelector('#uploaded-league-logo').src = event.target.result;
                    mainContainer.querySelector('#uploaded-league-logo').classList.remove('hidden');
                    mainContainer.querySelector('#default-league-logo').classList.add('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    logic.APP_STATE.activePage = 'analysis';
    logic.saveFullAppState();
}

async function handleAIGeneration() {
    const loadingContainer = document.getElementById('generator-loading-container');
    const progressBar = document.getElementById('generator-progress-bar');
    const loadingMessageSpan = document.getElementById('loading-message');
    const errorContainer = document.getElementById('generator-error-container');
    const errorMessageP = document.getElementById('generator-error-message');

    loadingContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    errorContainer.classList.add('hidden');

    const animateProgress = (target, duration, message) => {
        const start = parseFloat(progressBar.style.width) || 0;
        const stepTime = 20;
        let steps = duration / stepTime;
        let increment = (target - start) / steps;
        
        return new Promise(resolve => {
            const interval = setInterval(() => {
                let current = parseFloat(progressBar.style.width) + increment;
                if (current >= target) {
                    current = target;
                    clearInterval(interval);
                    resolve();
                }
                progressBar.style.width = `${current}%`;
                loadingMessageSpan.textContent = `${message} (${Math.round(current)}%)`;
            }, stepTime);
        });
    };

    const getHumanContext = () => {
        const stage = document.getElementById('generator-stage-select').value;
        const leagueDaySelector = document.getElementById('league-stage-day-select');
        let finalStage = stage;
        if (stage.toLowerCase().includes('fase de liga') && !leagueDaySelector.parentElement.classList.contains('hidden')) {
            finalStage = `Fase de Liga (Jornada ${leagueDaySelector.value})`;
        }
        return {
            refereeName: document.getElementById('generator-referee-select').value,
            etapa_torneo: finalStage,
            resultado_ida: stage.toLowerCase().includes('vuelta') ? document.getElementById('first-leg-score-input').value : "N/A",
            condiciones: {
                clima: document.getElementById('generator-climate-input').value,
                estado_campo: document.getElementById('generator-pitch-select').value,
                motivacion_momento: document.getElementById('generator-motivation-textarea').value
            },
            bajas_sanciones: {
                local: document.getElementById('generator-absences-textarea-home').value,
                visitante: document.getElementById('generator-absences-textarea-away').value
            },
            analisis_experto: {
                apuntes: document.getElementById('generator-verdict-textarea').value,
                enfoque: document.getElementById('generator-commands-input').value
            }
        };
    };

    await animateProgress(20, 1000, 'Preparando datos');
    const result = await logic.generateAndApplyAIPick(getHumanContext);
    
    if (result.success) {
        await animateProgress(100, 1500, 'Análisis Completado');
        setTimeout(() => {
            ui.renderAll(result.data);
            ui.closeAIGeneratorModal();
            loadingContainer.classList.add('hidden');
        }, 800);
    } else {
        errorMessageP.textContent = result.message;
        errorContainer.classList.remove('hidden');
        loadingContainer.classList.add('hidden');
    }
}

async function handleInjuryDetection(teamType) {
    const absencesTextarea = document.getElementById(`generator-absences-textarea-${teamType}`);
    const statusP = document.getElementById(`detection-status-${teamType}`);

    statusP.textContent = `Analizando...`;
    statusP.classList.remove('hidden');
    absencesTextarea.value = 'Detectando...';

    const result = await logic.detectInjuries(teamType);

    if (result.success) {
        absencesTextarea.value = result.text;
        statusP.textContent = '¡Detección completada!';
    } else {
        statusP.textContent = `Error: ${result.message}`;
        absencesTextarea.value = '';
        alert(result.message);
    }
}

function setupDynamicModalAndKeyboardListeners() {
    const modalsContainer = document.getElementById('modals-container');
    if (modalsContainer) {
        modalsContainer.innerHTML = `
            <div id="shortcuts-menu" class="hidden"><h4 class="font-bold text-gradient mb-2 text-center text-sm">Atajos de Teclado</h4><div class="space-y-2 text-xs"><div class="shortcut-item"><p>Equipación Local</p><span class="shortcut-key">Ctrl + 1</span></div><div class="shortcut-item"><p>Equipación Visitante</p><span class="shortcut-key">Ctrl + 2</span></div><div class="shortcut-item"><p>Alineación Local</p><span class="shortcut-key">Ctrl + 3</span></div><div class="shortcut-item"><p>Alineación Visitante</p><span class="shortcut-key">Ctrl + 4</span></div><div class="shortcut-item"><p>Árbitros</p><span class="shortcut-key">Ctrl + 5</span></div><div class="shortcut-item"><p>Deshacer Cambio</p><span class="shortcut-key">Ctrl + Z</span></div><div class="shortcut-item"><p>Reiniciar Sesión</p><span class="shortcut-key">Ctrl + R</span></div><div class="shortcut-item"><p>Generar Análisis</p><span class="shortcut-key">Ctrl + G</span></div><div class="shortcut-item"><p>Ocultar Controles (Modo Captura)</p><span class="shortcut-key">Ctrl + Alt</span></div><div class="shortcut-item"><p>Volver</p><span class="shortcut-key">Esc</span></div></div></div>
            <div id="referee-modal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div class="card p-6 rounded-lg w-full max-w-2xl"><h3 class="font-bold text-lg text-gradient mb-4 text-center">Seleccionar Árbitro</h3><div id="referee-buttons-container" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto no-scrollbar"></div><button onclick="document.getElementById('referee-modal').classList.add('hidden')" class="modal-button w-1/2 mx-auto mt-4">Cerrar</button></div></div>
            <div id="formation-modal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div class="card p-6 rounded-lg w-full max-w-md text-center"><h3 id="formation-modal-title" class="font-bold text-lg text-gradient mb-4">Seleccionar Formación</h3><div id="formation-buttons-container" class="grid grid-cols-3 gap-2"></div><button onclick="document.getElementById('formation-modal').classList.add('hidden')" class="modal-button w-1/2 mx-auto">Cerrar</button></div></div>
            <div id="edit-pick-modal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div class="card p-6 rounded-lg w-full max-w-xs text-center"><h3 class="font-bold text-lg text-gradient mb-2">Editar Pick</h3><input id="edit-odds-input" type="number" step="0.01" class="modal-input"><input id="edit-stake-input" type="number" step="1" class="modal-input"><div class="flex gap-2"><button id="save-pick-changes" class="modal-button w-full">Guardar</button><button onclick="document.getElementById('edit-pick-modal').classList.add('hidden')" class="modal-button modal-button-secondary w-full">Cancelar</button></div></div></div>
            <div id="edit-title-modal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div class="card p-6 rounded-lg w-full max-w-sm text-center"><h3 class="font-bold text-lg text-gradient mb-2">Editar Título del Pick</h3><input id="edit-title-input" type="text" class="modal-input"><div class="flex gap-2"><button id="save-title-changes" class="modal-button w-full">Guardar</button><button onclick="document.getElementById('edit-title-modal').classList.add('hidden')" class="modal-button modal-button-secondary w-full">Cancelar</button></div></div></div>
            <div id="edit-player-modal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div class="card p-6 rounded-lg w-full max-w-xs text-center"><h3 class="font-bold text-lg text-gradient mb-2">Editar Jugador</h3><input id="edit-player-name" type="text" class="modal-input"><input id="edit-player-number" type="number" class="modal-input"><div class="flex gap-2"><button id="save-player-changes" class="modal-button w-full">Guardar</button><button onclick="ui.closeEditModal()" class="modal-button modal-button-secondary w-full">Cancelar</button></div></div></div>
            <div id="color-editor-panel" class="editor-panel fixed top-0 left-0 h-full w-full max-w-xs border-r-2 shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col p-6" style="border-color: var(--border-color); background-color: var(--bg-premier);"><div class="flex justify-between items-center mb-4"><h3 id="color-picker-title" class="font-bold text-lg text-gradient">Estudio de Diseño</h3><button onclick="document.getElementById('color-editor-panel').classList.remove('is-open')" class="hover:text-accent-green transition-colors" style="color: var(--text-primary);"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div><div class="space-y-4 text-left overflow-y-auto no-scrollbar flex-grow"><div><label class="stat-label" for="jersey-color-input">Color de Vestimenta</label><input type="color" id="jersey-color-input" class="color-picker-input"></div><div><label class="stat-label" for="gk-jersey-color-input">Vestimenta del Arquero</label><input type="color" id="gk-jersey-color-input" class="color-picker-input"></div><div><label class="stat-label" for="number-color-input">Color del Dorsal</label><input type="color" id="number-color-input" class="color-picker-input"></div></div></div>
            <div id="bench-panel" class="bench-panel"><div id="bench-content" class="bench-content"><button onclick="document.getElementById('bench-panel').classList.remove('is-open')" class="bench-close-button">&times;</button><h3 class="bench-header text-gradient">Banco de Suplentes</h3><div id="bench-player-list" class="bench-player-list"></div></div></div>
            <div id="key-player-selector-modal" class="selection-modal hidden"><div class="selection-content"><h2 id="key-player-modal-title" class="text-2xl font-bold text-gradient mb-4 text-center"></h2><div id="key-player-selection-grid" class="selection-grid no-scrollbar"></div><button onclick="document.getElementById('key-player-selector-modal').classList.add('hidden')" class="modal-button w-1/2 mx-auto mt-4">Cerrar</button></div></div>
        `;

        document.getElementById('analysis-settings-toggle-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('analysis-theme-panel').classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('analysis-theme-panel');
            if (panel && !panel.classList.contains('hidden') && !e.target.closest('#analysis-settings-container')) {
                panel.classList.add('hidden');
            }
        });
        
        document.getElementById('save-player-changes').addEventListener('click', ui.savePlayerChanges);
        
        document.getElementById('save-title-changes').addEventListener('click', () => {
            const newTitle = document.getElementById('edit-title-input').value;
            if (logic.APP_STATE.currentMatch && newTitle) {
                logic.saveState();
                logic.APP_STATE.currentMatch.pick.market = newTitle;
                document.getElementById('pick-title').textContent = newTitle.toUpperCase();
                logic.saveFullAppState();
            }
            document.getElementById('edit-title-modal').classList.add('hidden');
        });

        document.getElementById('save-pick-changes').addEventListener('click', () => {
            const newOdds = document.getElementById('edit-odds-input').value;
            const newStake = document.getElementById('edit-stake-input').value;
            if (logic.APP_STATE.currentMatch) {
                logic.saveState();
                logic.APP_STATE.currentMatch.odds = newOdds || logic.APP_STATE.currentMatch.odds;
                ui.updatePick(document.getElementById('main-app-container'), logic.APP_STATE.currentMatch.odds, newStake);
                logic.saveFullAppState();
            }
            document.getElementById('edit-pick-modal').classList.add('hidden');
        });

        ['jersey-color-input', 'gk-jersey-color-input', 'number-color-input'].forEach(id => {
            document.getElementById(id).addEventListener('input', ui.applyJerseyStylesFromPanel);
        });

        document.body.addEventListener('dblclick', (e) => {
            if (e.target.closest('#pick-editor-container')) {
                if (!logic.APP_STATE.currentMatch) return;
                const score = logic.APP_STATE.currentMatch.verdict_score;
                const stake = score >= 95 ? 25 : score >= 85 ? 20 : score >= 75 ? 15 : score >= 65 ? 10 : 5;
                document.getElementById('edit-odds-input').value = logic.APP_STATE.currentMatch.odds;
                document.getElementById('edit-stake-input').value = stake;
                document.getElementById('edit-pick-modal').classList.remove('hidden');
            }
            if (e.target.closest('#pick-title')) {
                 if (!logic.APP_STATE.currentMatch) return;
                document.getElementById('edit-title-input').value = logic.APP_STATE.currentMatch.pick.market;
                document.getElementById('edit-title-modal').classList.remove('hidden');
            }
        });
    }

    const shortcutsMenu = document.getElementById('shortcuts-menu');
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey) {
            e.preventDefault();
            const settingsContainer = document.getElementById('analysis-settings-container');
            const analysisPage = document.getElementById('page-analysis');
            if (analysisPage.classList.contains('capture-mode-active') && settingsContainer) {
                settingsContainer.classList.toggle('controls-hidden');
            }
        }
        if (e.ctrlKey && e.shiftKey) shortcutsMenu.classList.add('is-visible');

        if (e.key === 'Escape') {
            e.preventDefault();
            const closableModals = ['ai-generator-modal', 'key-player-selector-modal', 'referee-modal', 'formation-modal', 'edit-pick-modal', 'edit-title-modal', 'edit-player-modal'];
            const openModal = closableModals.find(id => !document.getElementById(id)?.classList.contains('hidden'));

            const benchPanel = document.getElementById('bench-panel');
            const colorEditor = document.getElementById('color-editor-panel');

            if (openModal) {
                document.getElementById(openModal).classList.add('hidden');
                if (openModal === 'ai-generator-modal') {
                    document.getElementById('main-app-container').classList.remove('hidden');
                }
            } else if (benchPanel && benchPanel.classList.contains('is-open')) {
                benchPanel.classList.remove('is-open');
            } else if (colorEditor && colorEditor.classList.contains('is-open')) {
                colorEditor.classList.remove('is-open');
            } else {
                const mainAppContainer = document.getElementById('main-app-container');
                const teamSelector = document.getElementById('team-selection-modal');
                const fileImporter = document.getElementById('file-importer-modal');

                if (!mainAppContainer.classList.contains('hidden')) {
                    ui.showTeamSelector();
                } else if (!teamSelector.classList.contains('hidden')) {
                    ui.showImporter();
                } else if (!fileImporter.classList.contains('hidden')) {
                    document.getElementById('page-analysis').classList.add('hidden');
                    document.getElementById('page-selector').classList.remove('hidden');
                    document.body.classList.remove('analysis-active');
                }
            }
        }
        
        if (e.ctrlKey && !e.altKey) {
            switch(e.key.toLowerCase()) {
                case '1': if(logic.APP_STATE.currentMatch) {e.preventDefault(); ui.toggleColorEditor('home');} break;
                case '2': if(logic.APP_STATE.currentMatch) {e.preventDefault(); ui.toggleColorEditor('away');} break;
                case '3': if(logic.APP_STATE.currentMatch) {e.preventDefault(); ui.openFormationMenu('home');} break;
                case '4': if(logic.APP_STATE.currentMatch) {e.preventDefault(); ui.openFormationMenu('away');} break;
                case '5': if(logic.APP_STATE.currentMatch) {e.preventDefault(); ui.openRefereeMenu();} break;
                case 'g': if(logic.APP_STATE.currentMatch) {e.preventDefault(); ui.openAIGeneratorModal();} break;
                case 'z': e.preventDefault(); const restoredMatch = logic.undoLastChange(); if(restoredMatch) ui.renderAll(restoredMatch); break;
                case 'r': e.preventDefault(); document.getElementById('reset-session-btn').click(); break;
            }
        }
    });
    window.addEventListener('keyup', (e) => { if (e.key === 'Control' || e.key === 'Shift') shortcutsMenu.classList.remove('is-visible'); });
}

function setupImagePasteListeners() {
    const allPasteBoxes = document.querySelectorAll('.image-paste-box');
    let activePasteTarget = null;

    allPasteBoxes.forEach(box => {
        if (box) {
            box.addEventListener('focus', () => {
                activePasteTarget = box.id;
                box.classList.add('is-active');
            });
            box.addEventListener('blur', () => {
                activePasteTarget = null;
                box.classList.remove('is-active');
            });
        }
    });

    document.addEventListener('paste', async (e) => {
        if (!activePasteTarget) return;

        e.preventDefault();
        const items = e.clipboardData.items;
        const imageFiles = [];
        for (const item of items) {
            if (item.type.indexOf("image") !== -1) {
                const blob = item.getAsFile();
                const file = new File([blob], "pasted-image.png", { type: blob.type });
                imageFiles.push(file);
            }
        }

        if (imageFiles.length > 0) {
            if (activePasteTarget === 'paste-box-home') {
                ui.addInjuryImages(imageFiles, 'home');
            } else if (activePasteTarget === 'paste-box-away') {
                ui.addInjuryImages(imageFiles, 'away');
            } else if (activePasteTarget === 'paste-box-odds') {
                ui.addOddsImages(imageFiles);
            }
        }
    });

    document.getElementById('injury-image-upload-home')?.addEventListener('change', (e) => ui.addInjuryImages(e.target.files, 'home'));
    document.getElementById('injury-image-upload-away')?.addEventListener('change', (e) => ui.addInjuryImages(e.target.files, 'away'));
    document.getElementById('odds-image-upload')?.addEventListener('change', (e) => ui.addOddsImages(e.target.files));

    document.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.player-marker')) return;
        e.preventDefault();
    });
}
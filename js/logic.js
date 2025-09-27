// --- ============================================ ---
// --- STATE MANAGEMENT & PERSISTENCE ---
// --- ============================================ ---

export let APP_STATE = {
    database: {},
    currentMatch: null,
    selectedHome: null,
    selectedAway: null,
    activePage: 'selector',
    history: [],
    historyLimit: 30,
    analysisGenerated: false,
    currentLeagueType: null
};

export function saveFullAppState() {
    try {
        const stateToSave = {
            database: APP_STATE.database,
            currentMatch: APP_STATE.currentMatch,
            selectedHome: APP_STATE.selectedHome,
            selectedAway: APP_STATE.selectedAway,
            activePage: APP_STATE.activePage,
            analysisGenerated: APP_STATE.analysisGenerated,
            currentLeagueType: APP_STATE.currentLeagueType
        };
        localStorage.setItem('khipuProState', JSON.stringify(stateToSave));
    } catch (e) {
        console.error("Error al guardar el estado de la aplicación:", e);
    }
}

export function saveState() {
    if (!APP_STATE.currentMatch) return;
    const stateCopy = _.cloneDeep(APP_STATE.currentMatch);
    APP_STATE.history.push(stateCopy);
    if (APP_STATE.history.length > APP_STATE.historyLimit) {
        APP_STATE.history.shift();
    }
    saveFullAppState();
}

export function undoLastChange() {
    if (APP_STATE.history.length > 0) {
        const previousState = APP_STATE.history.pop();
        APP_STATE.currentMatch = previousState;
        return APP_STATE.currentMatch;
    } else {
        console.log("No hay más acciones que deshacer.");
        return null;
    }
}

// --- ============================================ ---
// --- CONSTANTS & CONFIGURATION ---
// --- ============================================ ---

export const mainThemeSubtitles = {
    terminal: "El Futuro del Análisis Deportivo Profesional.",
    transmision: "Análisis Claro. La Historia del Partido.",
    pizarra: "La Estrategia Detrás del Juego.",
    informe: "Inteligencia de Élite para Liderar.",
    hub: "Explora las Estadísticas. Vive la Pasión.",
    galactico: "Análisis de Otra Dimensión."
};

export const leagues = [
    { name: 'Premier League', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png', country: 'Inglaterra', isKhipuEnabled: true, type: 'premier' },
    { name: 'La Liga', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png', country: 'España', isKhipuEnabled: true, type: 'laliga' },
    { name: 'Serie A', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png', country: 'Italia', isKhipuEnabled: false },
    { name: 'Bundesliga', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/8.png', country: 'Alemania', isKhipuEnabled: false },
    { name: 'Ligue 1', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/9.png', country: 'Francia', isKhipuEnabled: false },
    { name: 'Liga 1', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/31.png', country: 'Perú', isKhipuEnabled: false },
    { name: 'Brasileirão', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/355.png', country: 'Brasil', isKhipuEnabled: false },
    { name: 'Liga Profesional', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/1.png', country: 'Argentina', isKhipuEnabled: false },
    { name: 'MLS', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/22.png', country: 'EE.UU.', isKhipuEnabled: false },
    { name: 'Champions League', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png', country: 'Europa', isKhipuEnabled: true, type: 'champions' },
];

export const leagueThemes = {
    premier: [
        { id: 'premier-30', name: 'Premier League 30 Años', gradient: 'linear-gradient(45deg, #ff4a4a, #8a2be2)' },
        { id: 'premier-league', name: 'Premier League', gradient: 'linear-gradient(45deg, #310038, #450c4c)' },
        { id: 'inca-light', name: 'Inca Light', gradient: 'linear-gradient(45deg, #FDFEFA, #F1F5F9)', border: '1px solid #E2E8F0' }
    ],
    laliga: [
        { id: 'laliga-santander', name: 'La Liga Santander', gradient: 'linear-gradient(45deg, #ea2e36, #1d1d1d)' },
        { id: 'el-clasico', name: 'El Clásico', gradient: 'linear-gradient(45deg, #a80038, #ffed00)' },
        { id: 'noche-derbi', name: 'Noche de Derbi', gradient: 'linear-gradient(45deg, #d11a2a, #004ea1)' }
    ],
    champions: [
        { id: 'champions-night', name: 'Champions Night', gradient: 'linear-gradient(45deg, #060b28, #101842)', border: '1px solid #7DF9FF' },
        { id: 'champions-stars', name: 'Starball', gradient: 'linear-gradient(145deg, #1b2f7a, #3a228a)', border: '1px solid #d4d4d4' },
        { id: 'champions-final', name: 'The Final', gradient: 'linear-gradient(45deg, #333333, #222222)', border: '1px solid #FFD700' }
    ]
};

export const formationMap = {
    '4-4-2': [ {x:5,y:50},{x:25,y:85},{x:25,y:63},{x:25,y:37},{x:25,y:15},{x:55,y:88},{x:55,y:63},{x:55,y:37},{x:55,y:12},{x:85,y:65},{x:85,y:35} ],
    '4-5-1': [ {x:5,y:50},{x:25,y:85},{x:25,y:63},{x:25,y:37},{x:25,y:15},{x:50,y:90},{x:50,y:70},{x:50,y:50},{x:50,y:30},{x:50,y:10},{x:85,y:50} ],
    '4-3-3': [ {x:5,y:50},{x:25,y:85},{x:25,y:63},{x:25,y:37},{x:25,y:15},{x:55,y:75},{x:55,y:50},{x:55,y:25},{x:85,y:90},{x:85,y:50},{x:85,y:10} ],
    '4-3-2-1': [ {x:5,y:50},{x:25,y:88},{x:25,y:65},{x:25,y:35},{x:25,y:12},{x:50,y:70},{x:50,y:50},{x:50,y:30},{x:70,y:65},{x:70,y:35},{x:88,y:50} ],
    '4-1-3-2': [ {x:5,y:50},{x:25,y:88},{x:25,y:65},{x:25,y:35},{x:25,y:12},{x:45,y:50},{x:65,y:80},{x:65,y:50},{x:65,y:20},{x:88,y:65},{x:88,y:35} ],
    '5-4-1': [ {x:5,y:50},{x:25,y:90},{x:25,y:70},{x:25,y:50},{x:25,y:30},{x:25,y:10},{x:55,y:88},{x:55,y:63},{x:55,y:37},{x:55,y:12},{x:85,y:50} ],
    '4-1-2-1-2': [ {x:5,y:50},{x:25,y:85},{x:25,y:63},{x:25,y:37},{x:25,y:15},{x:45,y:50},{x:60,y:75},{x:60,y:25},{x:75,y:50},{x:90,y:65},{x:90,y:35} ],
    '3-5-2': [ {x:5,y:50},{x:25,y:80},{x:25,y:50},{x:25,y:20},{x:55,y:92},{x:55,y:70},{x:55,y:50},{x:55,y:30},{x:55,y:8},{x:85,y:65},{x:85,y:35} ],
    '5-3-2': [ {x:5,y:50},{x:25,y:92},{x:25,y:70},{x:25,y:50},{x:25,y:30},{x:25,y:8},{x:55,y:75},{x:55,y:50},{x:55,y:25},{x:85,y:65},{x:85,y:35} ],
    '4-2-3-1': [ {x:5,y:50},{x:25,y:85},{x:25,y:63},{x:25,y:37},{x:25,y:15},{x:50,y:65},{x:50,y:35},{x:70,y:90},{x:70,y:50},{x:70,y:10},{x:90,y:50} ],
    '3-2-4-1': [ {x:5,y:50},{x:25,y:80},{x:25,y:50},{x:25,y:20},{x:45,y:65},{x:45,y:35},{x:65,y:90},{x:65,y:65},{x:65,y:35},{x:65,y:10},{x:90,y:50} ],
    '2-3-5': [ {x:5,y:50},{x:20,y:70},{x:20,y:30},{x:40,y:80},{x:40,y:50},{x:40,y:20},{x:75,y:92},{x:75,y:70},{x:75,y:50},{x:75,y:30},{x:75,y:8} ],
    'WM (3-2-2-3)': [ {x:5,y:50},{x:25,y:80},{x:25,y:50},{x:25,y:20},{x:45,y:70},{x:45,y:30},{x:65,y:70},{x:65,y:30},{x:85,y:80},{x:85,y:50},{x:85,y:20} ],
    '2-3-2-3': [ {x:5,y:50},{x:20,y:70},{x:20,y:30},{x:40,y:80},{x:40,y:50},{x:40,y:20},{x:65,y:70},{x:65,y:30},{x:85,y:80},{x:85,y:50},{x:85,y:20} ],
    '4-2-4': [ {x:5,y:50},{x:25,y:85},{x:25,y:63},{x:25,y:37},{x:25,y:15},{x:50,y:65},{x:50,y:35},{x:85,y:90},{x:85,y:65},{x:85,y:35},{x:85,y:10} ],
};

// --- ============================================ ---
// --- UTILITY FUNCTIONS ---
// --- ============================================ ---

export const _ = {
    get: (obj, path, defaultValue) => {
        const keys = Array.isArray(path) ? path : path.split('.');
        let result = obj;
        for (const key of keys) {
            result = result?.[key];
            if (result === undefined) return defaultValue;
        }
        return result;
    },
    cloneDeep: (obj) => JSON.parse(JSON.stringify(obj))
};

export function areColorsSimilar(hex1, hex2, threshold = 100) {
    const hexToRgb = (hex) => {
        if (!hex) return null;
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
    };
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2) return false;
    const distance = Math.sqrt(Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2));
    return distance < threshold;
}

export function generateStartingLineup(allPlayers) {
    if (!allPlayers || allPlayers.length < 11) return (allPlayers || []).slice(0, 11);
    const lineup = [];
    const playersByPosition = { GK: [], DEF: [], MID: [], FWD: [] };
    allPlayers.forEach(p => {
        if (playersByPosition[p.position]) {
            playersByPosition[p.position].push(p);
        }
    });

    const formationPlan = { GK: 1, DEF: 4, MID: 3, FWD: 3 };
    for (const pos in formationPlan) {
        const playersForPos = playersByPosition[pos];
        const needed = formationPlan[pos];
        for (let i = 0; i < needed && playersForPos.length > 0; i++) {
            lineup.push(playersForPos.shift());
        }
    }
    if (lineup.length < 11) {
        const remainingPlayers = allPlayers.filter(p => !lineup.some(lp => lp.name === p.name));
        const spotsToFill = 11 - lineup.length;
        for(let i = 0; i < spotsToFill && remainingPlayers.length > 0; i++) {
            lineup.push(remainingPlayers.shift());
        }
    }
    return lineup.slice(0, 11);
}

export function findTeamStats(teamName) {
    const tournamentStats = _.get(APP_STATE, 'database.tournamentData.team_stats', {});
    const statsKeys = Object.keys(tournamentStats);
    const cleanTeamName = (teamName || '').toLowerCase().replace('afc', '').trim();
    const foundKey = statsKeys.find(key => {
        const cleanKey = key.toLowerCase().replace('afc', '').trim();
        return cleanKey.includes(cleanTeamName) || cleanTeamName.includes(cleanKey);
    });
    return foundKey ? tournamentStats[foundKey] : {};
}

// --- ============================================ ---
// --- FILE HANDLING & INITIALIZATION LOGIC ---
// --- ============================================ ---

export function readFileAsJson(file) {
    return new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                let text = event.target.result;
                text = text.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
                const firstBrace = text.indexOf('{'), firstBracket = text.indexOf('[');
                let startIndex = -1;
                if (firstBrace === -1 && firstBracket === -1) throw new Error("No se encontró ningún objeto o array JSON.");
                if (firstBrace === -1) startIndex = firstBracket;
                else if (firstBracket === -1) startIndex = firstBrace;
                else startIndex = Math.min(firstBrace, firstBracket);
                const lastBrace = text.lastIndexOf('}'), lastBracket = text.lastIndexOf(']');
                const endIndex = Math.max(lastBrace, lastBracket);
                if (startIndex === -1 || endIndex === -1) throw new Error(`Estructura JSON no válida en ${file.name}`);
                let jsonText = text.substring(startIndex, endIndex + 1);
                jsonText = jsonText.replace(/,\s*([\]}])/g, '$1');
                resolve(JSON.parse(jsonText));
            } catch (e) {
                reject(new Error(`Error al analizar ${file.name}: ${e.message}. Revisa la sintaxis.`));
            }
        };
        reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}`));
        reader.readAsText(file);
    });
}

// --- ============================================ ---
// --- ON-DEVICE AI INTEGRATION (NO API KEY) ---
// --- ============================================ ---

export let uploadedInjuryImagesHome = [];
export let uploadedInjuryImagesAway = [];
export let uploadedOddsImages = [];

/**
 * Llama a nuestro backend seguro que se comunica con la API de Gemini.
 * @param {object} payload - El objeto con el prompt para la IA.
 * @returns {Promise<object>} - La respuesta JSON parseada desde la IA.
 */
async function callAI(payload) {
    try {
        const prompt = payload.contents[0].parts[0].text;

        // **IMPORTANTE**: Reemplaza esto con la URL de tu backend una vez que lo despliegues (ej. en Vercel).
        // Si estás probando localmente, podría ser 'http://localhost:3000/api/get-gemini-analysis'
        const API_BACKEND_URL = 'URL_DE_TU_BACKEND/api/get-gemini-analysis';

        const response = await fetch(API_BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error desde el servidor: ${errorData.message || 'Error desconocido'}`);
        }

        // El backend ya devuelve el JSON listo para usar.
        return await response.json();

    } catch (error) {
        console.error("Error al llamar al backend para el análisis de IA:", error);
        throw new Error(`Falló la conexión con la IA: ${error.message}`);
    }
}

export async function detectInjuries(teamType) {
    return { success: false, message: "La detección de lesiones por imagen no está disponible en este modelo. Por favor, ingrésalas manualmente." };
}

export async function generateAndApplyAIPick(getHumanContext) {
    try {
        const homeTeamName = APP_STATE.currentMatch.home;
        const awayTeamName = APP_STATE.currentMatch.away;
        const contexto_humano = getHumanContext();
        const refereeName = contexto_humano.refereeName;
        const refereeStats = _.get(APP_STATE, `database.referees.${refereeName}`, {});

        const preAnalysis = {
            home_team_stats: findTeamStats(homeTeamName),
            away_team_stats: findTeamStats(awayTeamName),
            home_team_form: _.get(APP_STATE, `database.tournamentData.team_form.${homeTeamName}`, []),
            away_team_form: _.get(APP_STATE, `database.tournamentData.team_form.${awayTeamName}`, []),
            referee_analysis: { name: refereeName, ...refereeStats }
        };

        const classicContext = _.get(APP_STATE, 'database.classics', null);
        let classicPromptInjection = '';
        if (classicContext) {
            const classicMatch = Object.values(classicContext).find(c =>
                c.teams.includes(homeTeamName) && c.teams.includes(awayTeamName)
            );
            if (classicMatch) {
                classicPromptInjection = `**CONTEXTO DE CLÁSICO:** Este partido es el "${classicMatch.name}". **Reseña:** "${classicMatch.review}". **Instrucción Adicional:** Dale un peso significativo a la naturaleza de este clásico.`;
            }
        }

        const payload = { contents: [{ parts: [] }] };
        const isDeepAnalysis = (contexto_humano.analisis_experto.enfoque || '').toLowerCase().includes('profundo');
        let fundamentalCount = isDeepAnalysis ? 4 : 2;
        const fundamentalRule = `Genera EXACTAMENTE ${fundamentalCount} 'fundamentals'.`;
        const descRule = `Cada 'desc' debe ser conciso y directo, utilizando ESTRICTAMENTE entre 4 y 5 líneas de texto (aproximadamente 300-350 caracteres).`;

        const prompt = `**Actúa como Khipu-Pro, un analista deportivo de élite mundial. Tu análisis debe ser ultra profesional, combinando la frialdad de los datos con la intuición de un experto humano.**
**Misión Principal:** Generar el 'pick' de apuestas más lógico y con mayor valor. Tu razonamiento es clave; desglósalo en 'fundamentals'.
**Filosofía de Análisis:**
- **Más Allá de las Estadísticas:** Los datos estadísticos son una referencia, no una verdad absoluta. Prioriza el contexto humano (momento anímico, motivación, etc.) y los 'Apuntes del Analista'. Tu análisis debe reflejar cómo estos factores pueden anular o potenciar las tendencias estadísticas.
- **Análisis de Bajas (CRÍTICO):** Analiza la importancia real de cada baja: ¿son titulares, suplentes clave? ¿Cómo afecta su ausencia al sistema táctico y al rendimiento del equipo?
- **Contexto es Rey:** El clima, el estado del campo y la etapa del torneo son cruciales. Integra estos elementos para construir un escenario de partido realista.
**Entradas de Datos:**
${classicPromptInjection}
**Contexto Humano (Fuente Primaria):** ${JSON.stringify(contexto_humano)}
**Datos Estadísticos (Fuente de Apoyo):** ${JSON.stringify(preAnalysis)}
**Reglas Estrictas de Salida:**
1. El 'pick' debe ser un título corto y generalizado (ej: "Gana Local", "Más de 2.5 Goles").
2. ${fundamentalRule}
3. ${descRule}
4. La 'cuota' debe ser realista y el 'stake' (1-25) debe reflejar tu confianza real.
**Formato JSON Obligatorio (sin excepciones):**
{ "pick": "string", "odds": "string", "stake": "number", "fundamentals": [ { "title": "string", "desc": "string" } ] }`;

        payload.contents[0].parts.push({ text: prompt });

        const jsonResponse = await callAI(payload);

        saveState();
        APP_STATE.currentMatch.pick.market = jsonResponse.pick;
        APP_STATE.currentMatch.odds = jsonResponse.odds;
        APP_STATE.currentMatch.fundamentals = jsonResponse.fundamentals;
        const stakeValue = parseInt(jsonResponse.stake, 10);
        APP_STATE.currentMatch.verdict_score = stakeValue >= 25 ? 95 : stakeValue >= 20 ? 85 : stakeValue >= 15 ? 75 : stakeValue >= 10 ? 65 : 50;
        APP_STATE.currentMatch.referee = refereeName;
        APP_STATE.analysisGenerated = true;

        return { success: true, data: APP_STATE.currentMatch };
    } catch (error) {
        console.error("Error detallado al generar el análisis con IA:", error);
        return { success: false, message: `${error.message}` };
    }
}
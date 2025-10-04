// Configurable assets (replace these URLs with the provided logo/background when available)
const FALLBACK_BG = "images (4).jpeg";
const FALLBACK_LOGO = "images (4).jpeg";

// ⚠️ ADVERTENCIA DE SEGURIDAD: Esta clave está expuesta en el navegador.
// Úsala solo para pruebas y luego bórrala.
// DEBES REEMPLAZAR ESTA CLAVE PLACEHOLDER por tu clave API real de Gemini.
const GEMINI_API_KEY = "AIzaSyAgIKd-fSLUPedtj1Q8SObB3UNE-ksAjMQ"; 
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY;

// --- Configuración de Base de Conocimiento (Movida desde server.js) ---
// Normalmente, esta información vendría de un archivo local. 
// Para que funcione en el navegador, la pondremos aquí temporalmente:

const KNOWLEDGE_BASE_DATA = {
    institucion: {
        nombre_completo: "Centro de Bachillerato Tecnológico industrial y de servicios No. 55",
        direccion: "Carretera Tampico-Valles, Km. 70.8 Pánuco, Ver.",
        director_actual: "Ing. Jorge Ramírez Rangel"
    },
    carreras: {
        logistica: {
            nombre: "Técnico en Logística",
            enfoque: "Gestión y optimización de cadenas de suministro, transporte y almacenamiento.",
            competencias: ["Planifica rutas", "Controla inventarios", "Supervisa el transporte de mercancías"]
        },
        mantenimiento: {
            nombre: "Técnico en Mantenimiento de Equipo de Cómputo",
            enfoque: "Diagnóstico, reparación y configuración de hardware y software.",
            competencias: ["Instala redes LAN", "Ensambla equipos", "Mantiene sistemas operativos"]
        },
        programacion: {
            nombre: "Técnico en Programación",
            enfoque: "Desarrollo de aplicaciones web y móviles, y bases de datos.",
            competencias: ["Diseña bases de datos", "Desarrolla aplicaciones front-end", "Usa lenguajes modernos (Python, JavaScript)"]
        },
        contabilidad: {
            nombre: "Técnico en Contabilidad",
            enfoque: "Registro y análisis de operaciones financieras para la toma de decisiones.",
            competencias: ["Maneja nóminas", "Elabora estados financieros", "Calcula impuestos"]
        },
        recursos: {
            nombre: "Técnico en Ofimática",
            enfoque: "Uso avanzado de herramientas ofimáticas y gestión documental.",
            competencias: ["Gestiona bases de datos", "Crea documentos profesionales", "Organiza archivos digitales"]
        }
    },
    procesos_academicos: {
        costo_examen: "$600 pesos",
        horario_matutino: "7:00 a.m. a 1:20 p.m.",
        horario_vespertino: "2:00 p.m. a 8:20 p.m.",
        contacto_control_escolar: "Para cualquier trámite académico, te recomendamos acudir al departamento de Control Escolar del plantel."
    }
};

let formattedData = "--- DATOS OFICIALES DEL CBTIS NO. 55 – PÁNUCO, VERACRUZ ---\n\n";
    
// 1. Identidad Institucional
formattedData += "1. IDENTIDAD INSTITUCIONAL:\n";
for (const [key, value] of Object.entries(KNOWLEDGE_BASE_DATA.institucion)) {
    formattedData += `* ${key.replace(/_/g, ' ')}: ${value}\n`;
}

// 2. Oferta Educativa
formattedData += "\n2. OFERTA EDUCATIVA Y PERFILES DE EGRESO:\n";
for (const [key, carrera] of Object.entries(KNOWLEDGE_BASE_DATA.carreras)) {
    formattedData += `\n* ${carrera.nombre}:\n`;
    formattedData += `  - Enfoque: ${carrera.enfoque}\n`;
    formattedData += `  - Competencias Clave: ${carrera.competencias.join('; ')}\n`;
}

// 3. Procesos Académicos
formattedData += "\n3. PROCESOS ACADÉMICOS:\n";
for (const [key, value] of Object.entries(KNOWLEDGE_BASE_DATA.procesos_academicos)) {
    formattedData += `* ${key.replace(/_/g, ' ')}: ${value}\n`;
}

const KNOWLEDGE_BASE_TEXT = formattedData;


const SYSTEM_INSTRUCTION = `
    Eres un asesor de admisiones del CBTis 55. Responde en ESPAÑOL, breve, claro y profesional.
    Usa SOLO la siguiente información oficial:

    ${KNOWLEDGE_BASE_TEXT}

    --- INSTRUCCIONES ESPECÍFICAS ---
    1. COSTO: Responde "$600 pesos".
    2. HORARIOS: Da los horarios Matutino (7:00 a.m. a 1:20 p.m.) y Vespertino (2:00 p.m. a 8:20 p.m.).
    3. CARRERAS: Nombra las 5 especialidades y sus competencias si preguntan.
    4. CONSTANCIAS: Si te preguntan por constancias de estudio, DEBES responder EXACTAMENTE así (en HTML, una sola vez):

    Para solicitar tu constancia de estudio, puedes hacerlo en línea utilizando este formulario oficial:<br>
    <a href="https://script.google.com/macros/s/AKfycbymOHgg49X3jSXdTVYqmXpv1YELh9gUmgPEF8-0I5BCOlPe69Z6Nrd6tyvLizOUuQXt/exec" target="_blank" class="text-blue-600 underline">Solicitar Constancia Aquí</a><br><br>
    Para cualquier otro trámite académico, te recomendamos acudir al departamento de Control Escolar del plantel.

    No inventes información. No menciones JSON ni estructura interna.
`;


// safe element references (may be absent on oferta page)
const splash = document.getElementById('splash');
const site = document.getElementById('site');
const skipBtn = document.getElementById('skipSplash');
const splashLogo = document.getElementById('splashLogo');
const mainLogo = document.getElementById('mainLogo');
const menuToggle = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');

// CRM Widget with LLM
const crmTab = document.getElementById('crmTab');
const crmPanel = document.getElementById('crmPanel');
const crmClose = document.getElementById('crmClose');
const chatArea = document.getElementById('chatArea');
const chatForm = document.getElementById('chatForm');
const chatText = document.getElementById('chatText');

let conversationHistory = []; // Variable global para almacenar el historial de chat

function setAssets() {
    const bgEls = document.querySelectorAll('.splash-bg, .hero-bg');
    bgEls.forEach(el => el.style.backgroundImage = `url("${FALLBACK_BG}")`);
    if (FALLBACK_LOGO) {
        if (splashLogo) splashLogo.src = FALLBACK_LOGO;
        if (mainLogo) mainLogo.src = FALLBACK_LOGO;
    } else {
        if (splashLogo) splashLogo.style.display = 'none';
        if (mainLogo) mainLogo.style.display = 'none';
    }
}
setAssets();

// Splash control
let splashTimeout;
if (splash) {
    splashTimeout = setTimeout(exitSplash, 2600);
    skipBtn?.addEventListener('click', () => exitSplash(true));
    splash.addEventListener('click', (e) => {
        if (e.target.id !== 'skipSplash') {
            exitSplash(true);
        }
    });
}

function exitSplash(userInitiated = false) {
    if (!splash || splash.classList.contains('fade-out')) {
        if (site) site.classList.remove('hidden');
        return;
    }
    clearTimeout(splashTimeout);
    splash.classList.add('fade-out');
    setTimeout(() => {
        splash.style.display = 'none';
        if (site) site.classList.remove('hidden');
    }, 700);
}

// Mobile nav
menuToggle?.addEventListener('click', () => {
    if (!sideMenu) return;
    sideMenu.classList.toggle('open');
});

// Close side menu when clicking a link
document.querySelectorAll('.side-nav a[href^="#"]').forEach(a => {
    a.addEventListener('click', () => sideMenu.classList.remove('open'));
});

function openCRM() { if (crmPanel) { crmPanel.classList.add('open'); chatText?.focus(); } }
function closeCRM() { if (crmPanel) crmPanel.classList.remove('open'); }
if (crmTab) crmTab.addEventListener('click', openCRM);
if (crmClose) crmClose.addEventListener('click', closeCRM);

// Back to top button behaviour
const backBtn = document.getElementById('backToTop');
function checkScroll() {
    if (window.scrollY > window.innerHeight * 0.4) backBtn.classList.add('show');
    else backBtn.classList.remove('show');
}
backBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
window.addEventListener('scroll', checkScroll, { passive: true });
checkScroll();

// Helpers
function addMsg(text, who = 'bot') {
    if (!chatArea) return;
    const div = document.createElement('div');
    div.className = `msg ${who}`;
    div.innerHTML = text.replace(/\n/g, '<br>');
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Inicialización del saludo y el historial de conversación
const initialGreeting = 'Hola, soy tu asistente CBTis 55. ¿En qué puedo ayudarte?';
if (chatArea) {
    addMsg(initialGreeting);
    conversationHistory.push({ role: 'model', parts: [{ text: initialGreeting }] });
}


// --- Función principal de la llamada a la IA ---
async function callGeminiAPI(history) {
    // La API de Gemini requiere que la instrucción del sistema vaya separada de los contenidos (historial)
    const payload = {
        contents: history,
        systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        config: {
            // Este parámetro asegura que la respuesta sea más directa
            temperature: 0.5 
        }
    };

    // LOGGING AÑADIDO: Muestra la URL y la carga útil en la consola
    console.log("Intentando llamar a:", API_BASE_URL);
    console.log("Carga útil enviada (Payload):", payload);

    // Implementación de reintento con retroceso exponencial
    const maxRetries = 3;
    let lastError = null;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                // Si la respuesta no es 2xx, intentamos obtener más detalles del error
                const errorBody = await response.text();
                // Si la clave es inválida, la API regresa 400 y el cuerpo del error dice por qué
                throw new Error(`Error HTTP ${response.status}: ${errorBody}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!text) {
                throw new Error("Respuesta de IA vacía o incompleta.");
            }
            return text;

        } catch (err) {
            lastError = err;
            console.error(`Intento ${i + 1} fallido:`, err);
            if (i < maxRetries - 1) {
                // Espera exponencialmente: 1s, 2s, 4s
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // Lanza el último error si todos los intentos fallaron
    throw lastError; 
}


if (chatForm && chatText) {
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatText.value.trim();
        if (!text) return;

        addMsg(text, 'user');
        chatText.value = '';
        const t = text.toLowerCase();

        // Añadir el mensaje del usuario al historial INMEDIATAMENTE.
        conversationHistory.push({ role: 'user', parts: [{ text: text }] });
        // Limita el historial para no enviar demasiada data
        conversationHistory = conversationHistory.slice(-10);

        let isQuickReply = false;
        let quickReplyText = '';

        // --- Lógica de Respuestas Rápidas (Hardcodeadas) ---
        // 1. Respuesta directa para teléfono/número
        if (t.includes('tel') || t.includes('teléfono') || t.includes('telefono') || t.includes('número') || t.includes('numero')) {
            quickReplyText = 'Sí, aquí tienes nuestros números:<br>Admisiones: +52 55 1234 5678<br>Soporte: +52 55 8765 4321<br>También puedes escribir a contacto@cbtis55.edu.mx';
            isQuickReply = true;
        }

        // 2. Respuesta para saludos
        if (t.includes('hola') || t.includes('saludos') || t.includes('buenos días') || t.includes('qué tal') || t.includes('que tal')) {
            quickReplyText = '¡Hola! Me da gusto saludarte. ¿Tienes alguna pregunta sobre nuestras carreras, inscripciones o la integración de IA en nuestros programas?';
            isQuickReply = true;
        }

        if (isQuickReply) {
            addMsg(quickReplyText, 'bot');
            // Añadir la respuesta rápida del bot al historial para mantener el contexto
            conversationHistory.push({ role: 'model', parts: [{ text: quickReplyText.replace(/<br>/g, '\n') }] });
            return;
        }

        // --- Comunicación con la IA de Gemini (Standalone) ---

        // Feedback de carga (Escribiendo...)
        const loading = document.createElement('div');
        loading.className = 'msg bot';
        loading.textContent = 'Escribiendo...';
        chatArea.appendChild(loading);
        chatArea.scrollTop = chatArea.scrollHeight;

        try {
            // Llamar a la función que ahora hace la petición directa a la API
            const reply = await callGeminiAPI(conversationHistory);

            loading.remove();

            addMsg(reply, 'bot');

            // Añade la respuesta de la IA al historial
            conversationHistory.push({ role: 'model', parts: [{ text: reply.replace(/<br>/g, '\n') }] });

        } catch (err) {
            loading.remove();
            addMsg('Hubo un error al contactar al asistente IA. Por favor, verifica tu clave API y tu conexión.', 'bot');
            console.error("Error en la llamada a la API de Gemini:", err);
            // Si la llamada falla, eliminamos el último mensaje del usuario para que el contexto no se rompa en el siguiente intento.
            conversationHistory.pop();
        }
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
        const id = a.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (target) {
            e.preventDefault();
            // Desplazamiento ajustado para considerar el header fijo
            window.scrollTo({ top: target.offsetTop - 60, behavior: 'smooth' });
        }
    });
});

// Form dummy handler
document.querySelector('.contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    // Reemplaza el confirm() nativo con un modal simple si quieres evitar la advertencia
    const message = 'Gracias por contactarnos. Te responderemos pronto. Aceptar para continuar.';
    // Usamos una función simple para simular un modal que no bloquee el iframe
    if (confirm(message)) {
        // Si necesitas alguna acción tras confirmar, va aquí
    }
});

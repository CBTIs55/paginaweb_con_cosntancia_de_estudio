// Configurable assets (replace these URLs with the provided logo/background when available)
const FALLBACK_BG = "images (4).jpeg";
const FALLBACK_LOGO = "images (4).jpeg"; 

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
  // Se usa la variable FALLBACK_BG
  bgEls.forEach(el => el.style.backgroundImage = `url("${FALLBACK_BG}")`);
  if (FALLBACK_LOGO) {
    if (splashLogo) splashLogo.src = FALLBACK_LOGO;
    if (mainLogo) mainLogo.src = FALLBACK_LOGO;
  } else {
    // Hide if not provided yet
    if (splashLogo) splashLogo.style.display = 'none';
    if (mainLogo) mainLogo.style.display = 'none';
  }
}
setAssets();

// Splash control (only if splash exists on the page)
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

// Close side menu when clicking a link (smooth UX on mobile)
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
  // Permite saltos de línea en la respuesta del bot para formato
  div.innerHTML = text.replace(/\n/g, '<br>');
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// FIX 1: Inicialización del saludo y el historial de conversación
const initialGreeting = 'Hola, soy tu asistente CBTis 55. ¿En qué puedo ayudarte?';
if (chatArea) {
    addMsg(initialGreeting);
    // Es CRUCIAL añadir el saludo inicial al historial para que Gemini sepa el contexto
    conversationHistory.push({ role: 'model', parts: [{ text: initialGreeting }] });
}

if (chatForm && chatText) {
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatText.value.trim();
    if (!text) return;
    
    addMsg(text, 'user');
    chatText.value = '';
    const t = text.toLowerCase();
    
    // FIX 2: Añadir el mensaje del usuario al historial INMEDIATAMENTE.
    // Esto asegura que, ya sea una respuesta rápida o una llamada a la IA, el turno del usuario quede registrado.
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
        // FIX 3: Añadir la respuesta rápida del bot al historial para mantener el contexto
        conversationHistory.push({ role: 'model', parts: [{ text: quickReplyText.replace(/<br>/g, '\n') }] });
        return;
    }
    
    // --- Comunicación con la IA de Gemini (si no es una respuesta rápida) ---
    
    // Feedback de carga (Escribiendo...)
    const loading = document.createElement('div');
    loading.className = 'msg bot';
    loading.textContent = 'Escribiendo...';
    chatArea.appendChild(loading);
    chatArea.scrollTop = chatArea.scrollHeight;

    try {
      // POST al servidor Node.js (server.js) que está corriendo en localhost:3000
      const response = await fetch('http://localhost:3000/api/chat', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history: conversationHistory })
      });
      
      // Verifica si la respuesta es OK (código 200)
      if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      loading.remove();
      
      const reply = data.reply || 'No pude contactar a la IA. Intenta de nuevo.';
      addMsg(reply, 'bot');
      
      // Añade la respuesta de la IA al historial
      conversationHistory.push({ role: 'model', parts: [{ text: reply.replace(/<br>/g, '\n') }] }); 

    } catch (err) {
      loading.remove();
      addMsg('Hubo un error al procesar tu solicitud. Asegúrate de que el servidor Node.js esté funcionando y que estás accediendo a http://localhost:3000.', 'bot');
      console.error("Error en la conexión API:", err);
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
  // Se usa un mensaje de modal simple en lugar de alert()
  if (confirm('Gracias por contactarnos. Te responderemos pronto. Aceptar para continuar.')) {
    // Si necesitas alguna acción tras confirmar, va aquí
  }
});

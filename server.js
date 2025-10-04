const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// --- Carga de la Base de Conocimiento (knowledge_base.json) ---
let knowledgeBaseText = "Error: Base de conocimiento no cargada.";
try {
    const knowledgePath = path.join(__dirname, 'knowledge_base.json');
    const rawData = fs.readFileSync(knowledgePath, 'utf8');
    const knowledgeData = JSON.parse(rawData);

    let formattedData = "--- DATOS OFICIALES DEL CBTIS NO. 55 – PÁNUCO, VERACRUZ ---\n\n";
    
    // 1. Identidad Institucional
    formattedData += "1. IDENTIDAD INSTITUCIONAL:\n";
    for (const [key, value] of Object.entries(knowledgeData.institucion)) {
        formattedData += `* ${key.replace(/_/g, ' ')}: ${value}\n`;
    }
    
    // 2. Oferta Educativa
    formattedData += "\n2. OFERTA EDUCATIVA Y PERFILES DE EGRESO:\n";
    for (const [key, carrera] of Object.entries(knowledgeData.carreras)) {
        formattedData += `\n* ${carrera.nombre}:\n`;
        formattedData += `  - Enfoque: ${carrera.enfoque}\n`;
        formattedData += `  - Competencias Clave: ${carrera.competencias.join('; ')}\n`;
    }

    // 3. Procesos Académicos
    formattedData += "\n3. PROCESOS ACADÉMICOS:\n";
    for (const [key, value] of Object.entries(knowledgeData.procesos_academicos)) {
        formattedData += `* ${key.replace(/_/g, ' ')}: ${value}\n`;
    }

    knowledgeBaseText = formattedData;
    console.log("✅ Base de conocimiento cargada con éxito.");
} catch (error) {
    console.error("❌ ERROR al leer knowledge_base.json:", error.message);
}

// Middleware
app.use(express.json());
app.use(express.static(__dirname));
app.use((req, res, next) => {
    // Estas cabeceras CORS generalmente solo son necesarias si el frontend está en otro puerto/dominio.
    // Para localhost:3000 -> localhost:3000 no deberían ser necesarias, pero las mantenemos por seguridad.
    res.header("Access-Control-Allow-Origin", `http://localhost:${port}`);
    res.header("Access-Control-Allow-Methods", "POST");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});

// --- Inicialización de Gemini ---
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("Error: GEMINI_API_KEY no configurada en .env");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);

// Endpoint del chatbot
app.post('/api/chat', async (req, res) => {
    const { history } = req.body;

    const systemInstruction = `
        Eres un asesor de admisiones del CBTis 55. Responde en ESPAÑOL, breve, claro y profesional.
        Usa SOLO la siguiente información oficial:

        ${knowledgeBaseText}

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

    try {
        const model = genAI.getGenerativeModel({
            // SOLUCIÓN: Cambiar el nombre del modelo a uno que sea reconocido por la API v1beta
            model: "gemini-2.5-flash",
            systemInstruction: systemInstruction
        });

        // Asegurarse de que 'history' contiene un array de objetos con el formato correcto:
        // [{ role: "user", parts: [{ text: "..." }] }, { role: "model", parts: [{ text: "..." }] }, ...]
        const result = await model.generateContent({ contents: history });
        const response = result.response;
        const text = response.text();

        res.json({ reply: text });
    } catch (error) {
        console.error("Error con Gemini:", error.message);
        // Devolver un error más amigable al frontend
        res.status(500).json({ reply: "Hubo un error al procesar tu solicitud. El asistente IA tuvo un fallo interno." });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`\n-----------------------------------------------------`);
    console.log(`🤖 Servidor CBTis 55 iniciado.`);
    console.log(`🌐 Abre: http://localhost:${port}`);
    console.log(`-----------------------------------------------------\n`);
});

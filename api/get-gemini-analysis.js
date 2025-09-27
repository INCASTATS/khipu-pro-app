export default async function handler(req, res) {
    // Paso 1: Asegurarse de que la petición sea de tipo POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido. Solo se aceptan peticiones POST.' });
    }

    try {
        // Paso 2: Extraer el prompt que envió el frontend (logic.js)
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ message: 'No se recibió ningún prompt.' });
        }

        // Paso 3: Obtener tu clave de API secreta desde las variables de entorno de Vercel
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            console.error("La clave de API de Gemini no está configurada en las variables de entorno.");
            return res.status(500).json({ message: 'Error de configuración del servidor.' });
        }

        // Paso 4: Construir la URL y el cuerpo para la petición a la API de Gemini
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        };

        // Paso 5: Llamar a la API de Gemini
        const geminiResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        // Paso 6: Manejar una posible respuesta de error de Gemini
        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json();
            console.error("Error recibido de la API de Gemini:", JSON.stringify(errorData, null, 2));
            return res.status(geminiResponse.status).json({ message: `Error de la API de Gemini: ${errorData.error.message}` });
        }

        // Paso 7: Extraer, parsear y devolver la respuesta exitosa al frontend
        const data = await geminiResponse.json();
        const jsonText = data.candidates[0].content.parts[0].text;
        
        res.status(200).json(JSON.parse(jsonText));

    } catch (error) {
        console.error("Error en la función del backend:", error);
        res.status(500).json({ message: 'Error interno en el servidor al procesar la solicitud.' });
    }
}
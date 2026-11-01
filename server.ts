import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Natural Human Voice Speech Synthesis API
app.post('/api/tts', async (req, res) => {
  try {
    const { text, language = 'en', voiceName = 'Kore' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API is not configured on server. Falling back to client-side synthesis.',
      });
    }

    const languageContext =
      language === 'twi'
        ? 'Spoken Asante Twi language with authentic, warm West African Akan cadence and natural tonal pronunciation.'
        : language === 'fante'
        ? 'Spoken Fante language with authentic coastal Ghanaian Akan cadence and natural inflection.'
        : language === 'ewe'
        ? 'Spoken authentic Volta Ewe (Eʋegbe) dialect as naturally spoken in the Volta Region of Ghana. Use warm, natural human Ewe intonation, smooth tonal rhythm, and native pronunciation.'
        : language === 'ga'
        ? 'Spoken Ga language with natural Greater Accra rhythm and warm, friendly tone.'
        : language === 'dagbani'
        ? 'Spoken Dagbani (Dagbanli) Northern Ghanaian language with natural, fluent human pronunciation.'
        : language === 'hausa'
        ? 'Spoken authentic Ghanaian Hausa language with warm, natural cadence, clear pronunciation, and fluent rhythm.'
        : language === 'krachi'
        ? 'Spoken authentic Krachi (Kaakyi) language of the Oti Region (Dambai) of Ghana with natural North-Guang tonal cadence and warm pronunciation.'
        : language === 'buem'
        ? 'Spoken authentic Buem (Lelemi) language of the Oti Region (Jasikan/Bodada) of Ghana with natural tonal cadence and warm pronunciation.'
        : 'Warm, clear, natural Ghanaian English financial assistant tone.';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
              speechMetadata: {
                style: `Warm, natural, melodic, conversational human voice. ${languageContext} Avoid mechanical or robotic tones.`,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned from Gemini TTS' });
    }

    res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    console.error('Gemini TTS error:', err);
    res.status(500).json({
      error: err?.message || 'Failed to synthesize natural speech',
    });
  }
});

// Fastest Gemini Flash fallback for complex or unusual utterances (max 50 tokens, 0.0 temperature)
app.post('/api/fast-intent', async (req, res) => {
  try {
    const { text, context } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    if (!ai) return res.status(503).json({ error: 'Gemini not configured on server', intent: 'UNKNOWN' });

    const prompt = `Classify MTN MoMo voice input: "${text}".
Return strict JSON: {"intent": "TRANSFER"|"AIRTIME"|"BILL"|"CASHOUT"|"BALANCE"|"YES"|"NO"|"CANCEL"|"REPEAT"|"SLOWER"|"FINGERPRINT"|"FACE"|"UNKNOWN", "amount": number|null, "recipient": string|null, "phone": string|null}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 60,
        temperature: 0.0,
        responseMimeType: 'application/json',
      },
    });

    const parsedJson = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (parsedJson) {
      res.json(JSON.parse(parsedJson));
    } else {
      res.json({ intent: 'UNKNOWN' });
    }
  } catch (err: any) {
    res.json({ intent: 'UNKNOWN' });
  }
});

async function startServer() {
  // Mount Vite middlewares in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MTN MoMo Voice System server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

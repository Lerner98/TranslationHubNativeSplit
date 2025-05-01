const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
const db = require('./database');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer'); // For handling file uploads


dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const port = 3000;
const JWT_SECRET = process.env.SESSION_SECRET || 'K9mP2qL8j5vX4rY7n6zB3wT';
const SESSION_EXPIRATION = 24 * 60 * 60; // 24 hours in seconds

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Initialize OpenAI client (for text-to-speech, vision, and speech-to-text)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));

// Middleware to handle _method query parameter
app.use((req, res, next) => {
  if (req.method === 'POST' && req.query._method) {
    console.log(`Overriding method from POST to ${req.query._method}`);
    req.method = req.query._method.toUpperCase();
  }
  next();
});

// Middleware to verify JWT token (for protected routes)
const authenticateToken = async (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return { error: 'Authentication token is required', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const session = await db.validateSession(token);
    if (!session) {
      console.log('Session validation failed in authenticateToken:', { token, decoded });
      return { error: 'Invalid or expired session', status: 403 };
    }
    return { user: decoded };
  } catch (err) {
    console.error('Token verification failed in authenticateToken:', err.message, { token });
    return { error: 'Invalid token', status: 403 };
  }
};

// Middleware to optionally authenticate (allows guest users)
const optionalAuthenticateToken = async (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return { user: null }; // No token, proceed as guest
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const session = await db.validateSession(token);
    if (!session) {
      console.log('Session validation failed in optionalAuthenticateToken:', { token, decoded });
      return { error: 'Invalid or expired session', status: 403 };
    }
    return { user: decoded };
  } catch (err) {
    console.error('Token verification failed in optionalAuthenticateToken:', err.message, { token });
    return { error: 'Invalid token', status: 403 };
  }
};

// Function to search supported languages
const searchLanguages = async (query) => {
  const supportedLanguages = [
    { code: 'af', name: 'Afrikaans' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hy', name: 'Armenian' },
    { code: 'az', name: 'Azerbaijani' },
    { code: 'be', name: 'Belarusian' },
    { code: 'bs', name: 'Bosnian' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'ca', name: 'Catalan' },
    { code: 'zh', name: 'Chinese' },
    { code: 'hr', name: 'Croatian' },
    { code: 'cs', name: 'Czech' },
    { code: 'da', name: 'Danish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'en', name: 'English' },
    { code: 'et', name: 'Estonian' },
    { code: 'fi', name: 'Finnish' },
    { code: 'fr', name: 'French' },
    { code: 'gl', name: 'Galician' },
    { code: 'de', name: 'German' },
    { code: 'el', name: 'Greek' },
    { code: 'he', name: 'Hebrew' },
    { code: 'hi', name: 'Hindi' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'is', name: 'Icelandic' },
    { code: 'id', name: 'Indonesian' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'kn', name: 'Kannada' },
    { code: 'kk', name: 'Kazakh' },
    { code: 'ko', name: 'Korean' },
    { code: 'lv', name: 'Latvian' },
    { code: 'lt', name: 'Lithuanian' },
    { code: 'mk', name: 'Macedonian' },
    { code: 'ms', name: 'Malay' },
    { code: 'mr', name: 'Marathi' },
    { code: 'mi', name: 'Maori' },
    { code: 'ne', name: 'Nepali' },
    { code: 'no', name: 'Norwegian' },
    { code: 'fa', name: 'Persian' },
    { code: 'pl', name: 'Polish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ro', name: 'Romanian' },
    { code: 'ru', name: 'Russian' },
    { code: 'sr', name: 'Serbian' },
    { code: 'sk', name: 'Slovak' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'es', name: 'Spanish' },
    { code: 'sw', name: 'Swahili' },
    { code: 'sv', name: 'Swedish' },
    { code: 'tl', name: 'Tagalog' },
    { code: 'ta', name: 'Tamil' },
    { code: 'th', name: 'Thai' },
    { code: 'tr', name: 'Turkish' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'ur', name: 'Urdu' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'cy', name: 'Welsh' },
  ];

  const filteredLanguages = supportedLanguages.filter((lang) =>
    lang.name.toLowerCase().includes(query.toLowerCase()) ||
    lang.code.toLowerCase().includes(query.toLowerCase())
  );
  return filteredLanguages;
};

// User Registration (no token required)
app.post('/register', async (req, res) => {
  console.log('POST /register called with body:', req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.createUser(email, hashedPassword);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Register error:', err);
    res.status(400).json({ error: err.message || 'Failed to register user' });
  }
});

// User Login (no token required)
app.post('/login', async (req, res) => {
  console.log('POST /login called with body:', req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.UserId, email: user.email }, JWT_SECRET, { expiresIn: SESSION_EXPIRATION });
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRATION * 1000); // 24 hours from now
    await db.createSession(user.UserId, sessionId, expiresAt, token);

    res.json({
      success: true,
      user: {
        id: user.UserId,
        email: user.email,
        defaultFromLang: user.default_from_lang,
        defaultToLang: user.default_to_lang,
        signed_session_id: token,
      },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(400).json({ error: err.message || 'Failed to login' });
  }
});

// Validate Session
app.get('/validate-session', async (req, res) => {
  console.log('GET /validate-session called');
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }
  res.json({ success: true, user: authResult.user });
});

// Logout
app.post('/logout', async (req, res) => {
  console.log('POST /logout called');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication token is required' });
  }

  try {
    const session = await db.validateSession(token);
    if (!session) {
      console.log('Session already invalid or expired, logging out successfully:', token);
      return res.json({ success: true });
    }

    await db.logout(token);
    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: err.message || 'Failed to logout' });
  }
});

// Update User Preferences
app.post('/preferences', async (req, res) => {
  console.log('POST /preferences called with body:', req.body);
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { defaultFromLang, defaultToLang } = req.body;
  const userId = authResult.user.id;

  try {
    await db.updateUserPreferences(userId, defaultFromLang, defaultToLang);
    res.json({ success: true });
  } catch (err) {
    console.error('Update preferences error:', err);
    res.status(500).json({ error: err.message || 'Failed to update preferences' });
  }
});

// Translate Text (allow guest users, optional token)
app.post('/translate', async (req, res) => {
  console.log('POST /translate called with body:', req.body);
  const authResult = await optionalAuthenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { text, targetLang, sourceLang = 'auto' } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Text and target language are required. Please try again.' });
  }

  try {
    let detectedLang = sourceLang;

    // Step 1: Detect the language of the input text
    if (sourceLang === 'auto') {
      const detectResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a language detection expert. Detect the primary language of the following text and return only the language code (e.g., "en" for English, "he" for Hebrew). If the text contains multiple languages, focus on the most prominent language. If the text is a proper noun (e.g., a brand name like "Lenovo"), ambiguous, or empty, return "unknown" instead of guessing. Do not provide any explanations.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
      });

      detectedLang = detectResponse.choices[0].message.content.trim();
      console.log('Detected language:', detectedLang, 'for text:', text);

      // If the detected language is "unknown", assume a default source language (English)
      if (detectedLang === 'unknown') {
        detectedLang = 'en';
        console.log('Assuming default source language (en) for undetectable text:', detectedLang, 'for text:', text);
      }
    } else {
      detectedLang = sourceLang;
      console.log('Using user-provided source language:', detectedLang, 'for text:', text);
    }

    // Step 2: If the detected language is the same as the target language, return the original text
    if (detectedLang === targetLang) {
      console.log('Detected language matches target language, returning original text:', text);
      return res.json({ translatedText: text, detectedLang });
    }

    // Step 3: Attempt to translate the text
    const translationResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the user's message from ${detectedLang} to ${targetLang}. If the text is a proper noun (e.g., a brand name like "Lenovo") or cannot be translated into a meaningful word in the target language, transliterate the text into the script of ${targetLang} without translating the meaning (e.g., "Lenovo" in English to "לנובו" in Hebrew). Respond only with the translated or transliterated text, without any explanation or context.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
    });

    const translatedText = translationResponse.choices[0].message.content.trim();
    console.log('Translation result:', translatedText, 'from', detectedLang, 'to', targetLang);

    res.json({ translatedText, detectedLang });
  } catch (err) {
    console.error('Translation error:', err, 'for text:', text);
    res.status(500).json({ error: 'Failed to translate the text. Please ensure the text is translatable and try again.' });
  }
});

// Recognize Text from Image (Vision) (requires token)
app.post('/recognize-text', async (req, res) => {
  console.log('POST /recognize-text called with body:', req.body);
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Image data is required. Please try again.' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Extract only the text from this image, ignoring any non-text elements such as logos, icons, or graphics. Return only the exact text found in the image, without any additional descriptions, explanations, or context. If no text is found, return an empty string (""). Do not include phrases like "The text in the image is".',
        },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
    });

    let extractedText = response.choices[0].message.content.trim();

    // Post-process to remove any unwanted descriptive text (e.g., if the model still returns "The text in the image is 'Lenovo'")
    const match = extractedText.match(/(?:The text[^']*')(.+?)'/);
    if (match && match[1]) {
      extractedText = match[1];
    }

    console.log('Extracted text from image:', extractedText);

    res.json({ text: extractedText });
  } catch (err) {
    console.error('Text recognition error:', err);
    res.status(500).json({ error: 'Failed to recognize text from image. Please ensure the image contains readable text and try again.' });
  }
});

// Speech-to-Text (requires token) - Using Open AI Whisper API
app.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  console.log('🔥 THIS IS THE REAL NODE SERVER HANDLING /speech-to-text');
  console.log('POST /speech-to-text via Whisper');
  console.log('File Info Received from Client:', req.file);

    // ✅ הדפסת מידע חשוב מהקובץ שהגיע
    console.log('🧪 Incoming file details:');
    console.log('File object:', req.file);
    console.log('MIME type:', req.file?.mimetype);
    console.log('Original name:', req.file?.originalname);
    console.log('Stored path:', req.file?.path);
    const authResult = await authenticateToken(req);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

  const { sourceLang } = req.body;
  if (!req.file) {
    console.error('❌ No audio file received');
    return res.status(400).json({ error: 'Audio file is required' });
  }
  
  // ✅ Debug נוסף לבדיקה שהקובץ תקין
  if (!req.file.path || !fs.existsSync(req.file.path)) {
    console.error('❌ Uploaded file path is invalid or does not exist:', req.file.path);
    return res.status(400).json({ error: 'Uploaded file is invalid or missing' });
  }
  
  if (!req.file.mimetype || !req.file.mimetype.startsWith('audio/')) {
    console.error('❌ Invalid MIME type:', req.file.mimetype);
    return res.status(400).json({ error: 'Uploaded file is not a valid audio format' });
  }
  

  try {
    const originalPath = req.file.path;
    const ext = path.extname(req.file.originalname) || '.m4a';
    const tempPath = `${originalPath}${ext}`;
    
    fs.renameSync(originalPath, tempPath); // מוסיף סיומת לקובץ
    
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: 'whisper-1',
      language: sourceLang,
    });
  
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath); // מחיקה בטוחה לאחר השימוש
    }
  
    const transcription = response.text;
    console.log('Transcribed text:', transcription);
  
    res.json({ text: transcription || '' });
  
  } catch (err) {
    console.error('Whisper speech-to-text error:', err);
    res.status(500).json({ error: err.message || 'Failed to transcribe speech' });
  }  
});

// Text-to-Speech (requires token)
app.post('/text-to-speech', async (req, res) => {
  console.log('POST /text-to-speech called with body:', req.body);
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { text, language } = req.body;
  if (!text || !language) {
    return res.status(400).json({ error: 'Text and language are required' });
  }

  try {
    const speechFilePath = path.join(__dirname, `speech-${uuidv4()}.mp3`);
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(speechFilePath, buffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename=speech.mp3');
    res.sendFile(speechFilePath, (err) => {
      if (err) {
        console.error('Error sending audio file:', err);
      }
      fs.unlinkSync(speechFilePath);
    });
  } catch (err) {
    console.error('Text-to-speech error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate speech' });
  }
});

// Recognize ASL (Vision) (requires token)
app.post('/recognize-asl', async (req, res) => {
  console.log('POST /recognize-asl called with body:', req.body);
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Interpret the American Sign Language (ASL) gesture in this image and provide the corresponding English word or phrase.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
    });

    const recognizedText = response.choices[0].message.content;
    res.json({ text: recognizedText });
  } catch (err) {
    console.error('ASL recognition error:', err);
    res.status(500).json({ error: err.message || 'Failed to recognize ASL gesture. Note: Vision models may struggle with spatial reasoning required for accurate ASL interpretation.' });
  }
});

// Extract Text from File (e.g., PDF, DOCX, TXT) (requires token)
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

app.post('/extract-text', async (req, res) => {
  console.log('POST /extract-text called with body:', req.body);
  const authResult = await authenticateToken(req);
  if (authResult?.error) {
    return res.status(authResult.status).json({
      error: 'Login required to translate files.',
      code: 'AUTH_REQUIRED'
    });
  }
  

  const { uri } = req.body;
  if (!uri) {
    return res.status(400).json({ error: 'File URI is required' });
  }

  try {
    const buffer = Buffer.from(uri, 'base64');
    const extension = detectFileExtensionFromBase64(uri);

    if (extension === 'pdf') {
      const textData = await pdfParse(buffer);
      return res.json({ text: textData.text });
    }

    if (extension === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      return res.json({ text: result.value });
    }

    if (extension === 'txt') {
      return res.json({ text: buffer.toString('utf-8') });
    }

    return res.status(400).json({ error: 'Unsupported file type. Only .pdf, .docx, or .txt are supported.' });
  } catch (err) {
    console.error('File extraction error:', err);
    return res.status(500).json({ error: 'Failed to extract text from file' });
  }
});

// Helper function to detect file type from base64 prefix
function detectFileExtensionFromBase64(base64String) {
  const prefix = base64String.slice(0, 50); // ניתוח רק ההתחלה
  if (prefix.includes('application/pdf')) return 'pdf';
  if (prefix.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) return 'docx';
  if (prefix.includes('application/msword')) return 'docx';
  if (prefix.includes('text/plain')) return 'txt';
  if (prefix.includes('UEsDB')) return 'docx'; // קבצי DOCX מתחילים ככה (ZIP)
  if (prefix.startsWith('%PDF')) return 'pdf'; // PDF ב-ASCII
  return '';
}



// Generate Word Document (requires token)
app.post('/generate-docx', async (req, res) => {
  console.log('POST /generate-docx called with body:', req.body);

  const authResult = await optionalAuthenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: text,
                  size: 24,
                }),
              ],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=translated.docx');
    res.send(buffer);
  } catch (err) {
    console.error('Document generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate document' });
  }
});


// Save Text Translation (requires token)
app.post('/translations/text', async (req, res) => {
  console.log('POST /translations/text called with body:', req.body);
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { fromLang, toLang, original_text, translated_text, type } = req.body;
  const userId = authResult.user.id;

  try {
    // The spSaveTextTranslation stored procedure already handles updating LanguageStatistics
    await db.saveTextTranslation(userId, fromLang, toLang, original_text, translated_text, type);
    res.json({ success: true });
  } catch (err) {
    console.error('Save text translation error:', err);
    res.status(500).json({ error: err.message || 'Failed to save text translation' });
  }
});

// Get Text Translations (requires token)
app.get('/translations/text', async (req, res) => {
  console.log('GET /translations/text called');
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.id;

  try {
    const translations = await db.getTextTranslations(userId);
    res.json(translations);
  } catch (err) {
    console.error('Fetch text translations error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch text translations' });
  }
});

// Save Voice Translation (requires token)
app.post('/translations/voice', async (req, res) => {
  console.log('POST /translations/voice called with body:', req.body);
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { fromLang, toLang, original_text, translated_text, type } = req.body;
  const userId = authResult.user.id;

  try {
    // The spSaveVoiceTranslation stored procedure already handles updating LanguageStatistics
    await db.saveVoiceTranslation(userId, fromLang, toLang, original_text, translated_text, type);
    res.json({ success: true });
  } catch (err) {
    console.error('Save voice translation error:', err);
    res.status(500).json({ error: err.message || 'Failed to save voice translation' });
  }
});

// Get Voice Translations (requires token)
app.get('/translations/voice', async (req, res) => {
  console.log('GET /translations/voice called');
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.id;

  try {
    const translations = await db.getVoiceTranslations(userId);
    res.json(translations);
  } catch (err) {
    console.error('Fetch voice translations error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch voice translations' });
  }
});

// Delete Specific Translation (requires token)
app.delete('/translations/delete/:id', async (req, res) => {
  console.log('DELETE /translations/delete/:id called with id:', req.params.id);
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    console.log('Authentication failed:', authResult.error);
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.id;
  const { id } = req.params;

  try {
    await db.deleteTranslation(userId, id);
    console.log('Successfully deleted translation with id:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete translation error:', err);
    res.status(500).json({ error: err.message || 'Failed to delete translation' });
  }
});

// Alternative endpoint for deletion using POST
app.post('/translations/delete/:id', async (req, res) => {
  console.log('POST /translations/delete/:id called with id:', req.params.id);
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    console.log('Authentication failed:', authResult.error);
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.id;
  const { id } = req.params;

  try {
    await db.deleteTranslation(userId, id);
    console.log('Successfully deleted translation with id (via POST):', id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete translation error (via POST):', err);
    res.status(500).json({ error: err.message || 'Failed to delete translation' });
  }
});

// Clear Translations (Text and Voice) (requires token)
app.delete('/translations', async (req, res) => {
  console.log('DELETE /translations called');
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.id;

  try {
    await db.clearTranslations(userId);
    res.json({ success: true });
  } catch (err) {
    console.error('Clear translations error:', err);
    res.status(500).json({ error: err.message || 'Failed to clear translations' });
  }
});

// Get Language Statistics (requires token)
app.get('/statistics', async (req, res) => {
  console.log('GET /statistics called');
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.id;

  try {
    const stats = await db.getLanguageStatistics(userId);
    res.json(stats);
  } catch (err) {
    console.error('Fetch language statistics error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch language statistics' });
  }
});

// Get Audit Logs (requires token)
app.get('/audit-logs', async (req, res) => {
  console.log('GET /audit-logs called');
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.id;

  try {
    const logs = await db.getAuditLogs(userId);
    res.json(logs);
  } catch (err) {
    console.error('Fetch audit logs error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch audit logs' });
  }
});

// Search Languages (no token required)
app.get('/languages', async (req, res) => {
  console.log('GET /languages called with query:', req.query);
  const { query } = req.query;
  // Check if the query parameter exists (even if empty)
  if (query === undefined) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const result = await searchLanguages(query);
    res.json(result);
  } catch (err) {
    console.error('Language search error:', err);
    res.status(500).json({ error: err.message || 'Failed to search languages' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
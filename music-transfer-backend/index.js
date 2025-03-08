require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado a MongoDB Atlas');
}).catch(err => {
    console.error('Error al conectar a MongoDB:', err);
});

// Modelo de Token
const tokenSchema = new mongoose.Schema({
    platform: String, // 'spotify' o 'youtube'
    accessToken: String,
    refreshToken: String,
    userId: String,
    createdAt: { type: Date, default: Date.now }
});
const Token = mongoose.model('Token', tokenSchema);

// Autenticación de Spotify
app.get('/api/spotify-auth', (req, res) => {
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${process.env.SPOTIFY_CLIENT_ID}&scope=user-library-read%20playlist-read-private&redirect_uri=${encodeURIComponent(process.env.SPOTIFY_REDIRECT_URI)}`;
    res.redirect(authUrl);
});

// Callback de Spotify
app.get('/api/spotify-token', async (req, res) => {
    const { code } = req.query;
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', null, {
            params: {
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
                client_id: process.env.SPOTIFY_CLIENT_ID,
                client_secret: process.env.SPOTIFY_CLIENT_SECRET
            },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error en autenticación de Spotify:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error en autenticación de Spotify' });
    }
});

// Guardar token en MongoDB
app.post('/api/save-token', async (req, res) => {
    const { platform, accessToken, refreshToken, userId } = req.body;
    try {
        const newToken = new Token({ platform, accessToken, refreshToken, userId });
        await newToken.save();
        res.json({ message: 'Token guardado exitosamente' });
    } catch (error) {
        console.error('Error al guardar token:', error);
        res.status(500).json({ error: 'Error al guardar token' });
    }
});

// Obtener token desde MongoDB
app.get('/api/get-token/:userId/:platform', async (req, res) => {
    const { userId, platform } = req.params;
    try {
        const token = await Token.findOne({ userId, platform });
        if (!token) {
            return res.status(404).json({ error: 'Token no encontrado' });
        }
        res.json(token);
    } catch (error) {
        console.error('Error al obtener token:', error);
        res.status(500).json({ error: 'Error al obtener token' });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
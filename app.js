// Configuración de Spotify
const SPOTIFY_CLIENT_ID = 'TU_SPOTIFY_CLIENT_ID';
const SPOTIFY_REDIRECT_URI = 'http://localhost:8080/callback.html';
const SPOTIFY_SCOPES = [
    'user-library-read',
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private'
].join(' ');

// Configuración de YouTube Music
const YOUTUBE_CLIENT_ID = 'TU_YOUTUBE_CLIENT_ID';
const YOUTUBE_CLIENT_SECRET = 'TU_YOUTUBE_CLIENT_SECRET';
const YOUTUBE_REDIRECT_URI = 'http://localhost:8080/callback.html';

// Botones de autenticación
document.getElementById('login-spotify').addEventListener('click', () => {
    const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}`;
    window.location.href = authUrl;
});

document.getElementById('login-youtube').addEventListener('click', () => {
    const authUrl = `https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=${YOUTUBE_CLIENT_ID}&scope=https://www.googleapis.com/auth/youtube&redirect_uri=${encodeURIComponent(YOUTUBE_REDIRECT_URI)}&access_type=offline&prompt=consent`;
    window.location.href = authUrl;
});

// Verificar autenticación al cargar la página
window.onload = () => {
    const spotifyToken = localStorage.getItem('spotify_token');
    const youtubeToken = localStorage.getItem('youtube_token');
    const authStatus = document.getElementById('auth-status');

    if (spotifyToken && youtubeToken) {
        authStatus.textContent = 'Autenticado con Spotify y YouTube Music.';
        loadSpotifyPlaylists();
    } else if (spotifyToken) {
        authStatus.textContent = 'Autenticado con Spotify.';
        loadSpotifyPlaylists();
    } else if (youtubeToken) {
        authStatus.textContent = 'Autenticado con YouTube Music.';
    } else {
        authStatus.textContent = 'No has iniciado sesión.';
    }
};

// Cargar playlists de Spotify
async function loadSpotifyPlaylists() {
    const spotifyToken = localStorage.getItem('spotify_token');
    if (!spotifyToken) return;

    try {
        const response = await fetch('https://api.spotify.com/v1/me/playlists', {
            headers: { Authorization: `Bearer ${spotifyToken}` }
        });
        const data = await response.json();
        displayPlaylists(data.items);
    } catch (error) {
        console.error('Error:', error);
        alert('Ocurrió un error al cargar las playlists.');
    }
}

// Mostrar playlists en la interfaz
function displayPlaylists(playlists) {
    const container = document.getElementById('playlists-container');
    container.innerHTML = '<h3>Tus Playlists de Spotify</h3>';
    
    playlists.forEach(playlist => {
        const button = document.createElement('button');
        button.textContent = `Transferir: ${playlist.name}`;
        button.addEventListener('click', () => transferPlaylist(playlist));
        container.appendChild(button);
    });
}

// Transferir una playlist a YouTube Music
async function transferPlaylist(playlist) {
    const spotifyToken = localStorage.getItem('spotify_token');
    if (!spotifyToken) {
        alert('Debes iniciar sesión con Spotify.');
        return;
    }

    // Obtener tracks de la playlist
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
        headers: { Authorization: `Bearer ${spotifyToken}` }
    });
    const data = await response.json();
    const tracks = data.items.map(item => ({
        name: item.track.name,
        artist: item.track.artists[0].name
    }));

    // Crear playlist en YouTube Music
    createYouTubePlaylist(playlist.name, playlist.description, tracks);
}

// Crear playlist en YouTube Music
async function createYouTubePlaylist(name, description, tracks) {
    const youtubeToken = localStorage.getItem('youtube_token');
    if (!youtubeToken) {
        alert('Debes iniciar sesión con YouTube Music.');
        return;
    }

    try {
        // Crear playlist
        const response = await fetch('https://www.googleapis.com/youtube/v3/playlists', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${youtubeToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                snippet: { title: name, description },
                status: { privacyStatus: 'private' }
            })
        });
        const data = await response.json();
        const playlistId = data.id;

        // Añadir tracks
        const total = tracks.length;
        let processed = 0;
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        progressBar.max = total;
        document.getElementById('progress-container').style.display = 'block';

        for (const track of tracks) {
            const videoId = await searchYouTubeTrack(track.name, track.artist);
            if (videoId) {
                await addVideoToPlaylist(playlistId, videoId, youtubeToken);
            }
            processed++;
            progressBar.value = processed;
            progressText.textContent = `Procesando ${processed}/${total}`;
        }

        alert(`Playlist "${name}" transferida exitosamente.`);
    } catch (error) {
        console.error('Error:', error);
        alert('Ocurrió un error al transferir la playlist.');
    }
}

// Buscar canción en YouTube
async function searchYouTubeTrack(trackName, artist) {
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(`${trackName} ${artist}`)}&type=video&key=AIzaSyBcQ8r0h0V5Y4Vz2v2Z0q3w5X0w2w2w2w2`);
        const data = await response.json();
        return data.items[0]?.id?.videoId || null;
    } catch (error) {
        console.error('Error al buscar la canción:', error);
        return null;
    }
}

// Añadir video a playlist de YouTube
async function addVideoToPlaylist(playlistId, videoId, token) {
    await fetch('https://www.googleapis.com/youtube/v3/playlistItems', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            snippet: {
                playlistId: playlistId,
                resourceId: {
                    kind: 'youtube#video',
                    videoId: videoId
                }
            }
        })
    });
}
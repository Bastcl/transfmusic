document.addEventListener("DOMContentLoaded", () => {
  const authStatus = document.getElementById("auth-status");
  authStatus.textContent =
    "Bienvenido a TransfMusic. Inicia sesión para continuar.";
});

// Configuración de Spotify
const SPOTIFY_CLIENT_ID = "TU_SPOTIFY_CLIENT_ID";
const SPOTIFY_REDIRECT_URI =
  "https://bastcl.github.io/transfmusic/callback.html";
const SPOTIFY_SCOPES = [
  "user-library-read",
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
].join(" ");

// Botón de Spotify
document.getElementById("login-spotify").addEventListener("click", () => {
  const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(
    SPOTIFY_SCOPES
  )}&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}`;
  window.location.href = authUrl;
});

// Verificar si ya estamos autenticados con Spotify
window.onload = () => {
  const spotifyToken = localStorage.getItem("spotify_token");
  if (spotifyToken) {
    document.getElementById("auth-status").textContent =
      "Autenticado con Spotify.";
  }
};

// Configuración de YouTube Music
const YOUTUBE_CLIENT_ID = "TU_YOUTUBE_CLIENT_ID";
const YOUTUBE_REDIRECT_URI =
  "https://bastcl.github.io/transfmusic/callback.html";

// Botón de YouTube Music
document.getElementById("login-youtube").addEventListener("click", () => {
  const authUrl = `https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=${YOUTUBE_CLIENT_ID}&scope=https://www.googleapis.com/auth/youtube&redirect_uri=${encodeURIComponent(
    YOUTUBE_REDIRECT_URI
  )}&access_type=offline&prompt=consent`;
  window.location.href = authUrl;
});

// Mostrar estado de autenticación
window.onload = () => {
  const spotifyToken = localStorage.getItem("spotify_token");
  const youtubeToken = localStorage.getItem("youtube_token");
  const authStatus = document.getElementById("auth-status");

  if (spotifyToken && youtubeToken) {
    authStatus.textContent = "Autenticado con Spotify y YouTube Music.";
  } else if (spotifyToken) {
    authStatus.textContent = "Autenticado con Spotify.";
  } else if (youtubeToken) {
    authStatus.textContent = "Autenticado con YouTube Music.";
  } else {
    authStatus.textContent = "No has iniciado sesión.";
  }
};

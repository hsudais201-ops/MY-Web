(() => {
  const KEY = "cineflix-tmdb-read-token-v1";
  const API = "https://api.themoviedb.org/3";
  const IMG = "https://image.tmdb.org/t/p/w500";
  const $ = id => document.getElementById(id);
  const section = $("tmdbSection");
  if (!section) return;
  const style = document.createElement("style");
  style.textContent = "#tmdbMovies .tmdb-card{min-width:0;background:#181818;border-radius:6px;overflow:hidden}#tmdbMovies .tmdb-card img{display:block;width:100%;aspect-ratio:2/3;object-fit:cover;background:#252525}#tmdbMovies .tmdb-info{padding:10px}#tmdbMovies .tmdb-title{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#tmdbMovies .tmdb-meta{font-size:11px;color:#aaa;margin-top:6px}#tmdbMovies .tmdb-overview{font-size:11px;line-height:1.5;color:#bbb;margin-top:8px;max-height:4.5em;overflow:hidden}";
  document.head.appendChild(style);
  const token = () => localStorage.getItem(KEY) || "";
  function status(message) { $("tmdbStatus").textContent = message; }
  function card(m) {
    const poster = m.poster_path ? IMG + m.poster_path : "";
    const title = m.title || m.name || "Untitled";
    const year = (m.release_date || m.first_air_date || "").slice(0,4);
    const image = poster ? '<img loading="lazy" src="' + poster + '" alt="Poster for ' + esc(title) + '">' : '<div style="aspect-ratio:2/3;background:#252525"></div>';
    return '<article class="tmdb-card">' + image + '<div class="tmdb-info"><div class="tmdb-title">' + esc(title) + '</div><div class="tmdb-meta">' + esc(year || "Release date unknown") + ' · ★ ' + (Number(m.vote_average || 0).toFixed(1)) + '</div><p class="tmdb-overview">' + esc(m.overview || "No description available.") + '</p></div></article>';
  }
  function esc(s) { return String(s || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  async function request(path) {
    const t = token();
    if (!t) throw new Error("Connect your TMDB Read Access Token first.");
    const response = await fetch(API + path, {headers:{Authorization:"Bearer " + t, accept:"application/json"}});
    if (!response.ok) throw new Error(response.status === 401 ? "TMDB rejected this token. Check it and reconnect." : "TMDB request failed (" + response.status + ").");
    return response.json();
  }
  async function load(path, label) {
    status("Loading " + label + "…");
    $("tmdbMovies").innerHTML = "";
    try {
      const data = await request(path);
      const results = (data.results || []).filter(x => x.media_type !== "person");
      $("tmdbMovies").innerHTML = results.length ? results.map(card).join("") : '<div class="empty">No matching titles found.</div>';
      status("Showing " + results.length + " titles from TMDB. These are catalogue details, not playable movie files.");
    } catch (e) { status(e.message); }
  }
  $("tmdbConnect").addEventListener("click", () => {
    const current = token();
    const value = prompt("Paste your TMDB API Read Access Token. It is saved only in this browser and is not sent to CineFlix servers.", current);
    if (value === null) return;
    if (!value.trim()) { localStorage.removeItem(KEY); status("TMDB disconnected."); $("tmdbMovies").innerHTML = ""; return; }
    localStorage.setItem(KEY, value.trim());
    load("/trending/movie/week?language=en-US&page=1", "trending movies");
  });
  $("tmdbTrendingBtn").addEventListener("click", () => load("/trending/movie/week?language=en-US&page=1", "trending movies"));
  $("tmdbSearchBtn").addEventListener("click", () => {
    const q = $("tmdbSearch").value.trim();
    if (!q) { status("Enter a movie title to search."); return; }
    load("/search/movie?query=" + encodeURIComponent(q) + "&include_adult=false&language=en-US&page=1", "search results");
  });
  $("tmdbSearch").addEventListener("keydown", e => { if (e.key === "Enter") $("tmdbSearchBtn").click(); });
  if (token()) load("/trending/movie/week?language=en-US&page=1", "trending movies");
})();
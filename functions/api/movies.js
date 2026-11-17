const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

function authorized(request, env) {
  const expected = env.CINEFLIX_ADMIN_TOKEN;
  const supplied = request.headers.get("authorization") || "";
  return Boolean(expected && supplied === `Bearer ${expected}`);
}

export async function onRequestGet({ env }) {
  if (!env.CINEFLIX_DB) return json({ error: "Movie database is not configured." }, 503);
  const { results } = await env.CINEFLIX_DB.prepare(
    "SELECT id, title, description, genre, release_year AS year, duration, poster_url AS poster, video_url AS video, license, source_url AS sourceUrl FROM movies WHERE published = 1 ORDER BY created_at DESC"
  ).all();
  return json(results || []);
}

export async function onRequestPost({ request, env }) {
  if (!authorized(request, env)) return json({ error: "Admin key is missing or incorrect." }, 401);
  if (!env.CINEFLIX_DB) return json({ error: "Movie database is not configured." }, 503);
  let movie;
  try { movie = await request.json(); } catch { return json({ error: "Invalid JSON body." }, 400); }
  const title = String(movie.title || "").trim().slice(0, 100);
  const poster = String(movie.poster || "").trim();
  const video = String(movie.video || "").trim();
  const license = String(movie.license || "").trim().slice(0, 180);
  const genre = String(movie.genre || "Other").trim().slice(0, 40);
  const description = String(movie.description || "").trim().slice(0, 1000);
  const sourceUrl = String(movie.sourceUrl || "").trim();
  const year = Number.parseInt(movie.year, 10) || null;
  const duration = String(movie.duration || "").trim().slice(0, 40);
  const safeHttps = value => { try { return new URL(value).protocol === "https:"; } catch { return false; } };
  if (!title || !safeHttps(poster) || !safeHttps(video) || !license) {
    return json({ error: "Title, HTTPS poster URL, HTTPS video URL, and rights/license information are required." }, 400);
  }
  if (sourceUrl && !safeHttps(sourceUrl)) return json({ error: "Source URL must use HTTPS." }, 400);
  const id = crypto.randomUUID();
  await env.CINEFLIX_DB.prepare(
    "INSERT INTO movies (id, title, description, genre, release_year, duration, poster_url, video_key, video_url, license, source_url, published) VALUES (?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, 1)"
  ).bind(id, title, description, genre, year, duration, poster, video, license, sourceUrl).run();
  return json({ ok: true, id }, 201);
}

export async function onRequestDelete({ request, env }) {
  if (!authorized(request, env)) return json({ error: "Admin key is missing or incorrect." }, 401);
  if (!env.CINEFLIX_DB) return json({ error: "Movie database is not configured." }, 503);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ error: "Movie id is required." }, 400);
  await env.CINEFLIX_DB.prepare("DELETE FROM movies WHERE id = ?").bind(id).run();
  return json({ ok: true });
}

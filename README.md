# CineFlix

A responsive, Netflix-inspired movie catalog for films you own, created, or are authorized to distribute.

## Features
- Dark streaming-style homepage and featured movie
- Search and genre filters
- Responsive movie cards for phones, tablets, and desktop
- In-page video player
- Add movies with title, category, year, duration, poster URL, video URL, and description
- Local movie library manager with delete, JSON export, and JSON import
- One sample short film: **Big Buck Bunny** (Blender Foundation, Creative Commons Attribution 3.0)

## Run locally
Open `index.html` in a browser, or serve this folder with any static web server.

## Publish with GitHub Pages
1. Open repository **Settings → Pages**.
2. Choose **Deploy from a branch**.
3. Select branch `main` and folder `/ (root)`.
4. Save and wait for GitHub Pages to publish the site.

## Add and manage movies
Use **＋ Add movie** to add a movie, then **Manage** to remove entries or export/import a JSON backup.

### Current storage limitation
Movie entries are stored in the current browser's local storage. They do not upload video files and are not shared with other visitors or devices. Export/import lets you move a backup manually.

## For a shared public streaming catalog
Connect a backend such as Supabase (database, authentication, and video/image storage). The public site should only use a publishable/anonymous client key with strict Row Level Security; never put a service-role key or other secret in browser code. Configure an authenticated admin account and storage limits before accepting uploads.

Only publish media you own or have explicit distribution rights to. This project does not provide copyrighted movie files.

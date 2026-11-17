# CineFlix

A responsive movie catalog for films you own, created, or are authorized to distribute.

## Live site
https://cineflix-stream.pages.dev

## Features
- Responsive movie catalog, search, genre filters, and in-page video player
- Shared public movie catalog backed by Cloudflare D1
- Admin-protected add and delete operations
- Add a movie using a direct HTTPS video URL and poster URL
- Rights/license details stored with each movie
- TMDB metadata discovery (TMDB does not provide full movie streams)

## Add a movie
1. Open the live site and tap **＋ Add movie**.
2. Enter the title, category, poster HTTPS URL, and direct video HTTPS URL (MP4/WebM).
3. Enter the rights/license details and optional source page.
4. Enter the private CineFlix admin key and publish.
5. The movie appears in the shared catalog for all visitors.

The admin key is stored as a Cloudflare Pages secret, not in the public website code. Do not share it or place it in GitHub.

## Current video hosting limitation
The shared catalog is active, but **video-file upload storage is not enabled yet**. The current workflow references a direct HTTPS video URL from a host you control or are licensed to use. To enable uploads from a phone/computer, activate Cloudflare R2 in the Cloudflare Dashboard, create a bucket named `cineflix-movies`, then add an R2 binding named `MOVIES_BUCKET` to both production and preview Pages Functions. After that, add a secure upload endpoint using authenticated uploads and file-size limits.

R2 activation must be completed in the Cloudflare Dashboard before it can be managed through the API. Cloudflare returned an R2-not-enabled response for this account.

## Backend
- Pages Function: `functions/api/movies.js`
- D1 database: `cineflix-catalog`
- D1 binding: `CINEFLIX_DB`
- Required Pages secret: `CINEFLIX_ADMIN_TOKEN`

The public API only lists published movies. Creating and deleting entries require the admin key. The API accepts HTTPS poster/video URLs and records rights/license information.

## Local development
Open `index.html` for the static fallback, or use Wrangler Pages dev with the D1 binding configured to test the Functions API.

## Legal
Only publish media you own, have licensed, or have verified permission to distribute. A movie's availability on a third-party site does not itself grant streaming or redistribution rights.

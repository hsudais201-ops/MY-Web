# CineFlix

A Netflix-inspired, responsive free-movie catalog built as a lightweight static website.

## Features
- Dark streaming-style homepage and featured movie
- Search and genre filters
- Responsive movie cards for phones, tablets, and desktop
- In-page video player
- Add-movie form for title, genre, year, duration, poster, video URL, and description
- One sample short film: **Big Buck Bunny** (Blender Foundation, Creative Commons Attribution 3.0)

## Run locally
Open `index.html` in a browser, or serve this folder with any static web server.

## Publish with GitHub Pages
In the repository settings, open **Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save. GitHub Pages will publish the static site.

## Adding movies
Use **＋ Add movie** on the site. Add only movies you own, created, or are authorized to distribute. Use a direct MP4/WebM URL for the video and a public poster-image URL.

**Important demo limitation:** movies added through the form are saved in the current browser's local storage. They are not uploaded and will not appear for other visitors or on other devices. To run a real shared streaming service, connect a backend/database, authenticated admin access, and a video hosting/CDN provider. Do not upload copyrighted movies unless you have distribution rights.

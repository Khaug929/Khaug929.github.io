# Video Guide — Portfolio Project Pages

Everything you need to add videos to any project page.

---

## Step 1 — Add the CSS link to your project pages

Open `project-template.html` (and every copy of it you make).
In the `<head>`, you should already have:

```html
<link rel="stylesheet" href="project.css">
```

Add the video stylesheet **directly after** it:

```html
<link rel="stylesheet" href="project.css">
<link rel="stylesheet" href="video.css">   ← ADD THIS LINE
```

Do this once per project page. The homepage (`index.html`) doesn't need it.

---

## Step 2 — Create a /videos/ folder

Inside your project folder (next to `index.html`), create a folder called `videos`:

```
yourusername.github.io/
├── index.html
├── project-template.html
├── style.css
├── project.css
├── video.css          ← new file
├── main.js
├── images/
└── videos/            ← create this folder, drop your files in here
    ├── project1-demo.mp4
    ├── project1-clip-a.mp4
    └── project1-loop.mp4
```

---

## Step 3 — Convert your files (if needed)

### .mp4 files
**No conversion needed.** Rename and drop into `/videos/`. Done.

### .mov files
`.mov` only plays natively in Safari. Convert to `.mp4` first so Chrome and
Firefox can play it too. Use ffmpeg (free, runs in your terminal):

```bash
ffmpeg -i your-video.mov -c:v libx264 -crf 23 -preset slow -c:a aac -b:a 128k output.mp4
```

What those flags mean:
- `-c:v libx264` — encode video as H.264 (universal browser support)
- `-crf 23` — quality level (lower = better quality, bigger file). Range 18–28. Use 23 for web.
- `-preset slow` — slower encode = smaller file at same quality. Use `fast` if in a hurry.
- `-c:a aac -b:a 128k` — encode audio as AAC at 128kbps (standard web audio)

### ffmpeg / other ffmpeg output files
If your file is already an ffmpeg output (e.g. `.webm`, `.mkv`, `.avi`):

**Convert to .mp4 (universal):**
```bash
ffmpeg -i your-video.webm -c:v libx264 -crf 23 -preset slow -c:a aac output.mp4
```

**Convert to .webm (smaller, modern browsers only):**
```bash
ffmpeg -i your-video.mp4 -c:v libvpx-vp9 -crf 33 -b:v 0 -c:a libopus output.webm
```

**Best practice:** keep both `.mp4` AND `.webm` versions. The HTML snippet lists
`.webm` first — modern browsers use it (better compression). Older browsers fall
back to `.mp4`. You get the best of both.

**Trim a clip before adding it (optional):**
```bash
# Keep only seconds 10–25 of a video
ffmpeg -i your-video.mp4 -ss 00:00:10 -to 00:00:25 -c copy trimmed.mp4
```

**Reduce file size for web (if your video is large):**
```bash
# Scale down to 1080p max and re-encode
ffmpeg -i big-video.mp4 -vf "scale=-2:1080" -c:v libx264 -crf 25 -preset slow -c:a aac -b:a 128k web-ready.mp4
```

### Install ffmpeg (if you don't have it)
- **Windows:** Download from https://ffmpeg.org/download.html → add to PATH
- **Mac:** `brew install ffmpeg` (requires Homebrew: https://brew.sh)
- **Linux:** `sudo apt install ffmpeg`

---

## Step 4 — Choose a video block and paste it in

Open `video-blocks.html`. There are three variants:

| Variant | When to use it | What to copy |
|---------|---------------|-------------|
| **Variant 1** — Full-width single | Main demo, test run, build timelapse | The first `<figure>` block |
| **Variant 2** — Side-by-side pair | Before/after, two test conditions, v1 vs v2 | The `<div class="proj-image-grid">` block |
| **Variant 3** — Autoplay loop | Ambient b-roll, rotating render, silent atmosphere | The third `<figure>` block |

Copy the block you want and paste it **inside** `<article class="project-content">` in your project page.

---

## Where exactly can videos go?

Videos use the same slot system as images. Paste them anywhere between or inside
`<section class="proj-section">` blocks. Here is the full map of valid positions:

```
<article class="project-content">

  <section class="proj-section">         ← Overview text
    <h2>Overview</h2>
    <p>...</p>
  </section>

  ★ PASTE VIDEO HERE — after Overview text, before next section

  <figure class="proj-figure">           ← existing image slot (keep or replace)
    <img src="...">
  </figure>

  ★ OR PASTE VIDEO HERE — replacing the image entirely

  <section class="proj-section">         ← Problem & Background
    ...
  </section>

  ★ OR HERE — between any two sections

  <div class="proj-image-grid">          ← side-by-side images (keep or replace)
    ...
  </div>

  ★ OR REPLACE THE IMAGE GRID with Variant 2 (video pair)

  <section class="proj-section">         ← Design Process
    ...
  </section>

  ★ Great spot for a build timelapse or process video (Variant 1)

  <div class="proj-results">             ← results callout numbers
    ...
  </div>

  ★ Good spot for a final demo (Variant 1) — "here's what it actually does"

  <section class="proj-section">         ← Reflection
    ...
  </section>

  <div class="proj-nav">                 ← prev/next links — don't put video after this
    ...
  </div>

</article>
```

**Rule of thumb:** videos go in the same positions as `<figure class="proj-figure">` blocks.
You can mix images and videos freely — one after the other, or use a video
instead of an image in any slot.

---

## Poster image (video thumbnail)

The `poster` attribute sets an image that shows before the viewer presses play.
Without it, the video shows a black frame or the first video frame.

```html
<video controls poster="images/project1-video-thumb.jpg">
```

Make the poster image:
- Export any frame from your video as a `.jpg`
- Or screenshot a good moment and crop it to the video's aspect ratio
- Recommended size: same as the video resolution (e.g. 1280×720px)

If you have no poster image, just delete the `poster="..."` attribute entirely.
The browser will show the first frame instead.

---

## File size targets

Large video files slow down your page. Aim for:

| Clip type | Target size |
|-----------|------------|
| Short demo (< 30s) | Under 15 MB |
| Medium clip (30s–2min) | Under 40 MB |
| Long build timelapse | Under 80 MB |
| Autoplay loop | Under 5 MB |

To check your current file size in the terminal:
```bash
ls -lh videos/your-video.mp4
```

If a file is too large, re-encode it with a higher CRF value (25–28) or
scale it down to 720p:
```bash
ffmpeg -i big.mp4 -vf "scale=-2:720" -c:v libx264 -crf 26 -preset slow -c:a aac -b:a 96k smaller.mp4
```

---

## Quick reference — the two lines you always edit

In every video block, you only need to change two things:

```html
<source src="videos/YOUR-FILE-NAME.webm" type="video/webm">
<source src="videos/YOUR-FILE-NAME.mp4"  type="video/mp4">
```

Replace `YOUR-FILE-NAME` with the actual filename of your video.
Everything else in the block can stay exactly as-is.

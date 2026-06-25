# Image Guide — Portfolio

A quick reference for every image slot in the portfolio.
Drop your images in the `/images/` folder and name them to match.

---

## Homepage (index.html)

| Slot | File name | Recommended size | Where it appears |
|------|-----------|-----------------|-----------------|
| Project card 1 | `images/project1.jpg` | 800 × 500 px | Featured card (left panel) |
| Project card 2 | `images/project2.jpg` | 800 × 500 px | Card grid row |
| Project card 3 | `images/project3.jpg` | 800 × 500 px | Card grid row |
| Update header  | `images/update1.jpg`  | 1200 × 400 px | Latest update panel |

> **Tip:** If an image is missing, the site shows a dashed placeholder automatically.
> You can publish without images and add them later.

---

## Project page (project-template.html)

Copy this file and rename it for each project (e.g. `project-robotic-arm.html`).

| Slot | File name | Recommended size | Where it appears |
|------|-----------|-----------------|-----------------|
| Hero banner | `images/project1-hero.jpg` | 1600 × 700 px | Full-width top banner |
| Overview image | `images/project1-overview.jpg` | 1000 × 560 px | Below intro paragraph |
| Detail A | `images/project1-detail-a.jpg` | 600 × 400 px | Left of side-by-side pair |
| Detail B | `images/project1-detail-b.jpg` | 600 × 400 px | Right of side-by-side pair |
| Process photo | `images/project1-process.jpg` | 800 × 600 px | Below design process section |
| Final result | `images/project1-final.jpg` | 1000 × 660 px | Below results section |

For your second project, use `project2-hero.jpg`, `project2-overview.jpg`, etc.

---

## Adding a new image to the page

1. Drag your image file into the `/images/` folder.
2. In the HTML, find the `<img>` tag in the section where you want it.
3. Change `src="images/old-name.jpg"` to `src="images/your-file.jpg"`.
4. Update the `alt="..."` text — a short plain-language description of what's shown.
5. Save, then run `git add . && git commit -m "add images" && git push`.

---

## Changing an image position

All images are inside a `<div class="card-image">` or `<figure class="proj-figure">` wrapper.
The CSS uses `object-fit: cover` so images always fill their box without stretching.

To control what part of the image is visible, add `object-position` to the `<img>` tag:

```html
<!-- Show top of image (good for faces) -->
<img src="images/project1.jpg" style="object-position: center top;" alt="...">

<!-- Show bottom of image (good for ground-level detail) -->
<img src="images/project1.jpg" style="object-position: center bottom;" alt="...">

<!-- Show left side -->
<img src="images/project1.jpg" style="object-position: left center;" alt="...">
```

---

## Image formats

| Format | Use when |
|--------|----------|
| `.jpg` | Photos, renders, screenshots with many colors |
| `.png` | Diagrams, CAD screenshots with sharp edges / transparency |
| `.webp` | Either — smaller file size, supported in all modern browsers |
| `.svg` | Logos, icons, simple line diagrams |

Keep individual files under **500 KB** where possible for fast page loads.
Free compression tools: [squoosh.app](https://squoosh.app) or [tinypng.com](https://tinypng.com).

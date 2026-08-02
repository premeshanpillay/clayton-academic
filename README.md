# Clayton House — Academic Resources

A plain static website. **No build step, no dependencies, no database, no environment
variables.** It is just HTML, CSS and one JavaScript file, which is exactly why it
deploys to Vercel without breaking.

```
index.html          Home page
notes.html          Notes section (grade -> subject -> resources)
assets/styles.css   All styling
assets/data.js      <- THE ONLY FILE YOU EDIT TO ADD NOTES
assets/app.js       Renders the notes views
files/              Put your PDFs here
vercel.json         Clean URLs
```

---

## Adding notes

Open `assets/data.js`. Find the grade, then the subject, then add a line.

**Linking to a file you have:**

1. Drop the PDF into the `files/` folder, e.g. `files/grade10-algebra.pdf`
2. Add it:

```js
10: {
  mathematics: [
    { title: "Algebra Summary", type: "Notes", url: "files/grade10-algebra.pdf" },
  ],
```

**Linking to a website:**

```js
{ title: "Siyavula Maths", type: "Textbook", url: "https://www.siyavula.com" },
```

`description` is optional. `type` can be Notes, Summary, Past Paper, Worksheet,
Video, Textbook or Link — it just shows as a small label and powers the filter.

Grade 10 has a few example entries. Delete them once you add your own.

---

## Previewing it locally

```bash
npx --yes serve /Users/premeshanpillay/clayton-academic -l 3100
```

Then open <http://localhost:3100>.

Note: open it through this server, not by double-clicking `index.html`. The site uses
clean URLs like `/notes`, which need a server to resolve.

---

## Deploying to Vercel

### The important detail

In Vercel's project settings, **Framework Preset must be `Other`** and the
Build Command must be **empty**. There is nothing to build. If Vercel tries to run a
build, that is what fails.

### Option A — via GitHub (recommended, auto-deploys on every push)

```bash
cd /Users/premeshanpillay/clayton-academic
git init
git add -A
git commit -m "Clayton House academic resources"
git branch -M main
git remote add origin https://github.com/premeshanpillay/YOUR-REPO.git
git push -u origin main
```

Then on <https://vercel.com/new>: import the repo, set Framework Preset to **Other**,
leave Build Command blank, and deploy.

After this, every `git push` redeploys the site automatically.

### Option B — straight from your machine

```bash
npx --yes vercel --prod
```

Answer the prompts (it will ask you to log in the first time). It will detect a static
site and deploy it.

---

## Updating the site later

```bash
cd /Users/premeshanpillay/clayton-academic
git add -A
git commit -m "Add Grade 11 Physical Science notes"
git push
```

Vercel rebuilds and publishes within about a minute.

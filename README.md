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
api/upload.js       Receives visitor uploads
api/files.js        Lists uploaded files
files/              Put your own PDFs here
vercel.json         Clean URLs
```

Each subject page shows two lists merged together: the resources you curate in
`assets/data.js`, and anything visitors have uploaded.

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

## Uploads

Any visitor to the site can upload a document straight onto a subject page. There is
no login and no approval step — an uploaded file is public immediately.

### Turning it on

Uploads need somewhere to store files. After the site is deployed:

1. Open your project on Vercel
2. **Storage** in the sidebar → **Create Database** → **Blob**
3. Set access to **Public**, name it anything, and create it
4. Make sure the store is connected to this project

That is the whole setup. Vercel adds the `BLOB_READ_WRITE_TOKEN` environment
variable automatically — you never copy or paste it yourself.

Until you do this, the site still works perfectly; the subject pages just say
"Uploading is available on the published site" instead of showing the upload button.

### What is allowed

| | |
|---|---|
| Max size | 4 MB per file |
| Allowed | PDF, Word, PowerPoint, Excel, plain text, and images |
| Blocked | `.html`, `.svg`, `.js`, archives, and everything else |

The 4 MB cap is Vercel's request body limit (4.5 MB), not an arbitrary choice.

`.html`, `.svg` and `.js` are blocked deliberately. Those file types can contain
scripts, and because uploads are served from your own domain, allowing them would let
anyone run code against people visiting your site. Do not add them to the allowlist in
`api/upload.js`.

### Things worth knowing

Because there is no approval step, anything anyone uploads goes live under your
domain immediately. If the site gets shared beyond your house, expect that to be
tested eventually. Two things you can do if that happens:

- Delete files from the Vercel dashboard: **Storage** → your store → **Browser**
- Ask me to add an approval queue or a shared house password

Vercel Blob has a free allowance and then charges for storage and bandwidth. Keep an
eye on it if the site gets busy.

---

## Deploying to Vercel

### The important detail

In Vercel's project settings, **Framework Preset must be `Other`** and the
Build Command must be **empty**. Vercel installs the one dependency and picks up the
`api/` functions on its own — there is no build to run.

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

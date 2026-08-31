# my-app

A minimal, responsive static website that displays:

- **Title:** `Hello World!`
- **Text:** `I'm Jae Seung Lee`

It is intentionally dependency-free: the browser serves `index.html` and
`styles.css` directly. This makes it a simple starting point for deployment on
Cloudflare Pages.

## Project structure

```text
my-app/
├── index.html   # Page content and accessible HTML structure
├── styles.css   # Responsive design and detailed implementation comments
├── _headers     # Security headers applied by Cloudflare Pages
├── .gitignore   # Local-only files that Git should ignore
└── README.md    # Project and deployment guide
```

## Run locally

Because this is a static site, opening `index.html` in a browser is enough.
For a local web server (recommended while developing), run this from the
project directory:

```bash
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## Change the displayed content

Edit these two lines in `index.html`:

```html
<h1>Hello World!</h1>
<p>I'm Jae Seung Lee</p>
```

Visual changes belong in `styles.css`. Reusable values such as colors and the
card shadow are defined at the top of that file as CSS custom properties.

## Publish to GitHub later

No GitHub repository has been created, configured, or pushed by this setup.
When you are ready, create an empty `my-app` repository on GitHub, then run:

```bash
git init
git add .
git commit -m "Create Hello World page"
git branch -M main
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/my-app.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username. If you prefer HTTPS,
use the repository URL GitHub provides instead of the SSH URL.

## Deploy with Cloudflare Pages

After the GitHub repository is available:

1. In the Cloudflare dashboard, go to **Workers & Pages** and choose **Create**.
2. Select **Pages** and connect the GitHub `my-app` repository.
3. Use these build settings:
   - **Framework preset:** `None`
   - **Build command:** leave empty
   - **Build output directory:** `/`
4. Deploy the project.

Cloudflare Pages will publish the static files from the repository root and
apply the security headers declared in `_headers`. Future pushes to the
production branch will trigger new deployments automatically.

## Current status

The app exists only locally. It has **not** been committed, pushed to GitHub,
or deployed to Cloudflare Pages.

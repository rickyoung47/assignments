# my-app

A minimal static website that displays **"Hello World!"** and **"I'm Younghun Kim"**.

## Project structure

```text
my-app/
├── index.html   # The page content and metadata
├── styles.css   # The responsive visual design
└── README.md    # Setup and deployment notes
```

## Run locally

No packages, build step, or environment variables are required.

Open `index.html` in a web browser, or start a static web server from the project directory:

```bash
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## Customize

- Change the visible title and text in `index.html`.
- Change the color variables at the top of `styles.css` to update the design.
- The code includes comments explaining the purpose of each section to make later changes straightforward.

## Deploy to Cloudflare Pages

This project is deployed as a Cloudflare Pages **Direct Upload** project. It has
no framework or build step: the repository root is uploaded as the static site.

To publish a later version from the project directory, run:

```bash
npx wrangler pages deploy . --project-name=my-app
```

Cloudflare Pages will serve the production deployment at a `pages.dev` address.
Direct Upload projects cannot later be switched to Cloudflare's Git integration,
so use the command above whenever you want to publish new changes.

## Notes

- No Cloudflare account configuration or credentials are stored in this repository.
- The source is stored on GitHub; deployments are published directly with Wrangler.

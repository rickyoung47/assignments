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

This is a plain static site, so Cloudflare Pages can deploy it without a framework or build command.

1. Create a GitHub repository named `my-app` and push this project's files when you are ready.
2. In the Cloudflare dashboard, go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Choose the GitHub `my-app` repository.
4. In the build settings, set **Build command** to empty and **Build output directory** to `.` (the repository root).
5. Deploy. Future pushes to the selected production branch will automatically trigger new deployments.

## Notes

- No Cloudflare account configuration is stored in this repository.
- No deployment or GitHub push has been made yet.

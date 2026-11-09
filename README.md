# Seif-portfolio

Seif Eldin Magdy's static portfolio, hosted on GitHub Pages.

## Profile and CV

The profile presents Seif as an AI Automation Engineer and retains data science
as his earlier professional background. Skills cover AI agents and prompting,
n8n, APIs, RAG, UiPath/RPA, enterprise integration and automation security.

The download button serves `assets/Seif_Eldin_Magdy_AI_Automation_Engineer_CV.pdf`.
Its editable source is the adjacent HTML file. To regenerate the two-page PDF,
print that HTML in Chromium using A4 paper, zero margins, background graphics
enabled and browser headers/footers disabled. Check both pages before replacing
the PDF; the HTML includes its own page footers.

## Project showcase

The Pollion collection features Pulse, Gnomon and the lead-generation engine,
credited as projects built together with Ziad. The homepage and case-study
pages use the portfolio's cyan, purple and magenta palette. Pulse and Gnomon
retain their own product branding inside centered interactive demo windows.

- `projects/pulse/`: project reviews, client/PM dashboards, simulated Ask Pulse,
  score debates, scoring walkthrough and PDF reports.
- `projects/gnomon/`: attendance, breaks, time-off requests, manager/employee
  views and CSV reports.
- `projects/lead-generation/`: interactive workflow stages and a simulated
  research, enrichment, verification and delivery journey.

Demo data is fictional. Attendance and review actions run locally in the
visitor's page and reset on reload; PDF report settings can remain in the
browser's local storage. No production accounts, API keys, project records or backend
connections are required. Reported lead-generation outcomes are attributed
to the shared project case study rather than presented as demo measurements.

The project presentations and demo interfaces are adapted from the public
reference supplied for this task:
https://ziad-business-systems.berry-hero-3491.chatgpt.site/
The personal styling, navigation, contact details and project collection are
specific to Seif's portfolio. Tool logos identify the respective products.
The bundled jsPDF library retains its original license header.

## Preview and deployment

No build step is needed. From the parent directory, run:

```sh
python3 -m http.server 8765
```

Open `http://localhost:8765/Seif-portfolio/`. Serving the parent directory also
checks the `/Seif-portfolio/` path used by GitHub Pages. All project navigation
uses relative URLs, including iframe assets and exports.

Publish the repository root through the existing GitHub Pages configuration.
The four original machine-learning projects remain in the homepage collection.

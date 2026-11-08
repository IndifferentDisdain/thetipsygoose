# The Tipsy Goose

The Tipsy Goose is a static home cooking and cocktail publication for <https://thetipsygoose.com>. It explores how generative AI, human judgment, and actual kitchen experience can make meal planning more personal and useful than a fixed meal-kit box.

The production site is intentionally in a polished prelaunch state until real editorial content is supplied. Development fixtures demonstrate every content type and interaction, but are kept separate, marked `noindex`, and excluded from production output.

## Stack

- Astro 7 with strict TypeScript and static generation
- Tailwind CSS 4 through the official Vite integration
- Astro Content Collections with Zod schema validation
- Astro sitemap generation and locally managed assets
- Azure Static Web Apps configuration
- GitHub Actions validation and deployment

Node 22 is the supported development and CI runtime.

## Develop

```sh
npm install
npm run dev
```

`npm run dev` sets `SHOW_FIXTURES=true`, so the clearly labeled demonstration recipes, menu, and note are available locally. Astro prints the local URL, normally `http://localhost:4321`.

```sh
npm run check          # type/content validation
npm run build          # production build; fixtures excluded
npm run verify         # asserts key output and no fixture leakage
npm run build:fixtures # optional static fixture build for interaction QA
npm run preview        # preview the most recent build
```

Do not set `SHOW_FIXTURES=true` in production or in the Azure deployment workflow.

## Content authoring

Publishable Markdown belongs in:

- `src/content/recipes/`
- `src/content/menus/`
- `src/content/notes/`

Development-only examples live under `src/fixtures/`. Their schemas are identical to the corresponding production collections, so they are useful as field references without becoming publishable content.

The canonical schemas are in `src/content.config.ts`. A recipe includes structured ingredient and instruction groups, numeric quantities, a numeric yield, times in minutes, equipment, substitutions, make-ahead and technique notes, pairings, related slugs, dates, editorial status, and an optional AI-contribution record. Menu recipe references use recipe slugs. Kitchen notes carry a topic and optional related recipe slugs.

### Editorial status

Every item must be one of:

- `draft`: unfinished and excluded from production routes
- `experimental`: a proposition or work in progress; copy must not imply testing that did not occur
- `kitchen-tested`: cooked and reviewed in a real kitchen

Only apply `kitchen-tested` when that is true. Use `statusNote` on recipes to clarify what was tried and what remains uncertain. If AI helped, `aiContribution.note` should describe its role plainly; `changedAfterCooking` should record real revisions, not a generic claim.

### Recipe data conventions

- Store ingredient quantities as positive numbers (`0.5`, not `"1/2"`) so serving adjustment works.
- Put display nuance such as “divided” or “plus more to finish” in `note`.
- Store prep, cook, and total times as minutes. Omit any time that is not known.
- Recipe JSON-LD is generated from these same fields. Do not maintain a second SEO-only recipe representation.
- Related content currently uses slugs. Keep slugs stable after publication.

## Photographs and images

Do not use generated or unrelated food photography to stand in for a cooked dish. Add original, properly licensed photographs beside the content that they depict. Store source images with the relevant content or under `src/assets/`, reference them through the content collection `image()` field, and provide factual alt text in `heroAlt`. Astro will optimize imported images at build time.

The current social card and monogram are restrained temporary SVG marks, not final goose artwork. Replace them when the final brand artwork is available.

## Interaction and accessibility notes

- Recipe search and filters run entirely in the browser and require no backend.
- Serving controls scale numeric ingredient quantities from immutable base values.
- Ingredient checkboxes are local page state and are intentionally not persisted.
- Print CSS removes navigation, controls, narrative, and side notes while retaining the recipe title, ingredients, and instructions.
- Fixture pages carry `noindex,nofollow`; production builds generate no fixture routes at all.

## Azure Static Web Apps deployment

The repository contains `staticwebapp.config.json` and two workflows:

- `ci.yml` installs, validates, builds, and verifies pull requests.
- `azure-static-web-apps.yml` repeats those checks on `main` and deploys the already-built `dist/` directory.

Credentials must remain in GitHub Actions secrets. Nothing sensitive belongs in this repository.

### Remaining launch steps

1. In the intended Azure subscription, create a new Azure Static Web App for The Tipsy Goose. Do not reuse or modify any Byte4Bite resource.
2. Choose GitHub as the source and select `IndifferentDisdain/thetipsygoose`, branch `main`. If Azure offers to create a workflow, cancel or remove that generated workflow; this repository already has one.
3. Copy the new Static Web App deployment token into the repository secret `AZURE_STATIC_WEB_APPS_API_TOKEN_THE_TIPSY_GOOSE` under **Settings → Secrets and variables → Actions**.
4. Run **Deploy to Azure Static Web Apps** from GitHub Actions and verify the Azure-provided hostname, navigation, the 404 response, sitemap, and security headers.
5. In the Azure Static Web App, add both `thetipsygoose.com` and `www.thetipsygoose.com` as custom domains. Follow Azure's displayed validation records exactly; record names and targets vary by DNS provider and Azure resource.
6. At the DNS host, add only the validation and CNAME/ALIAS records Azure requests. Decide which hostname is canonical (the code currently uses the apex `https://thetipsygoose.com`) and configure the other hostname to redirect there.
7. Wait for Azure to show certificate and custom-domain status as valid, then verify HTTPS at both hostnames, canonical tags, `robots.txt`, `sitemap-index.xml`, social metadata, and a real 404 response.
8. Add real editorial content and original photographs through a pull request. Confirm the content status, recipe structured data, responsive layout, and print view before merging.

The domain should not be described as live until the Azure deployment and DNS/certificate checks in steps 4–7 have passed.

## Reference boundary

Byte4Bite was inspected only as a technical reference for Astro content structure and Azure Static Web Apps conventions. No Byte4Bite recipes, branding, editorial content, source files, cloud resources, or deployed-site changes are part of this repository.

# The Tipsy Goose

The Tipsy Goose is a static home cooking and cocktail publication for <https://thetipsygoose.com>. It explores how generative AI, human judgment, and actual kitchen experience can make meal planning more personal and useful than a fixed meal-kit box.

The production site is intentionally in a polished prelaunch state until real editorial content is supplied. Development fixtures demonstrate every content type and interaction, but are kept separate, marked `noindex`, and excluded from production output.

## Stack

- Astro 7 with strict TypeScript and static generation
- Tailwind CSS 4 through the official Vite integration
- Astro Content Collections with Zod schema validation
- Astro sitemap generation and locally managed assets
- Netlify static hosting configuration
- GitHub Actions validation with deployment through Netlify's Git integration

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
npm run prepare:brand  # rebuild the derived emblem and social card
```

Do not set `SHOW_FIXTURES=true` in production. `netlify.toml` explicitly sets it to `false`.

## Content authoring

Publishable Markdown belongs in:

- `src/content/recipes/`
- `src/content/menus/`
- `src/content/notes/`
- `src/content/cocktails/`

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

### Cocktail publishing

Each cocktail lives in one Markdown file under `src/content/cocktails/`. Frontmatter holds only structured facts used for menus, archive organization, serving adjustment, and relationships; preparation, tasting notes, variations, and history belong in the Markdown body.

- `menuStatus: house` places a drink under House Staples.
- `menuStatus: rotating` places it under On Rotation.
- `menuStatus: experimental` or `archived` keeps it in the recipe book but off the curated menu.
- `testingStatus: tested` enables the 1, 2, and 4 cocktail serving controls. Use `provisional` for a drink with an unconfirmed specification and `proposed` for an untested idea.

Add an optional local `heroImage` and factual `heroAlt` when original drink photography is available. No component or menu edit is needed when adding or promoting a cocktail.

## Photographs and images

Do not use generated or unrelated food photography to stand in for a cooked dish. Add original, properly licensed photographs beside the content that they depict. Store source images with the relevant content or under `src/assets/`, reference them through the content collection `image()` field, and provide factual alt text in `heroAlt`. Astro will optimize imported images at build time.

The supplied brand originals live in `src/assets/brand/source/`. The header and footer use a deterministic crop of the exact goose medallion; the social card is derived from the supplied pub banner. Run `npm run prepare:brand` after replacing those originals. The preparation script only crops, resizes, compresses, and samples colors—it does not redraw or generatively reinterpret the character.

Keep the source artwork's aspect ratio intact. Recipe photographs remain a separate editorial concern: do not use the goose artwork, generated food imagery, or unrelated photographs to imply that a dish was cooked.

## Interaction and accessibility notes

- Recipe search and filters run entirely in the browser and require no backend.
- Serving controls scale numeric ingredient quantities from immutable base values.
- Ingredient checkboxes are local page state and are intentionally not persisted.
- Print CSS removes navigation, controls, narrative, and side notes while retaining the recipe title, ingredients, and instructions.
- Fixture pages carry `noindex,nofollow`; production builds generate no fixture routes at all.

## Netlify deployment

The repository contains `netlify.toml`, which tells Netlify to run `npm run build`, publish `dist/`, use Node 22, keep development fixtures disabled, apply security headers, and cache Astro's fingerprinted assets. Netlify automatically serves `dist/404.html` for missing static routes.

The GitHub workflow `ci.yml` independently installs, validates, builds, and verifies pull requests. Netlify's Git integration owns production deployment from `main`; no Netlify token is stored in this repository or required by GitHub Actions.

### Deployment checks

1. Keep the production branch set to `main`. Build settings resolve from `netlify.toml`: command `npm run build`, publish directory `dist`.
2. After merging or pushing, verify the Netlify deploy completed successfully and inspect both the Netlify hostname and `https://thetipsygoose.com` over HTTPS.
3. Test navigation, a real 404 response, `robots.txt`, `sitemap-index.xml`, canonical/social metadata, the apex/`www` redirect, and response security headers.
4. Add real editorial content and original photographs through a pull request. Confirm editorial status, Recipe JSON-LD, responsive layout, and print view before merging.

The domain should not be described as live until the Netlify deploy, DNS, redirect, and TLS checks above have passed.

## Reference boundary

Byte4Bite was inspected only as a technical reference for Astro content structure and static-hosting conventions. No Byte4Bite recipes, branding, editorial content, source files, hosting resources, or deployed-site changes are part of this repository.

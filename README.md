# The Tipsy Goose

The Tipsy Goose is a static home cooking and cocktail publication for <https://thetipsygoose.com>. It explores how generative AI, human judgment, and actual kitchen experience can make meal planning more personal and useful than a fixed meal-kit box.

The production site is intentionally in a polished prelaunch state until real editorial content is supplied. Development fixtures demonstrate every content type and interaction, but are kept separate, marked `noindex`, and excluded from production output.

## Stack

- Astro 7 with strict TypeScript and static generation
- Tailwind CSS 4 through the official Vite integration
- Astro Content Collections with Zod schema validation
- Astro sitemap generation and locally managed assets
- Netlify static hosting configuration
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

Do not set `SHOW_FIXTURES=true` in production. `netlify.toml` explicitly sets it to `false`.

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

## Netlify deployment

The repository contains `netlify.toml`, which tells Netlify to run `npm run build`, publish `dist/`, use Node 22, keep development fixtures disabled, apply security headers, and cache Astro's fingerprinted assets. Netlify automatically serves `dist/404.html` for missing static routes.

The GitHub workflow `ci.yml` independently installs, validates, builds, and verifies pull requests. Netlify's Git integration owns production deployment from `main`; no Netlify token is stored in this repository or required by GitHub Actions.

### Remaining launch steps

1. In the connected Netlify site, confirm the production branch is `main`. Build settings should resolve from `netlify.toml`: command `npm run build`, publish directory `dist`.
2. Trigger or observe the first production deploy from the latest `main` commit. Verify that Netlify reports the build and deploy as successful.
3. Test the Netlify-generated hostname: navigation, search/filtering, a real 404 response, `robots.txt`, `sitemap-index.xml`, canonical/social metadata, and response security headers.
4. In **Domain management**, add `thetipsygoose.com` and `www.thetipsygoose.com`. Make the apex domain primary because canonical URLs currently use `https://thetipsygoose.com`; Netlify should redirect the alias to the primary domain.
5. At the DNS host, add only the records Netlify displays for the custom domains. DNS targets vary depending on whether Netlify DNS or external DNS is used.
6. Wait for Netlify to show DNS verification and TLS certificate provisioning as complete, then verify HTTPS and redirects at both hostnames.
7. Add real editorial content and original photographs through a pull request. Confirm editorial status, Recipe JSON-LD, responsive layout, and print view before merging.

The domain should not be described as live until the Netlify deploy, DNS, redirect, and TLS checks above have passed.

## Reference boundary

Byte4Bite was inspected only as a technical reference for Astro content structure and static-hosting conventions. No Byte4Bite recipes, branding, editorial content, source files, hosting resources, or deployed-site changes are part of this repository.

# Multilingual product collection

Edit reviewed facts in `resource/products-en.json` and translations in `resource/product-locales/*.json`, then run `npm run products:build`. The shared renderer writes 12 product pages and a homepage collection in each of en, es, ja, zh-Hant, de, pt and fr: 84 detail pages total. `scripts/product-localization.js` combines localized family descriptions with each version’s reviewed facts, image choices, ASIN and related products. The shared header/footer and journal content are preserved. The old `build-products-en.js` command remains a compatibility entry point.

The collection uses twelve product cards with the same layout and image proportions. Each has independent detail and attributed Amazon links. Detail pages contain a gallery, concrete selling points, two illustrated feature sections, included contents, specifications and FAQs. The three dinosaur, coral reef and icy world levels, plus waffle L2/L3, provide direct set switching. The homepage includes separate Dinosaurs, Coral Reef and Icy World filters.

## Reviewed sources — 2026-09-12

Amazon links use the attribution URLs in `static/data/product-links.json`; the pink chair uses `create-ai/店铺相关的链接.md`. Selected image URLs and any crops are recorded in `resource/product-image-sources-en.json`. All selected images are served locally with responsive WebP versions.

- `B0GYQ19GG4`: verified selected ASIN and 80-piece title for waffle L2. Listing confirms ages 2–8, project guide and locking storage case. Its gallery shares series images with L3, so photos are explicitly labelled as examples rather than exact L2 contents. The old 122-piece inventory graphic and comparison/certification graphic are excluded.
- `B0GD6G6SBT`: 128-piece waffle block listing, project guide and locking case. Selected illustrations demonstrate connections, vehicles and play. An older illustration labelled 122 pieces and unverified comparison/certification graphics are excluded.
- Dinosaur Jungle L1 `B0H6C6XGJ9`, L2 `B0H6C64K2K` and L3 `B0H6C5SCCL`: verified selected ASINs, titles and matching package photographs show 41, 99 and 129 pieces respectively, ages 3+. Each page uses its own main and package photos. Shared connection and play illustrations are labelled as dinosaur-series examples. Amazon describes basic color-box and upgraded carry-box packaging without a reliable mapping to piece count, so no level is advertised as including a carry box.
- `B0CT9R3PRQ`: individual pink PP plastic chair, replacing the discontinued table set as requested. The overview specifies overall dimensions of 10.24 inches deep × 11.02 inches wide × 18.9 inches high. These are not seat dimensions. Age ranges vary within the listing, so the page emphasizes fit. Lifestyle captions clearly identify separately sold tables and accessories.
- `B0F5PPQ2T3`: Icy World L1, selected ASIN verified. The package image lists 40 pieces and a penguin; the listing recommends ages 3+. Its landing image differs from the package build, so the main photo is a crop of the complete matching package build. No storage box is listed.
- `B0FHK5NP9T`: Icy World L2, selected ASIN and 79-piece title verified. Its package image confirms ages 3–5, animal characters, snowman and storage box.
- `B0FHK6BW37`: Coral Reef L2, selected ASIN and 76-piece title verified; package image confirms a storage box. The marketing age in the image conflicts with the shared listing bullets, so no numeric age is promoted for this version. The gallery uses a component-inventory crop preserving original quantities. Shared mixed-world illustrations are captioned as requiring separately sold sets.
- `B0FHK8V6ZZ`: 136-piece Icy World L3 set. The title specifies 10 figures and ages 4–8; its package-content photo shows a storage box.
- `B0FHK6RHT9`: 136-piece Coral Reef L3 set with storage box, title ages 3–6.
- `B0F5PNRWJ1`: 38-piece Coral Reef L1 set with octopus, title ages 3–5. The landing image shows a different arrangement from the explicitly labelled 38-piece package image. The website uses a crop of the complete matching build from that package image instead. Component inventories for both ocean sets are cropped separately, preserving the original quantities and avoiding conflicting marketing age text in the original graphic headers.
- Nature collection compatibility is described in the reviewed Amazon feature bullets. Mixed-world images are identified as examples using additional, separately sold sets. No compatibility with unrelated brands is claimed.

The former table set `B0FLPJ2DMP` returns 404. The former Rotating Forest landing ASIN `B0F5PPWYML` selects the Icy World L3 ASIN. Neither is used as a product purchase target. Rotating Forest remains a store-discovery link below the current homepage collection; no speculative detail page is generated or added to the sitemap. Its catalog record is retained with `storeOnly: true` for follow-up when a correct listing is supplied.

## SEO and verification

Pages contain static text, independent titles and descriptions, canonical URLs, social images, Product/WebPage JSON-LD and breadcrumb data. Each homepage ItemList points to the twelve detail pages in the same language. No prices, stock or ratings are invented. Every product has a self-referencing canonical and reciprocal alternatives for all seven languages, plus an English x-default. Language switching preserves the selected product filename. Each homepage has localized collection ItemList data, title, description and social metadata. Product/Breadcrumb/WebPage schemas use the matching locale URLs. Unimplemented homepage SearchAction declarations are removed.

The gallery and purchase links work without JavaScript. JavaScript enhances thumbnail selection and homepage filtering. Product asset names avoid the old homepage link-rewriter tokens, preserving the separate detail and Amazon actions.

Validation covers the multi-entry Parcel build, generated header/footer counts, JSON-LD, page and image HTTP responses, generator idempotence, desktop visual checks, mobile overflow checks, filters, gallery switching and dinosaur/ocean/ice variant navigation.

## Multilingual validation

Run `npm run products:check` after generation, or `node scripts/check-products.js --dist` after a full Parcel build. Checks cover 91 pages, unique product titles and descriptions, correct ASIN purchase links, reciprocal language alternatives, sitemap entries, localized breadcrumbs, complete variant choices, image files, translated controls and compiled shared shells. The generator is idempotent. The normal prebuild regenerates all product locales before the existing SEO preparation step.

Amazon photographs remain the authorized original artwork, including any English text embedded in them; captions and alt text are localized. Prices, stock, ratings and reviews are intentionally not fabricated. Product schema describes the catalog; eligibility for Google product rich results additionally depends on its required offer/review data, which this Amazon-linked catalog does not supply. These changes prepare crawlable pages and do not constitute a live deployment or a Search Console submission.

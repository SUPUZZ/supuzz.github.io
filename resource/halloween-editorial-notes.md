# Multilingual Halloween gift cluster — September 22, 2026

Scope: six subjects in seven languages (42 articles): English, Spanish, Japanese, Traditional Chinese, German, Portuguese and French. Each Journal has six cards and a localized Halloween filter. All 42 public URLs are appended to the sitemap without reordering unrelated entries. The scoped stylesheet and existing shared components are reused. The original U.S./Canada shopping context is retained in translations; no shipping availability in other countries is implied.

The English HTML remains the English editorial source. Authored translations live in `resource/halloween-locales/*.cjs`; regenerate the 36 translated articles and all reciprocal alternates with `node scripts/build-halloween-locales.js`. The renderer reuses reviewed, localized product names, facts and authorized image references. It updates only this article cluster, its six translated blog indexes and sitemap entries. Repeated generation is idempotent. Edit the translation sources rather than generated translated HTML. Rerun after changes to English metadata or localized catalog content, and review article dates when publishing later.

## Search intent and entry pages

- `article-halloween-toy-gifts-for-kids.html`: primary commercial guide; Halloween toy gifts for kids. Covers all 11 listed construction sets, plus the single chair as optional furniture.
- `article-halloween-boo-basket-ideas-kids.html`: assembly and presentation; non-candy boo basket ideas for kids.
- `article-non-candy-halloween-gifts-kids.html`: choosing between personal presents, doorstep treats and group gifts.
- `article-halloween-dinosaur-gifts-kids.html`: dinosaur-interest gift selection and three-version comparison.
- `article-halloween-building-block-activities.html`: five practical play prompts; informational entry to relevant sets.
- `article-halloween-classroom-party-gifts.html`: teacher approval, individual favors versus classroom donations, and a timed shared activity.

Every article has a unique title/description, self-canonical, all seven reciprocal language alternatives plus English x-default, BlogPosting and BreadcrumbList JSON-LD, visible author/date, anchored contents, FAQs, product links and related guides. Translated canonicals point to their own pages, never to English. Body links stay in the reader's language, and the existing language selector preserves the article filename. Titles, descriptions, social text, image alternatives, questions and article content are localized. Generic language hreflang codes avoid inventing separate country editions; the existing site conventions for HTML language and Open Graph locale are preserved. FAQ rich results, Product offers, ratings, search volumes and ranking guarantees are not claimed.

Google references checked for this implementation:
- Article markup: https://developers.google.com/search/docs/appearance/structured-data/article
- Reciprocal language alternatives and x-default: https://developers.google.com/search/docs/specialty/international/localized-versions
- Multilingual sites and translated visible content: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- Descriptive localized titles: https://developers.google.com/search/docs/appearance/title-link

## Product and image provenance

Reviewed catalog facts and authorized local photos come from `products-en.json`, `products-en-notes.md`, `product-image-sources-en.json` and the matching English product pages. Reopened Amazon.com listings on September 22, 2026; returned pages can be cached and do not establish real-time availability. Final listing URLs / ASINs:

- https://www.amazon.com/dp/B0GYQ19GG4 — waffle 80
- https://www.amazon.com/dp/B0GD6G6SBT — waffle 128
- https://www.amazon.com/dp/B0H6C6XGJ9 — Dinosaur Jungle L1
- https://www.amazon.com/dp/B0H6C64K2K — Dinosaur Jungle L2, 99 pieces
- https://www.amazon.com/dp/B0H6C5SCCL — Dinosaur Jungle L3, 129 pieces
- https://www.amazon.com/dp/B0F5PNRWJ1 — Coral Reef L1, 38 pieces
- https://www.amazon.com/dp/B0FHK6BW37 — Coral Reef L2, 76 pieces
- https://www.amazon.com/dp/B0FHK6RHT9 — Coral Reef L3, 136 pieces
- https://www.amazon.com/dp/B0F5PPQ2T3 — Icy World L1; shared title is less specific than reviewed package image, so retain the verified 40-piece package reference
- https://www.amazon.com/dp/B0FHK5NP9T — Icy World L2, 79 pieces
- https://www.amazon.com/dp/B0FHK8V6ZZ — Icy World L3, 136 pieces, ages 4–8
- https://www.amazon.com/dp/B0CT9R3PRQ — single pink chair

Rotating Forest has no verified standalone current listing in the catalog and is therefore not presented as a purchasable toy recommendation. The discontinued table set is excluded. Coral Reef L2 has conflicting age marketing in existing source material, so no numeric age is promoted. Waffle L2 uses a shared-series example photo. No new remote images, prices, safety certifications or review claims are added. Product-detail links preserve the existing attributed Amazon shopping route.

The non-candy guide links directly to FARE's Teal Pumpkin Project: https://www.foodallergy.org/our-initiatives/awareness-campaigns/teal-pumpkin-project . The brief explanation distinguishes non-food choices from a claim that any specific toy is allergen-free or certified.

## Publication and measurement

Dates reflect this editorial batch. If publication is delayed, update the visible dates, JSON-LD dates, Open Graph dates and sitemap lastmod together. The evergreen URLs do not require annual renaming. No Search Console account data was available; there are no invented traffic forecasts.

After deployment, verify all 42 public URLs return 200, inspect the main guide in each language in Search Console and submit the existing sitemap URL. Compare impressions, clicks, CTR and query relevance by language and subject, including U.S./Canada country filters; prioritize content updates from actual query data. Track product-detail engagement and existing Amazon attribution separately from search rankings.

## Local verification

The complete multilingual Parcel entry set builds successfully using the existing public URL configuration. The Parcel command was run directly to avoid unrelated prebuild rewrites of other pages and sitemap ordering. Run `node scripts/check-halloween-locales.js --dist` after building; add `--http=http://127.0.0.1:4173` when the local preview is running.

Checks cover 42 pages: unique metadata, correct canonical and eight alternate links, matching language/content schema, publication dates, local destinations and anchors, blog entries, sitemap entries, image attributes and all 12 catalog links in each main guide. New source pages have exactly two shared includes and no local header; compiled pages have one header, one footer and no unresolved includes. Local HTTP checks pass for 67 page/resource URLs. Browser checks confirm six translated mobile guides at 390 pixels without overflowing article elements, loaded hero images, exactly six cards after each translated Halloween filter, and switching from the Traditional Chinese guide to the corresponding German guide. The English layout/filter was also verified in the initial batch. Publication follows the existing GitHub Pages workflow on pushes to main. Local verification does not establish live deployment or search indexing.

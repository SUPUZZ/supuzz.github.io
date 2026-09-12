# English product collection

Edit `resource/products-en.json`, then run `npm run products:build`. The generator writes five English product detail pages, the homepage collection and corresponding sitemap entries. Other language product content and the shared header/footer are unchanged.

The collection uses one featured waffle set and four shorter product cards. Each has independent detail and attributed Amazon links. Detail pages contain a gallery, concrete selling points, two illustrated feature sections, included contents, specifications and FAQs. The two ocean versions link to each other directly.

## Reviewed sources — 2026-09-12

Amazon links use the attribution URLs in `static/data/product-links.json`; the pink chair uses `create-ai/店铺相关的链接.md`. Selected image URLs and any crops are recorded in `resource/product-image-sources-en.json`. All selected images are served locally with responsive WebP versions.

- `B0GD6G6SBT`: 128-piece waffle block listing, project guide and locking case. Selected illustrations demonstrate connections, vehicles and play. An older illustration labelled 122 pieces and unverified comparison/certification graphics are excluded.
- `B0CT9R3PRQ`: individual pink PP plastic chair, replacing the discontinued table set as requested. The overview specifies overall dimensions of 10.24 inches deep × 11.02 inches wide × 18.9 inches high. These are not seat dimensions. Age ranges vary within the listing, so the page emphasizes fit. Lifestyle captions clearly identify separately sold tables and accessories.
- `B0FHK8V6ZZ`: 136-piece Icy World L3 set. The title specifies 10 figures and ages 4–8; its package-content photo shows a storage box.
- `B0FHK6RHT9`: 136-piece Coral Reef L3 set with storage box, title ages 3–6.
- `B0F5PNRWJ1`: 38-piece Coral Reef L1 set with octopus, title ages 3–5. The landing image shows a different arrangement from the explicitly labelled 38-piece package image. The website uses a crop of the complete matching build from that package image instead. Component inventories for both ocean sets are cropped separately, preserving the original quantities and avoiding conflicting marketing age text in the original graphic headers.
- Nature collection compatibility is described in the reviewed Amazon feature bullets. Mixed-world images are identified as examples using additional, separately sold sets. No compatibility with unrelated brands is claimed.

The former table set `B0FLPJ2DMP` returns 404. The former Rotating Forest landing ASIN `B0F5PPWYML` selects the Icy World L3 ASIN. Neither is used as a product purchase target. Rotating Forest remains a store-discovery link below the current homepage collection; no speculative detail page is generated or added to the sitemap. Its catalog record is retained with `storeOnly: true` for follow-up when a correct listing is supplied.

## SEO and verification

Pages contain static text, independent titles and descriptions, canonical URLs, social images, Product/WebPage JSON-LD and breadcrumb data. Homepage ItemList data points to the five detail pages. No prices, stock or ratings are invented. Only English alternates are listed. Language switching from these pages falls back to the selected language's homepage product section.

The gallery and purchase links work without JavaScript. JavaScript enhances thumbnail selection and homepage filtering. Product asset names avoid the old homepage link-rewriter tokens, preserving the separate detail and Amazon actions.

Validation covers the multi-entry Parcel build, generated header/footer counts, JSON-LD, page and image HTTP responses, generator idempotence, desktop visual checks, mobile overflow checks, filters, gallery switching and ocean variant navigation.

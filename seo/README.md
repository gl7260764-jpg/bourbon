# Pages to submit to Google

[`urls.csv`](urls.csv) lists every page in the live sitemap (https://bourbonoaklover.com/sitemap.xml), in the order
worth asking Google to index them: the tiers from [SEARCH-CONSOLE-URLS.md](../SEARCH-CONSOLE-URLS.md) (Tier 1 = home,
shop and the bottles whose titles were just rewritten), then shop categories, the other bottles, locations, blog
posts, and supporting and legal pages last.

Columns: `order`, `url`, `page_type`, `name`, `last_updated`, then `submitted` (put `yes`), `submitted_date` and
`notes` for you.

## Submitting a page

Copy URLs from [`urls.txt`](urls.txt): the same list, one bare URL per line, same order. A line copied from the CSV
brings its other columns with it, and Search Console then reports "Not found (404)" for that made-up address.

1. Google Search Console, property **bourbonoaklover.com**.
2. Paste the URL into "Inspect any URL" at the top, press Enter.
3. **Request indexing**, wait for "Indexing requested".
4. Mark the row `yes` with the date.

Google allows roughly 10 requests a day. The sitemap already tells Google about every page; manual requests just
speed up the important ones, so work from the top.

## Keeping it up to date

After new bottles, blog posts or locations go live:

```bash
npm run seo:urls
```

It reads the live sitemap, adds new pages in their place, drops removed ones and keeps your `submitted` /
`submitted_date` / `notes`. Commit `seo/` with the change.

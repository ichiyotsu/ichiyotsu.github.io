# Fonts

All three families are self-hosted. No font request leaves the visitor's browser.

| File | Family | Use | License |
| --- | --- | --- | --- |
| `bricolage-grotesque.woff2` | Bricolage Grotesque | Latin display type | SIL OFL 1.1 — `OFL-Bricolage.txt` |
| `instrument-sans.woff2` / `instrument-sans-italic.woff2` | Instrument Sans | UI and body Latin | SIL OFL 1.1 — `OFL-InstrumentSans.txt` |
| `smiley-sans-subset.woff2` | Smiley Sans / 得意黑 | Chinese display type | SIL OFL 1.1 — `OFL-SmileySans.txt` |

## About the Chinese subset

`smiley-sans-subset.woff2` is a **subset** of Smiley Sans Oblique containing the characters currently used on the site (≈60 KB instead of ≈1.1 MB). If you rewrite Chinese copy and see a character fall back to the system font, regenerate the subset:

```powershell
# One-time tooling
python -m pip install fonttools brotli

# 1. Refresh chars.txt from index.html + 404.html
node tools/update-chars.mjs

# 2. Download SmileySans-Oblique.ttf from:
#    https://github.com/atelier-anchor/smiley-sans/releases
# 3. Rebuild the subset from the project root:
python -m fontTools.subset "path\to\SmileySans-Oblique.ttf" `
  --text-file=assets\fonts\chars.txt `
  --flavor=woff2 `
  --output-file=assets\fonts\smiley-sans-subset.woff2
```

`chars.txt` is generated from the visible page copy and is committed alongside the font, so a fresh clone can rebuild the subset without guessing. Latin, Chinese punctuation and the page's Chinese characters all live in the same subset.

If you would rather never think about subsets again, use the full Smiley Sans WOFF2 (about 1.1 MB) and drop the subset step.

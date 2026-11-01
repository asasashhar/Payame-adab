"""Render the Urdu e-paper HTML template to PDF via Playwright (Chromium)."""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

TPL = Path("/home/z/my-project/scripts/newspaper-tpl/edition1.html")
OUT = Path("/home/z/my-project/public/newspaper/shumara-1.pdf")


def main():
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else OUT
    out.parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(TPL.as_uri(), wait_until="networkidle")
        page.wait_for_timeout(2500)  # let Nastaliq webfont settle
        page.pdf(
            path=str(out),
            width="210mm",
            height="297mm",
            print_background=True,
            margin={"top": "0", "bottom": "0", "left": "0", "right": "0"},
        )
        browser.close()
    print(f"PDF written: {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Write last-update.json: local time (to the second) and city-level location
of the machine making this update. Run by scripts/pre-commit on every commit
made from this Mac; the Log Flight page writes the same file from the browser.

Location comes from an IP lookup (ipinfo.io) — only city/region/country is
stored, never the IP itself.
"""
import json
import urllib.request
from datetime import datetime
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'last-update.json'


def lookup_location():
    try:
        with urllib.request.urlopen('https://ipinfo.io/json', timeout=5) as r:
            d = json.load(r)
        return ', '.join(p for p in (d.get('city'), d.get('region'), d.get('country')) if p) or None
    except Exception:
        return None


def main():
    now = datetime.now().astimezone()
    stamp = {
        'timestamp': now.strftime('%Y-%m-%d %H:%M:%S %Z'),
        'iso': now.isoformat(timespec='seconds'),
        'location': lookup_location() or 'location unavailable',
        'source': 'Mac',
    }
    OUT.write_text(json.dumps(stamp, indent=2) + '\n', encoding='utf-8')
    print(f"last-update.json: {stamp['timestamp']} · {stamp['location']}")


if __name__ == '__main__':
    main()

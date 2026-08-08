"""Material & color normalization to friendly, consistent label sets.

Keeps the source wording when a mapping is unknown — we never invent a material.
Mappings use canonical English tokens (matching existing Lustro seed style).
"""
from __future__ import annotations

import re

STEEL_TOKENS = {'steel', 'stainless steel', 'stainless', 'oystersteel', '904l steel', 'grade 5 titanium'}
TITANIUM_TOKENS = {'titanium', 'grade 2 titanium', 'grade 5 titanium', 'ti'}
GOLD_TOKENS = {
    '18k gold', '18k yellow gold', '18k white gold', '18k rose gold', '14k gold', 'yellow gold',
    'white gold', 'rose gold', 'pink gold', 'everose', 'sedna', 'moonshine gold', 'lemania gold',
}
CERAMIC_TOKENS = {'ceramic', 'zirconium', 'high-tech ceramic'}
CARBON_TOKENS = {'carbon', 'forged carbon', 'carbon fiber', 'carbon composite', 'tpt carbon'}

BRACELET_TOKENS = {'bracelet', 'oyster', 'jubilee', 'president', 'presidency', 'link'}
STRAP_TOKENS = {'strap', 'leather', 'rubber', 'calfskin', 'alligator', 'crocodile', 'cordovan', 'nato', 'sailcloth', 'canvas'}

GOLD = re.compile(r'\b(gold|everose|sedna|moonshine)\b', re.IGNORECASE)
STEEL = re.compile(r'\bsteel|stainless|oyster\b', re.IGNORECASE)
TITANIUM = re.compile(r'\btitanium\b', re.IGNORECASE)
CERAMIC = re.compile(r'\bceramic|zirconium\b', re.IGNORECASE)
CARBON = re.compile(r'\bcarbon\b', re.IGNORECASE)
PALLADIUM = re.compile(r'\bpalladium\b', re.IGNORECASE)
BRONZE = re.compile(r'\bbronze|bronz\b', re.IGNORECASE)
ALUMINIUM = re.compile(r'\balumin(?:ium|um)\b', re.IGNORECASE)
PLATINUM = re.compile(r'\bplatinum\b', re.IGNORECASE)


def normalize_material(value: str | None) -> str:
    """Rich-material chain: gold > titanium > ceramic > carbon > platinum > bronze > steel > other."""
    if not value:
        return ''
    t = str(value).strip()
    if len(t) > 60:
        t = t[:60]
    if GOLD.search(t):
        # keep gold nuance ("Yellow Gold", "Rose Gold")
        for nuance in ('yellow', 'white', 'rose', 'pink'):
            if nuance in t.lower():
                return f'{nuance.capitalize()} Gold'
        return 'Gold'
    if TITANIUM.search(t):
        return 'Titanium'
    if CERAMIC.search(t):
        return 'Ceramic'
    if CARBON.search(t):
        return 'Carbon'
    if PLATINUM.search(t):
        return 'Platinum'
    if BRONZE.search(t):
        return 'Bronze'
    if ALUMINIUM.search(t):
        return 'Aluminium'
    if STEEL.search(t):
        return 'Steel'
    # known plain tokens
    low = t.lower()
    for tok in sorted(STEEL_TOKENS | TITANIUM_TOKENS, key=len, reverse=True):
        if tok in low:
            return 'Steel' if tok in STEEL_TOKENS else 'Titanium'
    return t  # keep original rather than invent


COLOR_MAP = {
    'black': 'Black', 'white': 'White', 'silver': 'Silver', 'grey': 'Grey', 'gray': 'Grey',
    'blue': 'Blue', 'navy': 'Blue', 'green': 'Green', 'olive': 'Olive', 'brown': 'Brown',
    'gold': 'Gold', 'yellow': 'Yellow', 'rose': 'Rose', 'pink': 'Pink', 'red': 'Red',
    'orange': 'Orange', 'purple': 'Purple', 'violet': 'Violet', 'copper': 'Copper',
    'bronze': 'Bronze', 'cream': 'Cream', 'ivory': 'Cream', 'champagne': 'Champagne',
    'mother of pearl': 'Mother of Pearl', 'mop': 'Mother of Pearl', 'panda': 'Panda',
    'sunburst': 'Sunburst',
}


def normalize_color(value: str | None) -> str:
    if not value:
        return ''
    low = str(value).strip().lower()
    if low in COLOR_MAP:
        return COLOR_MAP[low]
    for needle, label in COLOR_MAP.items():
        if needle in low:
            return label
    # keep original (title-cased) rather than guessing
    return str(value).strip()[:40]


def normalize_strap_bracelet(strap: str | None, bracelet: str | None) -> tuple[str, str]:
    """Split a single 'strap/bracelet' field into (strap_material, bracelet_material)."""
    if not strap and not bracelet:
        return '', ''
    strap_txt = (strap or '').strip()
    brace_txt = (bracelet or '').strip()
    combined = f'{strap_txt} {brace_txt}'
    if brace_txt and not strap_txt:
        # material listed as bracelet: e.g. "Stainless Steel bracelet"
        material = normalize_material(brace_txt)
        if 'strap' in brace_txt.lower() or not _looks_like_bracelet(brace_txt):
            return brace_txt, ''
        return '', material
    return normalize_material(strap_txt), normalize_material(brace_txt)


def _looks_like_bracelet(text: str) -> bool:
    low = text.lower()
    return any(tok in low for tok in BRACELET_TOKENS) and 'strap' not in low
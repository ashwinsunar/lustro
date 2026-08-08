"""Movement family normalization.

Maps retailer vocabulary onto the Lustro Watch movement enum:
  automatic | manual | quartz | spring_drive
And a movement_type atom: mechanical | quartz | solar | hybrid | ''.
"""
from __future__ import annotations

import re

AUTOMATIC = re.compile(
    r'\b(automatic|self[- ]winding|selfwinding|mechanical automatic|automatik|autowinding)\b',
    re.IGNORECASE,
)
MANUAL = re.compile(
    r'\b(manual(?:ly)?[- ]wound|hand[- ]wound|manual wind(?:ing)?|mechanical manual)\b',
    re.IGNORECASE,
)
QUARTZ = re.compile(r'\bquartz\b', re.IGNORECASE)
SOLAR = re.compile(r'\b(solar|eco[- ]drive|kinetic|lumi[b]?brite|solar[- ]quartz|tough solar)\b', re.IGNORECASE)
SPRING_DRIVE = re.compile(r'\bspring[- ]drive\b', re.IGNORECASE)
HYBRID = re.compile(r'\b(hybrid|smart)\b', re.IGNORECASE)
MECHANICAL = re.compile(r'\bmechanical\b', re.IGNORECASE)
RAW = re.compile(r'\b(caliber|calibre|movement|cal\.)\b', re.IGNORECASE)

MOVEMENT_ALIASES: dict[str, str] = {
    'auto': 'automatic',
    'automatic': 'automatic',
    'self-winding': 'automatic',
    'self winding': 'automatic',
    'selfwind': 'automatic',
    'mechanical automatic': 'automatic',
    'mech automatic': 'automatic',
    'hand-wound': 'manual',
    'hand wound': 'manual',
    'handwind': 'manual',
    'manual winding': 'manual',
    'manual wind': 'manual',
    'manual': 'manual',
    'mechanical manual': 'manual',
    'quartz': 'quartz',
    'solar': 'solar',
    'eco drive': 'solar',
    'ecodrive': 'solar',
    'kinetic': 'solar',
    'spring drive': 'spring_drive',
    'spring-drive': 'spring_drive',
}


def normalize_movement(value: str | None) -> tuple[str, str]:
    """Return (movement_family, movement_type). Unknown -> ('', '')."""
    if not value:
        return '', ''
    t = value.strip()
    low = t.lower()

    direct = MOVEMENT_ALIASES.get(low)
    if direct:
        return direct, _movement_type(direct)

    if SOLAR.search(low) and not QUARTZ.search(low) and 'eco' in low:
        return 'quartz', 'solar'
    if SOLAR.search(low):
        return 'quartz', 'solar'
    if SPRING_DRIVE.search(low):
        return 'spring_drive', 'mechanical'
    if AUTOMATIC.search(low):
        return 'automatic', 'mechanical'
    if MANUAL.search(low):
        return 'manual', 'mechanical'
    if QUARTZ.search(low):
        return 'quartz', 'quartz'
    if HYBRID.search(low):
        return 'automatic', 'hybrid'
    if MECHANICAL.search(low):
        return 'automatic', 'mechanical'
    return '', ''


def _movement_type(family: str) -> str:
    if family in ('automatic', 'manual', 'spring_drive'):
        return 'mechanical'
    if family == 'quartz':
        return 'quartz'
    return ''


def extract_caliber(text: str | None) -> str:
    """Pull a caliber token like 'Cal. 3135', '3135', 'Calibre 8900'."""
    if not text:
        return ''
    m = re.search(r'\b(?:cal(?:iber|ibre)?\.?\s*)?(\d{3,6}[a-z]{0,4})\b', str(text), re.IGNORECASE)
    if not m:
        return ''
    token = m.group(1)
    # avoid matching years/prices
    if re.fullmatch(r'\d{4}', token) and 'cal' not in str(text).lower():
        return ''
    return token


__all__ = ['normalize_movement', 'extract_caliber', 'MOVEMENT_ALIASES']
"""Normalize a RawProduct into a canonical NormalizedWatch (Phase 5).

Drop-in rule set: movement, dimensions, water resistance, currencies,
materials, colors, gender, availability. Missing information stays None/''.
"""
from __future__ import annotations

from scraper.models.watch import NormalizedWatch, RawProduct
from scraper.parsers.dimensions import (
    parse_case_diameter,
    parse_case_thickness,
    parse_lug_to_lug,
    parse_two_dimensions,
)
from scraper.parsers.materials import normalize_color, normalize_material
from scraper.parsers.movement import normalize_movement
from scraper.parsers.price import normalize_currency, parse_price
from scraper.parsers.strings import clean
from scraper.parsers.water import water_resistance_to_meters

GENDER_LABELS = {
    'men': 'men', "men's": 'men', 'mens': 'men', 'male': 'men', 'homme': 'men',
    'women': 'women', "women's": 'women', 'womens': 'women', 'female': 'women',
    'ladies': 'women', 'femme': 'women',
    'unisex': 'unisex', 'boys': 'men',
}

AVAILABILITY_MAP = {
    'in stock': 'in_stock', 'in-stock': 'in_stock', 'available': 'in_stock',
    'ready to ship': 'in_stock', 'new': 'in_stock',
    'pre-order': 'pre_order', 'preorder': 'pre_order', 'pre order': 'pre_order',
    'backorder': 'pre_order', 'back-ordered': 'pre_order',
    'out of stock': 'out_of_stock', 'out-of-stock': 'out_of_stock', 'sold out': 'out_of_stock',
    'discontinued': 'discontinued',
    'call for availability': 'pre_order',
}


def normalize_availability(text: str | None) -> str:
    t = clean(text).lower()
    if not t:
        return ''
    return AVAILABILITY_MAP.get(t, '')


def normalize_gender(text: str | None) -> str:
    t = clean(text).lower()
    return GENDER_LABELS.get(t, '')


def normalize_watch(raw: RawProduct) -> NormalizedWatch:
    data = raw.model_dump()
    if data.get('currency') is None:
        data['currency'] = ''
    n = NormalizedWatch(**data)

    # --- price & currency ---
    if raw.price is not None:
        amount, currency = parse_price(str(raw.price))
        if amount is not None:
            n.price = amount
        if currency:
            n.currency = currency
    if raw.original_price is not None:
        original, _ = parse_price(str(raw.original_price))
        n.original_price = original

    # --- movement ---
    fam, mtype = normalize_movement(raw.movement)
    if fam:
        n.movement = fam
        n.movement_type = mtype

    # --- dimensions (numeric atoms + display strings) ---
    if raw.case_diameter:
        n.case_diameter_mm = parse_case_diameter(raw.case_diameter)
        if n.case_diameter_mm is None:
            w, _ = parse_two_dimensions(raw.case_diameter)
            n.case_diameter_mm = w
        if n.case_diameter_mm is not None and not raw.case_diameter.lower().endswith('mm'):
            n.case_diameter = f'{n.case_diameter_mm:g}mm'
        else:
            n.case_diameter = clean(raw.case_diameter)
    if raw.case_thickness:
        n.case_thickness_mm = parse_case_thickness(raw.case_thickness)
        n.case_thickness = clean(raw.case_thickness)
    if raw.lug_to_lug:
        n.lug_to_lug_mm = parse_lug_to_lug(raw.lug_to_lug)
        n.lug_to_lug = clean(raw.lug_to_lug)

    # --- water resistance ---
    if raw.water_resistance:
        n.water_resistance_m = water_resistance_to_meters(raw.water_resistance)
        n.water_resistance = clean(raw.water_resistance)

    # --- materials & colors ---
    n.case_material = normalize_material(raw.case_material)
    n.dial_color = normalize_color(raw.dial_color)
    n.strap_material = normalize_material(raw.strap_material or raw.bracelet_material)
    n.bracelet_material = normalize_material(raw.bracelet_material or raw.strap_material)
    n.bezel = clean(raw.bezel)
    n.crystal = clean(raw.crystal)
    n.clasp = clean(raw.clasp)
    n.case_shape = clean(raw.case_shape)

    # --- availability / gender ---
    raw_avail = clean(raw.availability)
    if raw_avail:
        n.availability = normalize_availability(raw_avail)
    elif raw.in_stock is not None:
        n.availability = 'in_stock' if raw.in_stock else 'out_of_stock'
    if raw.gender:
        n.gender = normalize_gender(raw.gender) or 'unisex'

    n.year = clean(raw.year)
    n.limited_edition = bool(raw.limited_edition)
    n.warranty = clean(raw.warranty)
    n.country = clean(raw.country)
    n.category = clean(raw.category)
    n.functions = [clean(f) for f in raw.functions if clean(f)]
    n.description = clean(raw.description)
    n.title = clean(raw.title or f'{raw.brand} {raw.model}'.strip())

    # Keep raw source refs
    n.reference_number = clean(raw.reference_number)
    n.sku = clean(raw.sku)
    n.model = clean(raw.model)
    n.collection = clean(raw.collection) if raw.collection else None
    n.caliber = clean(raw.caliber)
    n.power_reserve = clean(raw.power_reserve)

    return n
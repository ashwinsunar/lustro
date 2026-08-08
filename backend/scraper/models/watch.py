"""Pipeline data models (pydantic).

`RawProduct` is what a source adapter extracts (source-authoritative, un-normalized).
`NormalizedWatch` is the canonical, validated shape that maps 1:1 onto the Lustro
`watches.Watch` model. `SourceSkuRef` identifies a listing within a source.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional, Union

from pydantic import BaseModel, Field


class RawProduct(BaseModel):
    """Everything a single listing page yields, pre-normalization."""

    source: str = Field(description='source slug, e.g. "watches_of_switzerland"')
    source_product_id: str = ''
    source_url: str = ''
    brand: str = ''
    model: str = ''
    collection: str | None = None
    reference_number: str = ''
    sku: str = ''
    title: str = ''
    description: str = ''
    price: float | str | None = None
    original_price: float | str | None = None
    currency: str | None = None
    availability: str = ''
    in_stock: bool | None = None
    image_url: str = ''
    additional_images: list[str] = Field(default_factory=list)
    movement: str = ''
    movement_type: str = ''
    caliber: str = ''
    power_reserve: str = ''
    case_diameter: str = ''
    case_thickness: str = ''
    lug_to_lug: str = ''
    case_material: str = ''
    case_shape: str = ''
    crystal: str = ''
    bezel: str = ''
    dial_color: str = ''
    strap_material: str = ''
    bracelet_material: str = ''
    clasp: str = ''
    water_resistance: str = ''
    functions: list[str] = Field(default_factory=list)
    gender: str = ''
    year: str = ''
    limited_edition: bool = False
    warranty: str = ''
    country: str = ''
    category: str = ''  # source category label (e.g. "Diver", "Chronograph")
    crawled_at: datetime = Field(default_factory=datetime.utcnow)

    # image provenance (defaults applied by SourceAdapter.run)
    image_license: str = ''
    image_attribution: str = ''


class NormalizedWatch(RawProduct):
    """Fully normalized watch: every field maps to the Lustro Watch model.

    Each text field is trimmed/cleaned; numeric fields converted to display
    strings plus numeric atoms (case_diameter_mm etc.). Absence == None,
    nothing is ever invented.
    """

    # numeric/structured atoms (display strings are kept in RawProduct fields)
    case_diameter_mm: Optional[float] = None
    case_thickness_mm: Optional[float] = None
    lug_to_lug_mm: Optional[float] = None
    water_resistance_m: Optional[int] = None
    price: Optional[Union[float, str]] = None
    original_price: Optional[Union[float, str]] = None
    currency: str = 'CHF'

    # normalized enums
    movement: str = 'automatic'  # automatic | manual | quartz | spring_drive
    movement_type: str = ''  # mechanical | quartz | solar | hybrid
    gender: str = 'unisex'    # men | women | unisex
    availability: str = ''    # in_stock | pre_order | out_of_stock | discontinued | ''
    case_shape: str = ''
    functions: list[str] = Field(default_factory=list)

    # quality flags produced by the validator
    quality: str = 'ok'  # ok | partial | flagged
    warnings: list[str] = Field(default_factory=list)


class SourceSink:
    """Immutable identity of a product within a source (used for stable upserts)."""

    __slots__ = ('source', 'product_id', 'url')

    def __init__(self, source: str, product_id: str, url: str) -> None:
        self.source = source
        self.product_id = product_id
        self.url = url

    def __eq__(self, other: object) -> bool:
        return (
            isinstance(other, SourceSink)
            and self.source == other.source
            and self.product_id == other.product_id
        )

    def __hash__(self) -> int:
        return hash((self.source, self.product_id))
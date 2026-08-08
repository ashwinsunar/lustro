from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator

class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='brands/', null=True, blank=True)
    founded_year = models.IntegerField(null=True, blank=True)
    country = models.CharField(max_length=100, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
        
    def __str__(self):
        return self.name

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
        
    def __str__(self):
        return self.name

class Collection(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to='collections/', null=True, blank=True)
    featured = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
        
    def __str__(self):
        return self.name

class Watch(models.Model):
    MOVEMENT_CHOICES = (
        ('automatic', 'Automatic'),
        ('manual', 'Manual'),
        ('quartz', 'Quartz'),
        ('spring_drive', 'Spring Drive'),
    )
    MOVEMENT_TYPE_CHOICES = (
        ('', 'Unknown'),
        ('mechanical', 'Mechanical'),
        ('quartz', 'Quartz'),
        ('solar', 'Solar'),
        ('hybrid', 'Hybrid'),
    )

    GENDER_CHOICES = (
        ('men', 'Men'),
        ('women', 'Women'),
        ('unisex', 'Unisex'),
    )

    AVAILABILITY_CHOICES = (
        ('', 'Unknown'),
        ('in_stock', 'In stock'),
        ('pre_order', 'Pre-order'),
        ('out_of_stock', 'Out of stock'),
        ('discontinued', 'Discontinued'),
    )

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    brand = models.ForeignKey(Brand, related_name='watches', on_delete=models.CASCADE)
    category = models.ForeignKey(Category, related_name='watches', on_delete=models.SET_NULL, null=True)
    collection = models.ForeignKey(Collection, related_name='watches', on_delete=models.SET_NULL, null=True, blank=True)

    price = models.DecimalField(max_digits=12, decimal_places=2)
    discount_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='CHF')

    reference_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    sku = models.CharField(max_length=120, blank=True)
    movement = models.CharField(max_length=50, choices=MOVEMENT_CHOICES)
    movement_type = models.CharField(max_length=50, choices=MOVEMENT_TYPE_CHOICES, blank=True)
    caliber = models.CharField(max_length=100, blank=True)
    power_reserve = models.CharField(max_length=50, blank=True)  # e.g. "72 hours"
    case_size = models.CharField(max_length=50)  # e.g. "41mm" (display string)
    case_shape = models.CharField(max_length=100, blank=True)
    case_diameter_mm = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    case_thickness_mm = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    lug_to_lug_mm = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    case_material = models.CharField(max_length=100)
    crystal = models.CharField(max_length=100, blank=True)
    bezel = models.CharField(max_length=100, blank=True)
    dial_color = models.CharField(max_length=100)
    strap_material = models.CharField(max_length=100)
    bracelet_material = models.CharField(max_length=100, blank=True)
    clasp = models.CharField(max_length=100, blank=True)
    water_resistance = models.CharField(max_length=50)  # display string e.g. "300m"
    water_resistance_m = models.IntegerField(null=True, blank=True)
    functions = models.TextField(blank=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default='unisex')
    year = models.CharField(max_length=20, blank=True)
    limited_edition = models.BooleanField(default=False)
    warranty_period = models.CharField(max_length=50, default='2 Years')
    country = models.CharField(max_length=100, blank=True)  # market/origin if known

    description = models.TextField()

    is_featured = models.BooleanField(default=False)
    is_trending = models.BooleanField(default=False)
    is_new_arrival = models.BooleanField(default=False)
    is_best_seller = models.BooleanField(default=False)

    in_stock = models.BooleanField(default=True)
    stock_count = models.IntegerField(default=10)
    availability = models.CharField(max_length=20, choices=AVAILABILITY_CHOICES, blank=True)

    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    review_count = models.IntegerField(default=0)

    # ---- Source & licensing (ingestion) ----
    source = models.CharField(max_length=60, blank=True, db_index=True)  # primary/active source slug, e.g. "watches_of_switzerland"
    source_product_id = models.CharField(max_length=200, blank=True, db_index=True)
    source_url = models.URLField(blank=True)
    sources = models.TextField(blank=True)  # comma-separated list of sources that supplied this catalogue row
    image_url = models.URLField(blank=True)  # original retailer image URL (never downloaded/redistributed)
    image_license = models.CharField(max_length=40, blank=True)
    image_attribution = models.CharField(max_length=200, blank=True)
    data_quality = models.CharField(max_length=16, default='ok')  # ok | partial | flagged

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['source', 'source_product_id'],
                name='uniq_watch_source_product',
                condition=~models.Q(source=''),
            ),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.brand.name} {self.title} {self.reference_number}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.brand.name} - {self.title}"

class WatchImage(models.Model):
    watch = models.ForeignKey(Watch, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='watches/')
    is_primary = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'id']
        
    def __str__(self):
        return f"Image for {self.watch.title}"

class WatchVideo(models.Model):
    watch = models.ForeignKey(Watch, related_name='videos', on_delete=models.CASCADE)
    video = models.FileField(upload_to='watches/videos/')
    thumbnail = models.ImageField(upload_to='watches/video_thumbnails/', null=True, blank=True)
    title = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return f"Video for {self.watch.title}"


class Review(models.Model):
    watch = models.ForeignKey(Watch, related_name='reviews', on_delete=models.CASCADE)
    user = models.ForeignKey(
        'users.User',
        related_name='reviews',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    first_name = models.CharField(max_length=80)
    rating = models.PositiveIntegerField(default=5)
    title = models.CharField(max_length=120, blank=True)
    body = models.TextField()
    is_verified_purchase = models.BooleanField(default=False)
    helpful_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['watch', 'user'],
                name='unique_product_review_per_user',
                condition=models.Q(user__isnull=False),
            )
        ]

    def __str__(self):
        return f"{self.first_name} · {self.watch.title} ({self.rating}★)"


class StockNotify(models.Model):
    watch = models.ForeignKey(Watch, related_name='stock_notifies', on_delete=models.CASCADE)
    email = models.EmailField()
    name = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['watch', 'email'],
                name='unique_stock_notify_per_email',
            )
        ]

    def __str__(self):
        return f"{self.email} · {self.watch.title}"


class IngestRun(models.Model):
    """Audit log of one source ingestion run (Phase 16)."""

    RUN_STATUS = (
        ('ok', 'OK'),
        ('partial', 'Partial'),
        ('failed', 'Failed'),
    )

    source = models.CharField(max_length=60, db_index=True)
    status = models.CharField(max_length=10, choices=RUN_STATUS, default='ok')
    started_at = models.DateTimeField()
    finished_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.FloatField(default=0.0)
    requests = models.PositiveIntegerField(default=0)
    products_found = models.PositiveIntegerField(default=0)
    products_parsed = models.PositiveIntegerField(default=0)
    inserted = models.PositiveIntegerField(default=0)
    updated = models.PositiveIntegerField(default=0)
    duplicates = models.PositiveIntegerField(default=0)
    invalid = models.PositiveIntegerField(default=0)
    failed = models.PositiveIntegerField(default=0)
    dry_run = models.BooleanField(default=False)
    errors = models.TextField(blank=True)  # newline-separated
    note = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['source', '-started_at']),
        ]

    def __str__(self):
        return f'{self.source} {self.status} {self.started_at:%Y-%m-%d %H:%M}'

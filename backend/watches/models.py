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
    
    GENDER_CHOICES = (
        ('men', 'Men'),
        ('women', 'Women'),
        ('unisex', 'Unisex'),
    )
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    brand = models.ForeignKey(Brand, related_name='watches', on_delete=models.CASCADE)
    category = models.ForeignKey(Category, related_name='watches', on_delete=models.SET_NULL, null=True)
    collection = models.ForeignKey(Collection, related_name='watches', on_delete=models.SET_NULL, null=True, blank=True)
    
    price = models.DecimalField(max_digits=12, decimal_places=2)
    discount_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    reference_number = models.CharField(max_length=100, unique=True)
    movement = models.CharField(max_length=50, choices=MOVEMENT_CHOICES)
    case_size = models.CharField(max_length=50) # e.g. "41mm"
    case_material = models.CharField(max_length=100)
    dial_color = models.CharField(max_length=100)
    strap_material = models.CharField(max_length=100)
    water_resistance = models.CharField(max_length=50)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default='unisex')
    warranty_period = models.CharField(max_length=50, default='2 Years')
    
    description = models.TextField()
    
    is_featured = models.BooleanField(default=False)
    is_trending = models.BooleanField(default=False)
    is_new_arrival = models.BooleanField(default=False)
    is_best_seller = models.BooleanField(default=False)
    
    in_stock = models.BooleanField(default=True)
    stock_count = models.IntegerField(default=10)
    
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    review_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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

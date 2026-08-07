from django.contrib import admin
from .models import Brand, Category, Collection, Watch, WatchImage, WatchVideo, Review, StockNotify

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'country', 'founded_year')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'country')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'featured')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

class WatchImageInline(admin.TabularInline):
    model = WatchImage
    extra = 1

@admin.register(Watch)
class WatchAdmin(admin.ModelAdmin):
    list_display = ('title', 'brand', 'category', 'price', 'in_stock', 'is_featured', 'is_trending')
    list_filter = ('brand', 'category', 'movement', 'in_stock', 'is_featured', 'is_trending', 'is_new_arrival', 'is_best_seller')
    search_fields = ('title', 'reference_number', 'brand__name')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [WatchImageInline]
    autocomplete_fields = ('brand', 'category', 'collection')

@admin.register(WatchImage)
class WatchImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'watch', 'is_primary', 'order')

@admin.register(WatchVideo)
class WatchVideoAdmin(admin.ModelAdmin):
    list_display = ('id', 'watch', 'title')

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'watch', 'rating', 'is_verified_purchase', 'created_at')
    list_filter = ('rating', 'is_verified_purchase')
    search_fields = ('first_name', 'watch__title', 'body')

@admin.register(StockNotify)
class StockNotifyAdmin(admin.ModelAdmin):
    list_display = ('email', 'watch', 'name', 'created_at')
    search_fields = ('email', 'watch__title')
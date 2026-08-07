from rest_framework import serializers
from .models import Brand, Category, Collection, Watch, WatchImage, WatchVideo

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = '__all__'

class WatchImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = WatchImage
        fields = ['id', 'image', 'is_primary', 'order']

class WatchVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = WatchVideo
        fields = ['id', 'video', 'thumbnail', 'title']

class WatchListSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    images = WatchImageSerializer(many=True, read_only=True)

    class Meta:
        model = Watch
        fields = [
            'id', 'title', 'slug', 'brand', 'category', 'price', 'discount_price',
            'movement', 'gender', 'in_stock', 'is_featured', 'is_trending',
            'is_new_arrival', 'is_best_seller', 'rating', 'review_count', 'images'
        ]

class WatchDetailSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    collection = CollectionSerializer(read_only=True)
    images = WatchImageSerializer(many=True, read_only=True)
    videos = WatchVideoSerializer(many=True, read_only=True)

    class Meta:
        model = Watch
        fields = '__all__'

from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.viewsets import ViewSet
from .models import Brand, Category, Collection, Watch, WatchImage, WatchVideo, Review, StockNotify

class BrandSerializer(serializers.ModelSerializer):
    watch_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Brand
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    watch_count = serializers.IntegerField(read_only=True, default=0)

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
            'currency', 'movement', 'movement_type', 'gender', 'in_stock', 'availability',
            'source', 'sources', 'data_quality', 'is_featured', 'is_trending',
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

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = [
            'id', 'user', 'first_name', 'rating', 'title', 'body',
            'is_verified_purchase', 'helpful_count', 'created_at',
        ]
        read_only_fields = ('is_verified_purchase', 'helpful_count', 'user')
        extra_kwargs = {'first_name': {'required': False}}

class ReviewViewSet(ViewSet):
    def list(self, request, watch_slug):
        from .models import Watch
        watch = Watch.objects.filter(slug=watch_slug).first()
        if watch is None:
            return Response({'detail': 'Not found.'}, status=404)
        reviews = watch.reviews.all()
        return Response(ReviewSerializer(reviews, many=True).data)

    def create(self, request, watch_slug):
        from .models import Watch
        watch = Watch.objects.filter(slug=watch_slug).first()
        if watch is None:
            return Response({'detail': 'Not found.'}, status=404)
        user = request.user if request.user.is_authenticated else None
        if user and watch.reviews.filter(user=user).exists():
            return Response({'detail': 'You have already reviewed this timepiece.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ReviewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        first_name = (user.first_name if user else request.data.get('first_name', 'A Collector')).strip() or 'A Collector'
        review = serializer.save(user=user, watch=watch, first_name=first_name)
        return Response(ReviewSerializer(review).data, status=201)

class StockNotifySerializer(serializers.ModelSerializer):
    class Meta:
        model = StockNotify
        fields = ['id', 'email', 'name', 'created_at']
        extra_kwargs = {'name': {'required': False}}

class StockNotifyView(ViewSet):
    permission_classes = [AllowAny]

    def create(self, request, watch_slug):
        from .models import Watch
        try:
            watch = Watch.objects.get(slug=watch_slug)
        except Watch.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        serializer = StockNotifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        notify, created = StockNotify.objects.get_or_create(
            watch=watch,
            email=serializer.validated_data['email'].lower(),
            defaults={'name': serializer.validated_data.get('name', '')},
        )
        if created:
            return Response({'detail': 'We will notify you when this timepiece is back in stock.'}, status=201)
        return Response({'detail': 'You are already on the waitlist for this timepiece.'}, status=200)
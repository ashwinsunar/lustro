from django.db.models import Count
from rest_framework import viewsets, filters
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django_filters.filters import BaseCSVFilter
import django_filters
from .models import Brand, Category, Collection, Watch
from .serializers import BrandSerializer, CategorySerializer, CollectionSerializer, WatchListSerializer, WatchDetailSerializer

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

class SlugInFilter(BaseCSVFilter, django_filters.CharFilter):
    pass

class WatchFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr='lte')
    brand = django_filters.CharFilter(field_name='brand__slug')
    category = django_filters.CharFilter(field_name='category__slug')
    brands = SlugInFilter(field_name='brand__slug', lookup_expr='in')
    categories = SlugInFilter(field_name='category__slug', lookup_expr='in')
    movements = SlugInFilter(field_name='movement', lookup_expr='in')
    genders = SlugInFilter(field_name='gender', lookup_expr='in')
    on_sale = django_filters.BooleanFilter(field_name='discount_price', lookup_expr='isnull', exclude=True)
    featured = django_filters.BooleanFilter(field_name='is_featured')
    trending = django_filters.BooleanFilter(field_name='is_trending')
    new_arrival = django_filters.BooleanFilter(field_name='is_new_arrival')
    best_seller = django_filters.BooleanFilter(field_name='is_best_seller')
    exclude = django_filters.NumberFilter(method='filter_exclude')

    def filter_exclude(self, queryset, name, value):
        return queryset.exclude(pk=value)

    class Meta:
        model = Watch
        fields = ['is_featured', 'is_trending', 'is_new_arrival', 'is_best_seller', 'in_stock', 'movement', 'gender']

class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.annotate(watch_count=Count('watches')).order_by('name')
    serializer_class = BrandSerializer
    lookup_field = 'slug'

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.annotate(watch_count=Count('watches')).order_by('name')
    serializer_class = CategorySerializer
    lookup_field = 'slug'

class CollectionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer
    lookup_field = 'slug'

class WatchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Watch.objects.all().select_related('brand', 'category', 'collection').prefetch_related('images').order_by('-created_at')
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = WatchFilter
    search_fields = ['title', 'brand__name', 'reference_number', 'description']
    ordering_fields = ['price', 'created_at', 'rating', 'review_count', 'title']
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return WatchDetailSerializer
        return WatchListSerializer

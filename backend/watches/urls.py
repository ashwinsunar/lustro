from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BrandViewSet, CategoryViewSet, CollectionViewSet, WatchViewSet
from .serializers import ReviewViewSet, StockNotifyView

router = DefaultRouter()
router.register(r'brands', BrandViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'collections', CollectionViewSet)
router.register(r'watches', WatchViewSet)
router.register(r'watches/(?P<watch_slug>[^/.]+)/reviews', ReviewViewSet, basename='reviews')
router.register(r'watches/(?P<watch_slug>[^/.]+)/notify', StockNotifyView, basename='stock-notify')

urlpatterns = [
    path('', include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BrandViewSet, CategoryViewSet, CollectionViewSet, WatchViewSet

router = DefaultRouter()
router.register(r'brands', BrandViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'collections', CollectionViewSet)
router.register(r'watches', WatchViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

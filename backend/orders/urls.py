from django.urls import path
from .views import OrderListCreateView, OrderDetailView, CouponValidateView

urlpatterns = [
    path('orders/', OrderListCreateView.as_view(), name='order-list-create'),
    path('orders/coupon/<str:code>/', CouponValidateView.as_view(), name='coupon-validate'),
    path('orders/<str:order_number>/', OrderDetailView.as_view(), name='order-detail'),
]
from django.urls import path
from .views import OrderListCreateView, OrderDetailView, CouponValidateView, CancelOrderView

urlpatterns = [
    path('orders/', OrderListCreateView.as_view(), name='order-list-create'),
    path('orders/coupon/<str:code>/', CouponValidateView.as_view(), name='coupon-validate'),
    path('orders/<str:order_number>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<str:order_number>/cancel/', CancelOrderView.as_view(), name='order-cancel'),
]
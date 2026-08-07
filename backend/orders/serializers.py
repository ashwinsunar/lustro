from rest_framework import serializers
from .models import Order, OrderItem, Coupon


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ['id', 'code', 'discount_percent']


class OrderItemSerializer(serializers.ModelSerializer):
    watch = serializers.IntegerField(source='watch_id', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'watch', 'title', 'brand_name', 'image', 'quantity', 'unit_price', 'total_price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'order_number', 'status', 'payment_method', 'payment_status',
            'subtotal', 'discount', 'shipping_fee', 'total',
            'full_name', 'email', 'phone_number', 'address_line', 'city',
            'postal_code', 'country', 'gift_wrapping', 'notes',
            'items', 'created_at',
        ]
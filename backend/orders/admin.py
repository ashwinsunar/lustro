from django.contrib import admin
from .models import Order, OrderItem, Coupon


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('title', 'brand_name', 'quantity', 'unit_price', 'total_price')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user', 'status', 'payment_method', 'payment_status', 'total', 'created_at')
    list_filter = ('status', 'payment_method', 'payment_status')
    search_fields = ('order_number', 'user__email', 'full_name')
    readonly_fields = ('order_number', 'subtotal', 'discount', 'shipping_fee', 'total', 'created_at', 'updated_at')
    inlines = [OrderItemInline]

    def has_change_permission(self, request, obj=None):
        return True


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'title', 'watch', 'quantity', 'unit_price', 'total_price')
    search_fields = ('order__order_number', 'title', 'brand_name')
    readonly_fields = ('order', 'title', 'brand_name', 'watch', 'quantity', 'unit_price', 'total_price')


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_percent', 'active', 'expires_at')
    list_filter = ('active',)
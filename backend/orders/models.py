import secrets
from django.conf import settings
from django.db import models, transaction
from django.db.models import F
from watches.models import Watch


class Coupon(models.Model):
    code = models.CharField(max_length=30, unique=True)
    discount_percent = models.PositiveIntegerField(default=10)
    active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.code} (-{self.discount_percent}%)"


class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )
    PAYMENT_CHOICES = (
        ('card', 'Credit Card'),
        ('cod', 'Cash on Delivery'),
    )
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    )

    order_number = models.CharField(max_length=20, unique=True, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='orders',
        on_delete=models.CASCADE,
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')

    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    full_name = models.CharField(max_length=120)
    email = models.EmailField()
    phone_number = models.CharField(max_length=30, blank=True)
    address_line = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, default='Switzerland')

    gift_wrapping = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = 'LST-' + secrets.token_hex(3).upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order_number} — {self.user.email}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    watch = models.ForeignKey(Watch, related_name='order_items', on_delete=models.PROTECT, null=True)
    title = models.CharField(max_length=200)
    brand_name = models.CharField(max_length=100)
    image = models.CharField(max_length=255, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} × {self.title}"


def place_order(user, items, coupon, payment_method, shipping, gift_wrapping=False, notes=''):
    with transaction.atomic():
        order = Order.objects.create(
            user=user,
            payment_method=payment_method,
            full_name=shipping['full_name'],
            email=shipping['email'],
            phone_number=shipping.get('phone_number', ''),
            address_line=shipping['address_line'],
            city=shipping['city'],
            postal_code=shipping.get('postal_code', ''),
            country=shipping.get('country', 'Switzerland'),
            gift_wrapping=gift_wrapping,
            notes=notes,
            payment_status='paid' if payment_method == 'card' else 'pending',
        )

        subtotal = 0
        for entry in items:
            watch = Watch.objects.select_for_update().get(pk=entry['watch_id'])
            if not watch.in_stock or watch.stock_count < entry['quantity']:
                raise OrderError(f"'{watch.title}' is no longer available in the requested quantity.")
            unit_price = watch.discount_price if watch.discount_price else watch.price
            line_total = round(unit_price * entry['quantity'], 2)
            subtotal += line_total
            OrderItem.objects.create(
                order=order,
                watch=watch,
                title=watch.title,
                brand_name=watch.brand.name,
                image=(watch.images.first().image.name if watch.images.first() else ''),
                quantity=entry['quantity'],
                unit_price=unit_price,
                total_price=line_total,
            )
            watch.stock_count = watch.stock_count - entry['quantity']
            if watch.stock_count <= 0:
                watch.in_stock = False
            watch.save(update_fields=['stock_count', 'in_stock'])

        discount = 0
        if coupon:
            discount = round(subtotal * coupon.discount_percent / 100, 2)

        order.subtotal = round(subtotal, 2)
        order.discount = discount
        order.shipping_fee = 0
        order.total = round(subtotal - discount + order.shipping_fee, 2)
        order.save(update_fields=['subtotal', 'discount', 'shipping_fee', 'total'])
        return order


class OrderError(Exception):
    pass
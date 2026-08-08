from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Order, Coupon, place_order, OrderError
from .serializers import OrderSerializer, CouponSerializer


class OrderListCreateView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        orders = Order.objects.filter(user=request.user).prefetch_related('items')
        return Response(OrderSerializer(orders, many=True).data)

    def post(self, request):
        data = request.data
        items = data.get('items') or []
        shipping = data.get('shipping') or {}
        if not items:
            return Response({'items': ['At least one item is required.']}, status=status.HTTP_400_BAD_REQUEST)
        required = ('full_name', 'email', 'address_line', 'city')
        missing = [k for k in required if not shipping.get(k)]
        if missing:
            return Response({'shipping': [f'{k} is required.' for k in missing]}, status=status.HTTP_400_BAD_REQUEST)

        coupon = None
        coupon_code = (data.get('coupon_code') or '').strip()
        if coupon_code:
            coupon = Coupon.objects.filter(
                code__iexact=coupon_code, active=True,
                expires_at__isnull=True,
            ).first() or Coupon.objects.filter(
                code__iexact=coupon_code, active=True,
                expires_at__gt=timezone.now(),
            ).first()
            if coupon is None:
                return Response({'coupon_code': ['Invalid or expired coupon.']}, status=status.HTTP_400_BAD_REQUEST)

        payment_method = data.get('payment_method', 'card')
        if payment_method not in ('card', 'cod'):
            return Response({'payment_method': ['Invalid payment method.']}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = place_order(
                user=request.user,
                items=items,
                coupon=coupon,
                payment_method=payment_method,
                shipping=shipping,
                gift_wrapping=bool(data.get('gift_wrapping')),
                notes=data.get('notes', ''),
            )
        except OrderError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Order.DoesNotExist:
            return Response({'detail': 'One of the items could not be found.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, order_number):
        order = Order.objects.filter(
            order_number=order_number, user=request.user,
        ).prefetch_related('items').first()
        if order is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order).data)


class CouponValidateView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, code):
        coupon = Coupon.objects.filter(code__iexact=code, active=True).first()
        if coupon is None:
            return Response({'valid': False, 'detail': 'Invalid coupon code.'}, status=status.HTTP_404_NOT_FOUND)
        if coupon.expires_at and coupon.expires_at < timezone.now():
            return Response({'valid': False, 'detail': 'This coupon has expired.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(CouponSerializer(coupon).data)


class CancelOrderView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, order_number):
        order = Order.objects.filter(order_number=order_number, user=request.user).first()
        if order is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if order.status not in ('pending', 'confirmed'):
            return Response(
                {'detail': f'An order in "{order.status}" state cannot be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order.cancel()
        return Response(OrderSerializer(order).data)
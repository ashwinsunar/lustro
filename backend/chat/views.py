import re
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Conversation, ChatMessage, Appointment
from .serializers import AppointmentSerializer
from watches.models import Watch, Brand
from watches.serializers import _media_url

def _find_brand(text):
    low = text.lower()
    for name in sorted(Brand.objects.values_list('name', flat=True), key=len, reverse=True):
        if name.lower() in low or name.lower().replace(' ', '') in low:
            return name
    return None

def _parse_budget(text):
    low = text.lower()
    if 'under' in low or 'below' in low or 'less than' in low:
        pass
    amounts = re.findall(r'(?:under|below|less than|max|around|about|up to)?\s*(\d+(?:\.\d+)?)\s*(k|thousand|k francs|k chf)?', low)
    for raw, unit in reversed(amounts):
        try:
            val = float(raw)
        except ValueError:
            continue
        if unit and unit.startswith('k'):
            val *= 1000
        if val >= 100:
            return val
    return None

def _style_tags(text):
    low = text.lower()
    tags = []
    if any(k in low for k in ['diver', 'dive', 'underwater', 'waterproof']):
        tags.append('Diver')
    if any(k in low for k in ['dress', 'formal', 'suit', 'black tie', 'elegant', 'classic']):
        tags.append('Dress')
    if any(k in low for k in ['chronograph', 'racing', 'sport', 'tool']):
        tags.append('Chronograph')
    if any(k in low for k in ['gmt', 'travel', 'timezone', 'two time', 'world time']):
        tags.append('GMT')
    if any(k in low for k in ['automatic', 'mechanical', 'self-winding']):
        tags.append('automatic')
    if 'quartz' in low:
        tags.append('quartz')
    return tags

def _format(w):
    price = int(w.price)
    return (f"{w.brand.name} {w.title} · {w.case_size} · {w.movement.title()} · "
            f"Rs {price:,} · {w.water_resistance}m")

def _pick(w):
    img = w.images.filter(is_primary=True).first() or w.images.first()
    return {
        'title': f"{w.brand.name} {w.title}",
        'slug': w.slug,
        'price': f"Rs {int(w.price):,}",
        'image': _media_url(img.image) if img else '',
    }

def _reply(message):
    low = message.lower()
    words = len(message.split())

    if any(k in low for k in ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening']) and words <= 4:
        return ("Hello! Welcome to Lustro, your private boutique concierge. Ask me for a "
                "recommendation by brand, budget, or style — for example: "
                "“Recommend an automatic diver under 8,000” or “Tell me about JLC watches.”"), []

    brand = _find_brand(message)
    budget = _parse_budget(message)
    tags = _style_tags(message)
    wants_rec = any(k in low for k in ['recommend', 'suggest', 'advise', 'what should', 'what to', 'looking for', 'i want', 'i need', 'gift'])

    qs = Watch.objects.select_related('brand', 'category').all()
    if brand:
        qs = qs.filter(brand__name=brand)
    if budget:
        qs = qs.filter(price__lte=budget)
    cats = [t for t in tags if t in ('Diver', 'Dress', 'Chronograph', 'GMT')]
    if cats:
        qs = qs.filter(category__name__in=cats)
    if 'automatic' in tags:
        qs = qs.filter(movement='automatic')
    if 'quartz' in tags:
        qs = qs.filter(movement='quartz')

    if wants_rec or brand or budget or tags:
        picks = list(qs[:3])
        if picks:
            lead = f"For you, I would suggest" if wants_rec else f"Here's what matches"
            return f"{lead}: " + ' | '.join(_format(w) for w in picks), [_pick(w) for w in picks]
        if brand:
            return (f"We do carry {brand}, but nothing in the current stock matches your "
                    f"other criteria. Try fewer filters or ask for a different budget."), []
        return (f"Nothing in stock matches those exact criteria. "
                f"Try widening the budget or asking for a different style."), []

    if 'stock' in low or 'available' in low or 'availability' in low:
        count = Watch.objects.filter(in_stock=True).count()
        top = Watch.objects.filter(in_stock=True)[:3]
        names = ', '.join(w.title for w in top)
        return f"We currently have {count} timepieces in stock, including {names}.", []

    if 'water' in low or 'depth' in low:
        deep = Watch.objects.filter(water_resistance__gte='100')
        names = ', '.join(w.title for w in deep[:3])
        return f"Many of our divers go deep — e.g. {names}. Ask for a “diver” for a full list.", []

    if any(k in low for k in ['price', 'cost', 'how much', 'expensive']):
        cheapest = Watch.objects.order_by('price').first()
        priciest = Watch.objects.order_by('-price').first()
        return (f"Prices range from Rs {int(cheapest.price):,} for the {cheapest.title} "
                f"up to Rs {int(priciest.price):,} for the {priciest.title}."), []

    if any(k in low for k in ['contact', 'visit', 'boutique', 'store', 'location', 'appointment']):
        return ("Our boutique is open by appointment. Email ashwinsunar18@gmail.com or "
                "message us on Instagram (@10m_ashwin2) and we'll arrange a private viewing."), []

    return ("I can help you navigate our collection. Try asking for a recommendation "
            "(“a GMT under 15,000”), by brand (“Show me Cartier”), or by style (“a dress "
            "watch for my wedding”)."), []

class ChatbotView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        user_message = (request.data.get('message') or '').strip()
        if not user_message:
            return Response({"error": "Message is required"}, status=400)

        conversation_id = request.data.get('conversation_id')
        conversation = None
        if conversation_id:
            conversation = Conversation.objects.filter(id=conversation_id).first()
        if conversation is None:
            user = request.user if request.user.is_authenticated else None
            conversation = Conversation.objects.create(user=user)

        ChatMessage.objects.create(conversation=conversation, role='user', content=user_message)
        reply, picks = _reply(user_message)
        ChatMessage.objects.create(conversation=conversation, role='assistant', content=reply)

        return Response({"reply": reply, "picks": picks, "conversation_id": conversation.id})


class AppointmentView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = AppointmentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        appointment = serializer.save()
        return Response(
            {
                "id": appointment.id,
                "detail": "Appointment request received — our boutique will confirm shortly.",
            },
            status=201,
        )
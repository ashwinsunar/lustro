from django.urls import path
from .views import ChatbotView, AppointmentView

urlpatterns = [
    path('', ChatbotView.as_view(), name='chatbot'),
    path('appointments/', AppointmentView.as_view(), name='appointments'),
]

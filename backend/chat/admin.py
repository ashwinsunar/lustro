from django.contrib import admin
from .models import ChatMessage, Conversation, Appointment

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'created_at')
    search_fields = ('user__email',)

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('conversation', 'role', 'created_at')
    list_filter = ('role',)

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'date', 'preference', 'payment', 'created_at')
    list_filter = ('payment', 'preference')
    search_fields = ('full_name', 'email')
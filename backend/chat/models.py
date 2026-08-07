from django.db import models
from django.conf import settings

class Conversation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='conversations',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation {self.id}"

class ChatMessage(models.Model):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('assistant', 'Assistant'),
    )
    conversation = models.ForeignKey(
        Conversation,
        related_name='messages',
        on_delete=models.CASCADE,
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:60]}"


class Appointment(models.Model):
    PAYMENT_CHOICES = (
        ('bank', 'Bank transfer'),
        ('card', 'Card'),
    )
    full_name = models.CharField(max_length=120)
    email = models.EmailField()
    date = models.DateField(null=True, blank=True)
    preference = models.CharField(max_length=120, default='Private salon, Geneva')
    payment = models.CharField(max_length=10, choices=PAYMENT_CHOICES, default='bank')
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Appointment · {self.full_name} · {self.date or 'any date'}"
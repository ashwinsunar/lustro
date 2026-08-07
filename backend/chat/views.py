import os
from rest_framework.views import APIView
from rest_framework.response import Response

class ChatbotView(APIView):
    def post(self, request):
        user_message = request.data.get('message')
        if not user_message:
            return Response({"error": "Message is required"}, status=400)

        # Mocking the AI response since we don't have an API key in the environment yet
        bot_reply = f"I am the Lustro AI Assistant. You asked: '{user_message}'. Our concierges will assist you with our luxury timepieces shortly."
        return Response({"reply": bot_reply})

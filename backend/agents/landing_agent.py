import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

def generate_landing_response(
    message: str = "Give me today's complete health plan",
    lat: float = 19.0760,
    lon: float = 72.8777
):
    """
    Generate short, friendly wellness advice for landing page users.

    - Greetings -> very short greeting.
    - Normal questions -> 1–3 short sentences.
    - Serious symptoms -> direct suggestion to get proper care.

    Args:
        message: User's wellness question or greeting
        lat: Latitude (only used for weather-related questions)
        lon: Longitude (only used for weather-related questions)

    Returns:
        str: Short, casual wellness advice
    """
    print("Landing AI request received")
    print(f"Landing AI: processing message - '{message}'")

    message_lower = message.lower().strip()

    # 0️⃣ Handle simple greetings instantly (NO LLM CALL)
    greeting_words = ["hi", "hello", "hey", "hii", "hi!", "hello!", "hey!"]
    if message_lower in greeting_words:
        print("Landing AI: Greeting detected")
        return "Hi! How can I help you today?"

    # 1️⃣ Check for serious symptoms that need medical attention
    serious_symptoms = [
        "chest pain", "difficulty breathing", "confusion", "high fever",
        "severe bleeding", "fainting", "stroke", "heart attack", "can't breathe",
        "unconscious", "severe headache", "numbness", "paralysis"
    ]

    if any(symptom in message_lower for symptom in serious_symptoms):
        print("Landing AI: Serious symptoms detected")
        return "Your symptoms sound serious. Please log in to get proper care and see nearby clinics."

    # 2️⃣ Check if user is asking about weather-related topics
    weather_keywords = [
        "weather", "temperature", "heat", "cold", "humidity", "climate",
        "outside", "hot", "warm", "cool", "sunny", "rainy", "windy"
    ]
    is_weather_question = any(keyword in message_lower for keyword in weather_keywords)

    print("Calling Gemini Flash")

    model = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.6,
        convert_system_message_to_human=True,
    )

    # 3️⃣ Very strict system rule: ALWAYS short answers
    system_message = SystemMessage(
        content="""
You are a friendly wellness assistant for the Landing Page.

RULES (VERY IMPORTANT):
- Always reply in plain text only.
- Your response MUST be between 1 and 3 sentences.
- Keep it under about 45–50 words.
- No lists, no headings, no markdown, no numbered sections.
- If the user asks for a big / detailed / full plan, give a very short summary in 2–3 sentences and say:
  "If you want, I can share a detailed plan."
- Focus on simple guidance about sleep, skincare, hydration, stress, and general wellbeing.
- If the user's question mentions weather or climate, you may add one short weather-related tip.
- If the message sounds dangerous or life-threatening, reply in ONE sentence telling them to seek proper medical help or nearby clinics.
"""
    )

    # 4️⃣ Build human message with optional weather context
    if is_weather_question and lat != 0 and lon != 0:
        human_message = HumanMessage(
            content=f"""
User message: {message}
User location: {lat}, {lon}

Respond following the rules: 1–3 short sentences, very concise, friendly tone.
Include at most one brief weather-related tip if helpful.
"""
        )
    else:
        human_message = HumanMessage(
            content=(
                "User message: "
                + message
                + "\n\nRespond in 1–3 short sentences only. Be concise and friendly."
            )
        )

    messages = [system_message, human_message]

    try:
        response = model.invoke(messages)
        print("Landing AI response generated")
        return response.content.strip()
    except Exception as e:
        print(f"Landing AI: Error - {str(e)}")
        return (
            "Hi! I'm here to help with quick wellness tips. "
            "Ask me about sleep, stress, skin, or healthy habits."
        )

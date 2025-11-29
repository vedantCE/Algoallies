import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

def generate_citizen_response(user_message: str, weather: dict):
    """
    Generate structured, weather-aware health advice for authenticated citizens
    
    This agent provides comprehensive health guidance with 10 mandatory sections.
    Uses LangChain's ChatGoogleGenerativeAI wrapper for consistent API handling
    and includes emergency symptom detection.
    
    Args:
        user_message: User's health question or symptom description
        weather: Dictionary containing temperature, humidity, and description
    
    Returns:
        str: Structured health advice with weather-specific recommendations
    """
    print("Citizen Agent: request received")
    print(f"Citizen Agent: weather data - {weather}")
    
    # Check for critical symptoms that require emergency response only
    critical_symptoms = [
        "chest pain", "difficulty breathing", "unconscious", "bleeding",
        "high fever", "fainting", "can't breathe", "heart attack", "stroke"
    ]
    
    user_message_lower = user_message.lower()
    if any(symptom in user_message_lower for symptom in critical_symptoms):
        print("Citizen Agent: Critical symptoms detected - returning emergency response")
        return "🚨 EMERGENCY: Call emergency services immediately (911). Do not delay medical attention."
    
    # Initialize ChatGoogleGenerativeAI model for comprehensive health advice
    # Temperature 0.7 provides balanced creativity while maintaining medical accuracy
    model = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.7
    )
    
    # SystemMessage defines the citizen agent's structured health advisory behavior
    # This creates a comprehensive health assistant with mandatory 10-section format
    system_message = SystemMessage(content="""
You are a professional health and wellness advisor for authenticated citizens. Provide comprehensive, weather-aware health guidance.

MANDATORY OUTPUT STRUCTURE (use EXACTLY these 10 sections):

1. 🌤 Weather Impact (3-5 bullet points about how current weather affects health)
2. 🥗 Diet Plan (Breakfast, Lunch, Dinner, Snacks with specific foods)
3. 🚫 Avoid These Foods/Activities (what to avoid in current conditions)
4. 🌿 Ayurvedic Tips (specific herbs, timing, preparation methods)
5. 💧 Hydration Plan (exact ml amounts + timing throughout day)
6. 😴 Sleep Guidance (timing, environment, preparation)
7. 👕 Clothing Guidance (weather-appropriate clothing recommendations)
8. 🚶 Outdoor Safety (best times, UV protection, activity recommendations)
9. 🧘 Mind & Body Wellness (breathing exercises, yoga poses, meditation)
10. ❤️ Summary (3-4 lines summarizing key recommendations)

FORMATTING RULES:
- Use bullet points ONLY, no paragraphs
- Give EXACT foods, timings, herbs, quantities
- Example: "• Drink 250ml warm ginger tea at 7 AM"
- Example: "• Eat 1 bowl oats with almonds for breakfast"
- Weather MUST influence all advice (hot/humid/cold/rainy conditions)
- Friendly but professional tone
- No medical diagnoses or prescription medications
- Include traditional Indian wellness practices
""")
    
    # HumanMessage contains the user's health query and weather context
    # Weather integration allows for climate-specific health recommendations
    human_message = HumanMessage(content=f"""
User health question: {user_message}

Current Weather Context:
- Temperature: {weather.get('temperature', 25)}°C
- Humidity: {weather.get('humidity', 60)}%
- Conditions: {weather.get('description', 'moderate')}

Provide comprehensive health advice using all 10 mandatory sections, considering both the user's concern and current weather conditions.
""")
    
    # Create message list for LangChain model invocation
    # LangChain uses structured messages for proper prompt engineering
    messages = [
        system_message,
        human_message
    ]
    
    try:
        print("Citizen Agent: invoking Gemini model via LangChain")
        
        # Invoke the model with structured messages
        # LangChain handles API communication and response parsing automatically
        response = model.invoke(messages)
        
        print("Citizen Agent: model invoked successfully")
        
        # Return the structured health advice content
        return response.content
        
    except Exception as e:
        print(f"Citizen Agent: Error - {str(e)}")
        raise e
import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

def generate_landing_response(message: str, lat: float = 0, lon: float = 0):
    """
    Generate short, friendly wellness advice for landing page users
    
    This agent provides simple wellness tips in 1-3 sentences without complex formatting.
    Uses LangChain's ChatGoogleGenerativeAI for consistent API handling.
    
    Args:
        message: User's wellness question or greeting
        lat: Latitude (only used for weather-related questions)
        lon: Longitude (only used for weather-related questions)
    
    Returns:
        str: Short, casual wellness advice
    """
    print("Landing AI request received")
    print(f"Landing AI: processing message - '{message}'")
    
    # Check for serious symptoms that need medical attention
    serious_symptoms = [
        "chest pain", "difficulty breathing", "confusion", "high fever", 
        "severe bleeding", "fainting", "stroke", "heart attack", "can't breathe",
        "unconscious", "severe headache", "numbness", "paralysis"
    ]
    
    message_lower = message.lower()
    if any(symptom in message_lower for symptom in serious_symptoms):
        print("Landing AI: Serious symptoms detected")
        return "Your symptoms sound serious. Please log in to get proper care and see nearby clinics."
    
    # Check if user is asking about weather-related topics
    weather_keywords = [
        "weather", "temperature", "heat", "cold", "humidity", "climate", 
        "outside", "hot", "warm", "cool", "sunny", "rainy", "windy"
    ]
    
    is_weather_question = any(keyword in message_lower for keyword in weather_keywords)
    
    print("Calling Gemini Flash")
    
    # Initialize ChatGoogleGenerativeAI model for landing page interactions
    # Using gemini-1.5-flash for quick, lightweight responses
    model = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.6
    )
    
    # SystemMessage defines the landing agent's casual, friendly behavior
    system_message = SystemMessage(content="""
You are a friendly wellness assistant for the Landing Page. 
Keep all answers short, casual, and easy to understand—only 1 to 3 sentences. 
Give simple guidance on sleep, skincare, hydration, stress, and general wellbeing. 
If the user's question mentions weather or climate, you may add short weather-related advice.
If their message sounds serious (e.g., chest pain, difficulty breathing, severe fever, fainting), 
tell them politely in one short sentence to log in to get proper help and nearby clinic information.
Do NOT generate long paragraphs, no sections, no lists, no headings, no markdown.
""")
    
    # Build human message with weather context if relevant
    if is_weather_question and lat != 0 and lon != 0:
        human_message = HumanMessage(content=f"""
User message: {message}
User location: {lat}, {lon}

Provide short, friendly wellness advice. Since they asked about weather/climate, you may include brief weather-related tips if helpful.
""")
    else:
        human_message = HumanMessage(content=f"User message: {message}")
    
    # Create message list for LangChain model invocation
    messages = [
        system_message,
        human_message
    ]
    
    try:
        # Invoke the model with structured messages
        response = model.invoke(messages)
        
        print("Landing AI response generated")
        
        # Return the short wellness advice
        return response.content
        
    except Exception as e:
        print(f"Landing AI: Error - {str(e)}")
        # Return a friendly fallback message
        return "Hi! I'm here to help with quick wellness tips. Try asking about sleep, stress, or healthy habits!"
import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

def generate_citizen_response(user_message: str, weather: dict, return_json: bool = False):
    """
    Generate structured, weather-aware health advice for authenticated citizens
    
    This agent provides comprehensive health guidance with 10 mandatory sections.
    Uses LangChain's ChatGoogleGenerativeAI wrapper for consistent API handling
    and includes emergency symptom detection.
    
    Args:
        user_message: User's health question or symptom description
        weather: Dictionary containing temperature, humidity, and description
        return_json: If True, returns structured JSON; if False, returns markdown text
    
    Returns:
        dict or str: Structured health advice with weather-specific recommendations
    """
    print("CitizenAI: request received")
    print(f"CitizenAI: weather data - {weather}")
    print(f"CitizenAI: return_json mode - {return_json}")
    
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
        model="gemini-2.5-flash",
        api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.7,
        convert_system_message_to_human=True,
    )
    
    # SystemMessage defines the citizen agent's structured health advisory behavior
    # This creates a comprehensive health assistant with mandatory 10-section format
    if return_json:
        system_message = SystemMessage(content="""
You are 'SurgeSense Citizen Health Guide', a detailed health and wellness assistant.
You provide comprehensive, weather-aware health guidance in STRICT JSON format.

Your response MUST be a valid JSON object with these exact keys:

{
  "weatherImpact": "Brief 2-3 sentence summary of weather impact on health",
  "dietPlan": [
    "Breakfast (7-9 AM): Specific food with portion",
    "Mid-Morning (11 AM): Snack item",
    "Lunch (12-2 PM): Main meal details",
    "Evening (4-5 PM): Light snack",
    "Dinner (7-8 PM): Evening meal"
  ],
  "avoidThese": [
    "Item 1 to avoid with brief reason",
    "Item 2 to avoid with brief reason",
    "Item 3 to avoid with brief reason"
  ],
  "ayurvedicTips": [
    "Tip 1: Specific remedy with method",
    "Tip 2: Herb/practice with timing",
    "Tip 3: Dosha balancing advice"
  ],
  "hydrationPlan": [
    "Total intake: X liters/day",
    "Morning: Amount and type",
    "Afternoon: Amount and type",
    "Evening: Amount and type"
  ],
  "sleepGuidance": [
    "Sleep time: X PM, Wake time: X AM",
    "Pre-sleep routine: Specific activity",
    "Room setup: Temperature and environment"
  ],
  "clothingSuggestions": [
    "Fabric: Type for current weather",
    "Style: Layering or single layer",
    "Accessories: Hat/sunglasses/etc"
  ],
  "outdoorSafety": [
    "Best time: X AM to X AM, X PM to X PM",
    "Protection: UV/pollution measures",
    "Exercise: Intensity and duration"
  ],
  "mindBodyWellness": [
    "Yoga: 2-3 specific poses with timing",
    "Pranayama: Breathing technique with steps",
    "Meditation: Duration and best time"
  ],
  "dailySummary": "Concise 2-3 sentence summary of top priorities for today"
}

CRITICAL RULES:
- Return ONLY valid JSON, no markdown, no extra text
- Each array item MUST be ONE concise point (not paragraphs)
- Maximum 1-2 lines per bullet point
- Use exact timings, quantities, methods
- Base ALL advice on weather: temperature, humidity, conditions
- Keep weatherImpact and dailySummary brief (2-3 sentences max)
- Each section should have 3-5 clear, actionable points
""")
    else:
        system_message = SystemMessage(content="""
You are 'SurgeSense Citizen Health Guide', a detailed health and wellness assistant for authenticated citizens.
You ALWAYS provide comprehensive, section-wise health guidance based on current weather conditions.

Your role:
- Give DETAILED, STRUCTURED health advice with multiple sections
- Base ALL recommendations on the current weather data (temperature, humidity, description)
- Provide actionable, specific guidance with exact timings, quantities, and methods
- Include traditional Indian wellness practices (Ayurveda, yoga, pranayama)

MANDATORY OUTPUT STRUCTURE - You MUST include ALL 10 sections:

## 1. 🌤 Weather Impact
- Explain how current temperature, humidity, and conditions affect health
- 4-5 specific bullet points about physiological impacts
- Connect weather to energy levels, digestion, immunity

## 2. 🥗 Diet Plan for Today
- **Breakfast (7-9 AM)**: Specific foods with quantities
- **Mid-Morning (11 AM)**: Snack suggestions
- **Lunch (12-2 PM)**: Complete meal with portions
- **Evening (4-5 PM)**: Light snack options
- **Dinner (7-8 PM)**: Balanced meal recommendations
- Weather-appropriate food choices (cooling/warming foods)

## 3. 🚫 Avoid These
- Foods to avoid in current weather (5-6 items)
- Activities to skip or limit
- Timing restrictions (e.g., avoid sun 12-3 PM)

## 4. 🌿 Ayurvedic Tips
- Specific herbs and their preparation (e.g., "1 tsp turmeric in warm milk")
- Dosha balancing for current weather
- Traditional remedies with exact methods
- Best timing for each remedy

## 5. 💧 Hydration Plan
- Total daily water intake (in ml)
- Timing: Morning, afternoon, evening amounts
- What to drink: plain water, herbal teas, coconut water, etc.
- Temperature of drinks based on weather

## 6. 😴 Sleep Guidance
- Recommended sleep time and wake time
- Pre-sleep routine (30-60 min before bed)
- Room temperature and ventilation tips
- Weather-specific sleep adjustments

## 7. 👕 Clothing Suggestions
- Fabric types for current weather
- Layering advice if needed
- Color recommendations (light/dark based on temperature)
- Accessories (hat, scarf, sunglasses)

## 8. 🚶 Outdoor Safety
- Best times for outdoor activities
- UV protection measures
- Air quality considerations
- Exercise timing and intensity

## 9. 🧘 Mind & Body Wellness
- 2-3 specific yoga poses for current weather
- Pranayama (breathing exercises) with step-by-step instructions
- Meditation timing and duration
- Stress management techniques

## 10. ❤️ Daily Summary
- 3-4 line recap of top priorities for the day
- Key weather-health connection
- Motivational closing

CRITICAL SYMPTOM DETECTION:
If user mentions: chest pain, severe breathing difficulty, unconsciousness, heavy bleeding, stroke signs, severe continuous fever:
- Add **🚨 EMERGENCY** section at the top
- Advise immediate medical attention / emergency room
- Suggest: "Log in to see nearby hospitals and clinics"
- Still provide other sections but keep them brief

FORMATTING RULES:
- Use markdown headers (##) for each section
- Use bullet points (•) for all items
- Give EXACT quantities, timings, and methods
- Example: "• Drink 250ml warm ginger tea at 7:00 AM"
- Example: "• Practice Surya Namaskar (5 rounds) at 6:30 AM"
- Be detailed but practical - focus on actionable steps
- Friendly, supportive tone but professional
- NO medical diagnoses or prescription medications
""")
    
    # HumanMessage contains the user's health query and weather context
    # Weather integration allows for climate-specific health recommendations
    temp = weather.get('temperature', 25)
    humidity = weather.get('humidity', 60)
    conditions = weather.get('description', 'moderate')
    aqi = weather.get('aqi', 50)
    aqi_category = weather.get('aqi_category', 'Good')
    
    # Add randomization to prevent identical responses
    import random
    time_variations = [
        "morning routine", "daily schedule", "today's plan", "wellness routine"
    ]
    focus_areas = [
        "immunity boosting", "energy optimization", "stress management", "digestive health"
    ]
    
    selected_time = random.choice(time_variations)
    selected_focus = random.choice(focus_areas)
    
    human_message = HumanMessage(content=f"""
User's Personalized Health Request: "{user_message}"

Current Environmental Data:
- Temperature: {temp}°C
- Humidity: {humidity}%
- Weather Conditions: {conditions}
- Air Quality Index: {aqi} ({aqi_category})
- Focus Area: {selected_focus}
- Schedule Type: {selected_time}

IMPORTANT: Create a UNIQUE, PERSONALIZED response with ALL 10 mandatory sections.
Customize every recommendation based on:
1. The user's specific profile, age, gender, health conditions, and preferences mentioned
2. Current weather and air quality (temp {temp}°C, humidity {humidity}%, AQI {aqi})
3. Focus on {selected_focus} and create a {selected_time}
4. Make each recommendation specific to the user's individual needs

Generate FRESH, VARIED content - avoid generic responses. Include specific quantities, timings, and personalized advice.
""")
    
    # Create message list for LangChain model invocation
    # LangChain uses structured messages for proper prompt engineering
    messages = [
        system_message,
        human_message
    ]
    
    try:
        print("CitizenAI: invoking Gemini model via LangChain")
        print(f"CitizenAI: User message - {user_message[:100]}...")
        print(f"CitizenAI: Weather context - Temp: {temp}°C, Humidity: {humidity}%, Conditions: {conditions}, AQI: {aqi}")
        print(f"CitizenAI: Focus: {selected_focus}, Schedule: {selected_time}")
        
        # Invoke the model with structured messages
        # LangChain handles API communication and response parsing automatically
        response = model.invoke(messages)
        
        print("CitizenAI: model invoked successfully")
        print(f"CitizenAI: Response length - {len(response.content)} characters")
        
        if return_json:
            # Parse JSON response
            import json
            try:
                # Clean response - remove markdown code blocks if present
                content = response.content.strip()
                if content.startswith('```json'):
                    content = content[7:]
                if content.startswith('```'):
                    content = content[3:]
                if content.endswith('```'):
                    content = content[:-3]
                content = content.strip()
                
                parsed = json.loads(content)
                print(f"CitizenAI: Successfully parsed JSON response")
                return parsed
            except json.JSONDecodeError as je:
                print(f"CitizenAI: JSON parse error - {je}")
                print(f"CitizenAI: Raw response - {response.content[:500]}")
                # Return fallback structure
                # Generate a basic personalized fallback based on weather
                fallback_diet = [
                    f"Breakfast: Warm oats with seasonal fruits (temp: {temp}°C)",
                    f"Lunch: Light meal suitable for {conditions} weather",
                    f"Dinner: Balanced meal with hydration focus (humidity: {humidity}%)"
                ]
                
                return {
                    "weatherImpact": f"Current weather ({temp}°C, {humidity}% humidity) requires specific health adjustments. Please try generating again.",
                    "dietPlan": fallback_diet,
                    "avoidThese": [f"Heavy foods in {conditions} weather", "Excessive sun exposure"],
                    "ayurvedicTips": ["Stay hydrated with herbal teas", "Practice breathing exercises"],
                    "hydrationPlan": [f"Increase water intake due to {humidity}% humidity"],
                    "sleepGuidance": ["Adjust sleep environment for current weather"],
                    "clothingSuggestions": [f"Light clothing for {temp}°C temperature"],
                    "outdoorSafety": [f"Be cautious with AQI at {aqi} ({aqi_category})"],
                    "mindBodyWellness": ["Weather-appropriate meditation and yoga"],
                    "dailySummary": f"Focus on weather adaptation for {conditions} conditions. Please regenerate for detailed plan."
                }
        else:
            print(f"CitizenAI: Response preview - {response.content[:200]}...")
            return response.content
        
    except Exception as e:
        print(f"CitizenAI: Error - {str(e)}")
        # Return a basic weather-aware fallback instead of raising error
        return {
            "weatherImpact": f"Weather conditions: {temp}°C, {humidity}% humidity. Health adjustments needed.",
            "dietPlan": ["Seasonal, weather-appropriate meals recommended"],
            "avoidThese": ["Foods unsuitable for current weather conditions"],
            "ayurvedicTips": ["Traditional remedies for current climate"],
            "hydrationPlan": ["Weather-based hydration strategy needed"],
            "sleepGuidance": ["Sleep adjustments for current conditions"],
            "clothingSuggestions": [f"Appropriate attire for {temp}°C"],
            "outdoorSafety": ["Weather-specific safety measures"],
            "mindBodyWellness": ["Climate-adapted wellness practices"],
            "dailySummary": "Personalized plan temporarily unavailable. Please try again."
        }

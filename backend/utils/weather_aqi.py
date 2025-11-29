from dotenv import load_dotenv
import os
import requests
import json
from typing import Optional, Dict, Any

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY not found in .env - chatbot features disabled")
    GEMINI_API_KEY = None

llm = None
if GEMINI_API_KEY:
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        api_key=GEMINI_API_KEY,
        temperature=0.3,
    )

# --------- REUSE THE SAME HELPERS AS BEFORE ---------

def get_user_location() -> Optional[Dict[str, Any]]:
    try:
        resp = requests.get("https://ipapi.co/json/", timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return {
            "name": data.get("city"),
            "lat": data.get("latitude"),
            "lon": data.get("longitude"),
        }
    except Exception as e:
        print("Location lookup failed:", e)
        return None

def geocode_city(city: str) -> Optional[Dict[str, Any]]:
    url = "https://geocoding-api.open-meteo.com/v1/search"
    params = {"name": city, "count": 1, "language": "en", "format": "json"}
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    results = data.get("results") or []
    if not results:
        return None
    best = results[0]
    return {
        "name": best.get("name"),
        "lat": best.get("latitude"),
        "lon": best.get("longitude"),
    }

def get_weather(lat: float, lon: float) -> Dict[str, Any]:
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m",
        "timezone": "auto",
    }
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    return resp.json().get("current", {})

def get_air_quality(lat: float, lon: float) -> Dict[str, Any]:
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "us_aqi,european_aqi",
        "timezone": "auto",
    }
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    return resp.json().get("current", {})

def classify_aqi_us(aqi: float) -> str:
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Moderate"
    elif aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    elif aqi <= 200:
        return "Unhealthy"
    elif aqi <= 300:
        return "Very Unhealthy"
    else:
        return "Hazardous"

def line_for_location(name: str, lat: float, lon: float) -> str:
    weather = get_weather(lat, lon)
    air = get_air_quality(lat, lon)

    temp = weather.get("temperature_2m")
    aqi = air.get("us_aqi") or air.get("european_aqi")

    if temp is None or aqi is None:
        return f"{name} — data unavailable"

    category = classify_aqi_us(aqi)
    return f"{name} — {temp}°C — AQI {aqi} ({category})"

def weather_aqi_auto_line() -> str:
    loc = get_user_location()
    if not loc or not loc["lat"] or not loc["lon"]:
        return "Could not detect your location."
    return line_for_location(loc["name"], loc["lat"], loc["lon"])

def weather_aqi_city_line(city: str) -> str:
    loc = geocode_city(city)
    if not loc:
        return f"City '{city}' not found."
    return line_for_location(loc["name"], loc["lat"], loc["lon"])

# --------- "AGENT" DECISION + ANSWER CHAINS ---------

decision_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a router that decides what action to take for a user question. "
        "You have these options:\n"
        "- 'aqi_auto' : use auto-detected location AQI+weather\n"
        "- 'aqi_city' : use AQI+weather for a specific city\n"
        "- 'chat'     : normal conversation, no tools\n\n"
        "Respond ONLY in JSON like:\n"
        '{"action": "aqi_auto", "city": null}\n'
        '{"action": "aqi_city", "city": "Surat"}\n'
        '{"action": "chat", "city": null}'
    ),
    ("human", "Question: {question}")
])
decision_chain = decision_prompt | llm | StrOutputParser()

answer_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a weather and AQI assistant. "
        "If tool_result is not 'none', use it to answer briefly."
    ),
    (
        "human",
        "User question: {question}\n"
        "Tool result: {tool_result}\n\n"
        "Answer in 2 short sentences."
    )
])
answer_chain = answer_prompt | llm | StrOutputParser()

chat_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a friendly general-purpose assistant."),
    ("human", "{question}")
])
chat_chain = chat_prompt | llm | StrOutputParser()

# --------- CHAT LOOP ---------

def chat_loop():
    print("Weather & AQI Chatbot (type 'exit' to quit)\n")
    while True:
        user = input("You: ")
        if user.strip().lower() in ("exit", "quit"):
            print("Bye! 👋")
            break

        # Step 1: decide what to do
        raw_decision = decision_chain.invoke({"question": user})
        # print("DEBUG decision:", raw_decision)
        try:
            decision = json.loads(raw_decision)
        except json.JSONDecodeError:
            decision = {"action": "chat", "city": None}

        action = decision.get("action", "chat")
        city = decision.get("city")

        tool_result = "none"

        # Step 2: run the appropriate "tool"
        if action == "aqi_auto":
            tool_result = weather_aqi_auto_line()
        elif action == "aqi_city" and city:
            tool_result = weather_aqi_city_line(city)

        # Step 3: generate the final answer
        if action in ("aqi_auto", "aqi_city"):
            reply = answer_chain.invoke({
                "question": user,
                "tool_result": tool_result
            })
        else:
            reply = chat_chain.invoke({"question": user})

        print("Bot:", reply, "\n")

if __name__ == "__main__":
    chat_loop()
# Main FastAPI application - streamlined and modular
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Import route modules
from routes.auth_routes import router as auth_router
from routes.ai_routes import router as ai_router
from routes.hospital_routes import router as hospital_router
from routes.location_routes import router as location_router
from surge_endpoints import router as surge_router

# Initialize FastAPI application
app = FastAPI(
    title="SurgeSense API",
    description="AI-powered healthcare management system",
    version="1.0.0"
)

logger.info("SurgeSense backend starting...")

# CORS Configuration - Enable cross-origin requests for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174", 
        "http://127.0.0.1:5174",
        "https://algoallies.vercel.app"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

logger.info("CORS middleware configured")

# Include all route modules
app.include_router(auth_router, tags=["Authentication"])
app.include_router(ai_router, tags=["AI Services"])
app.include_router(hospital_router, tags=["Hospital Management"])
app.include_router(location_router, tags=["Location Services"])
app.include_router(surge_router, tags=["Surge Prediction"])

logger.info("All route modules loaded")

# Health check endpoint
@app.get("/")
def health_check():
    """API health check endpoint"""
    return {
        "status": "healthy",
        "message": "SurgeSense API is running",
        "version": "1.0.0",
        "features": [
            "AI-powered health recommendations",
            "Dynamic weather-based advisory",
            "Real-time hospital management",
            "Surge prediction analytics"
        ]
    }

# # Explicit OPTIONS handling for problematic routes
# @app.options("/login")
# @app.options("/landing-response")
# async def handle_options():
#     """Handle OPTIONS preflight requests explicitly"""
#     return {"message": "OK"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# SurgeSense - Autonomous AI Agent Service
# Runs scheduled analysis and generates proactive recommendations

import os
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from services.surge_prediction import surge_service
from utils.weather_api import get_weather
from utils.weather_aqi import get_air_quality, classify_aqi_us

class AutonomousAgentService:
    """
    Autonomous AI agent that runs periodic analysis and generates recommendations
    Monitors conditions and triggers alerts automatically
    """
    
    def __init__(self):
        self.model = None
        if os.getenv("GOOGLE_API_KEY"):
            self.model = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                api_key=os.getenv("GOOGLE_API_KEY"),
                temperature=0.3
            )
        
        self.last_analysis = None
        self.alert_thresholds = {
            "temperature_high": 35,
            "temperature_low": 10,
            "aqi_critical": 200,
            "surge_multiplier_high": 1.5
        }
    
    def should_trigger_analysis(self) -> bool:
        """Determine if analysis should be triggered based on conditions or time"""
        if not self.last_analysis:
            return True
        
        # Run analysis every 2 hours
        time_threshold = datetime.now() - timedelta(hours=2)
        if self.last_analysis < time_threshold:
            return True
        
        # Check for critical conditions that require immediate analysis
        try:
            conditions = surge_service.get_current_conditions()
            temp = conditions.get("temperature", 25)
            aqi = conditions.get("aqi", 50)
            
            if (temp > self.alert_thresholds["temperature_high"] or 
                temp < self.alert_thresholds["temperature_low"] or
                aqi > self.alert_thresholds["aqi_critical"]):
                return True
        except:
            pass
        
        return False
    
    def generate_autonomous_recommendations(self, surge_report: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI recommendations based on surge report"""
        if not self.model:
            return self._fallback_recommendations(surge_report)
        
        system_prompt = """You are the SurgeSense Autonomous AI Agent.
        
        Analyze the surge report and generate specific, actionable recommendations for hospital operations.
        
        Return ONLY valid JSON with this structure:
        {
          "priority_alerts": [
            {
              "title": "Alert title",
              "message": "Specific action needed",
              "priority": "critical|high|medium|low",
              "department": "Department name",
              "estimated_impact": "Impact description"
            }
          ],
          "staffing_actions": [
            {
              "department": "Department name",
              "action": "increase|decrease|maintain",
              "role": "doctor|nurse|specialist",
              "count_change": number,
              "reasoning": "Why this change is needed"
            }
          ],
          "inventory_actions": [
            {
              "item": "Item name",
              "action": "increase|decrease|maintain",
              "quantity_change": number,
              "reasoning": "Why this change is needed"
            }
          ],
          "operational_recommendations": [
            {
              "area": "Area of operation",
              "recommendation": "Specific recommendation",
              "timeline": "immediate|within_2h|within_6h|within_24h"
            }
          ]
        }"""
        
        human_prompt = f"""
        Current Surge Report:
        - Risk Level: {surge_report['risk_level']}
        - Overall Surge Multiplier: {surge_report['overall_surge_multiplier']}
        - Temperature: {surge_report['conditions']['temperature']}°C
        - AQI: {surge_report['conditions']['aqi']} ({surge_report['conditions']['aqi_category']})
        - Peak Hours: {', '.join(surge_report['peak_hours'])}
        - Total Predicted Patients: {surge_report['total_predicted_patients']}
        
        Department Predictions:
        {self._format_department_data(surge_report['department_predictions'])}
        
        Generate autonomous recommendations for hospital operations.
        """
        
        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_prompt)
            ]
            
            response = self.model.invoke(messages)
            
            # Parse JSON response
            import json
            content = response.content.strip()
            if content.startswith('```json'):
                content = content[7:]
            if content.startswith('```'):
                content = content[3:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()
            
            return json.loads(content)
            
        except Exception as e:
            print(f"Autonomous agent error: {e}")
            return self._fallback_recommendations(surge_report)
    
    def _format_department_data(self, departments: Dict[str, Any]) -> str:
        """Format department data for AI prompt"""
        formatted = []
        for dept_name, data in departments.items():
            formatted.append(f"- {dept_name}: {data['predicted_patients']} patients (+{data['surge_percentage']}%)")
        return '\n'.join(formatted)
    
    def _fallback_recommendations(self, surge_report: Dict[str, Any]) -> Dict[str, Any]:
        """Generate fallback recommendations when AI is unavailable"""
        risk_level = surge_report['risk_level']
        conditions = surge_report['conditions']
        
        recommendations = {
            "priority_alerts": [],
            "staffing_actions": [],
            "inventory_actions": [],
            "operational_recommendations": []
        }
        
        # Generate alerts based on conditions
        if conditions['temperature'] > 35:
            recommendations["priority_alerts"].append({
                "title": "Extreme Heat Alert",
                "message": "Activate heat emergency protocols immediately",
                "priority": "critical",
                "department": "Emergency",
                "estimated_impact": "40-60% increase in heat-related cases"
            })
        
        if conditions['aqi'] > 200:
            recommendations["priority_alerts"].append({
                "title": "Hazardous Air Quality",
                "message": "Prepare for respiratory emergency surge",
                "priority": "critical",
                "department": "Respiratory",
                "estimated_impact": "50-80% increase in respiratory cases"
            })
        
        # Generate staffing recommendations
        if risk_level == "High":
            recommendations["staffing_actions"].extend([
                {
                    "department": "Emergency",
                    "action": "increase",
                    "role": "doctor",
                    "count_change": 2,
                    "reasoning": "High surge risk requires additional emergency physicians"
                },
                {
                    "department": "Emergency",
                    "action": "increase",
                    "role": "nurse",
                    "count_change": 4,
                    "reasoning": "Increased patient volume requires more nursing support"
                }
            ])
        
        return recommendations
    
    def run_autonomous_analysis(self) -> Dict[str, Any]:
        """Run complete autonomous analysis and generate recommendations"""
        print("Autonomous Agent: Starting analysis...")
        
        try:
            # Generate surge report
            surge_report = surge_service.generate_surge_report()
            
            # Generate AI recommendations
            ai_recommendations = self.generate_autonomous_recommendations(surge_report)
            
            # Update last analysis time
            self.last_analysis = datetime.now()
            
            # Combine results
            analysis_result = {
                "timestamp": datetime.now().isoformat(),
                "surge_report": surge_report,
                "ai_recommendations": ai_recommendations,
                "analysis_triggered": "autonomous",
                "next_analysis": (datetime.now() + timedelta(hours=2)).isoformat()
            }
            
            print(f"Autonomous Agent: Analysis complete. Risk level: {surge_report['risk_level']}")
            return analysis_result
            
        except Exception as e:
            print(f"Autonomous Agent: Error during analysis - {e}")
            return {
                "timestamp": datetime.now().isoformat(),
                "error": str(e),
                "analysis_triggered": "autonomous",
                "next_analysis": (datetime.now() + timedelta(hours=2)).isoformat()
            }
    
    def check_and_run_if_needed(self) -> Dict[str, Any]:
        """Check if analysis is needed and run if required"""
        if self.should_trigger_analysis():
            return self.run_autonomous_analysis()
        else:
            return {
                "timestamp": datetime.now().isoformat(),
                "message": "No analysis needed at this time",
                "next_check": (datetime.now() + timedelta(minutes=30)).isoformat()
            }

# Global instance for easy import
autonomous_agent = AutonomousAgentService()
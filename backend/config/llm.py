# LLM provider configuration
# Select provider with LLM_PROVIDER=gemini|groq (default: gemini)
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

DEFAULT_MODELS = {
    "gemini": "gemini-2.5-flash",
    "groq": "openai/gpt-oss-120b",
}

API_KEY_VARS = {
    "gemini": "GOOGLE_API_KEY",
    "groq": "GROQ_API_KEY",
}


def get_provider() -> str:
    provider = os.getenv("LLM_PROVIDER", "gemini").strip().lower()
    if provider not in DEFAULT_MODELS:
        raise ValueError(f"Unsupported LLM_PROVIDER '{provider}'. Use one of: {', '.join(DEFAULT_MODELS)}")
    return provider


def is_llm_configured() -> bool:
    """True if the API key for the selected provider is set"""
    return bool(os.getenv(API_KEY_VARS[get_provider()]))


def get_llm(temperature: float = None):
    """
    Return a LangChain chat model for the configured provider.
    Model can be overridden with LLM_MODEL; otherwise a per-provider default is used.
    """
    provider = get_provider()
    model = os.getenv("LLM_MODEL") or DEFAULT_MODELS[provider]
    api_key = os.getenv(API_KEY_VARS[provider])
    kwargs = {} if temperature is None else {"temperature": temperature}

    logger.info(f"Initializing LLM: provider={provider}, model={model}")

    if provider == "groq":
        from langchain_groq import ChatGroq
        return ChatGroq(model=model, api_key=api_key, **kwargs)

    from langchain_google_genai import ChatGoogleGenerativeAI
    return ChatGoogleGenerativeAI(
        model=model,
        api_key=api_key,
        convert_system_message_to_human=True,
        **kwargs,
    )

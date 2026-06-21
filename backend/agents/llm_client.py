import os
from typing import List, Dict, Optional
import asyncio

# Provider-specific base URLs
PROVIDER_BASE_URLS = {
    "nvidia": "https://integrate.api.nvidia.com/v1",
}


class LLMClient:
    """
    Universal LLM client using litellm for multi-provider support.
    Supports NVIDIA NIM, OpenAI, Anthropic, Groq, and any litellm-compatible provider.
    """

    def __init__(
        self,
        api_key: str,
        provider: str = "nvidia",
        default_model: str = "nvidia/llama-3.3-nemotron-super-49b-v1",
    ):
        self.api_key = api_key
        self.provider = provider.lower()
        self.default_model = default_model

        # Set environment variables that litellm reads for each provider
        if self.provider == "nvidia":
            os.environ["NVIDIA_API_KEY"] = api_key
        elif self.provider == "openai":
            os.environ["OPENAI_API_KEY"] = api_key
        elif self.provider == "anthropic":
            os.environ["ANTHROPIC_API_KEY"] = api_key
        elif self.provider == "groq":
            os.environ["GROQ_API_KEY"] = api_key

    def _get_litellm_model_string(self, model: Optional[str] = None) -> str:
        """Convert the stored model name into a litellm-compatible model string."""
        target_model = model or self.default_model

        if self.provider == "nvidia":
            # litellm expects openai/ prefix when using a custom api_base as an OpenAI compatible endpoint
            if not target_model.startswith("openai/"):
                return f"openai/{target_model}"
            return target_model
        elif self.provider == "openai":
            # OpenAI models are used directly
            return target_model
        elif self.provider == "anthropic":
            # litellm expects "anthropic/" prefix for Claude models
            if not target_model.startswith("anthropic/"):
                return f"anthropic/{target_model}"
            return target_model
        elif self.provider == "groq":
            # litellm natively supports groq via groq/ prefix
            if not target_model.startswith("groq/"):
                return f"groq/{target_model}"
            return target_model
        else:
            return target_model

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1524,
        json_mode: bool = False,
    ) -> str:
        """
        Send a chat completion request via litellm.
        Supports NVIDIA NIM, OpenAI, Anthropic, Groq, and more.
        """
        import litellm

        litellm_model = self._get_litellm_model_string(model)

        kwargs = {
            "model": litellm_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        # Set the API base URL for providers that need it
        if self.provider in PROVIDER_BASE_URLS:
            kwargs["api_base"] = PROVIDER_BASE_URLS[self.provider]

        # Set the API key explicitly
        kwargs["api_key"] = self.api_key

        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = await litellm.acompletion(**kwargs)
                content = response.choices[0].message.content
                return content.strip()
            except litellm.exceptions.RateLimitError as e:
                if attempt < max_retries - 1:
                    print(f"Rate limit hit for {self.provider}. Retrying in 5 seconds... (Attempt {attempt+1}/{max_retries})")
                    await asyncio.sleep(5)
                else:
                    raise RuntimeError(f"LLM API rate limit exceeded ({self.provider}): {str(e)}")
            except Exception as e:
                raise RuntimeError(f"LLM API call failed ({self.provider}): {str(e)}")

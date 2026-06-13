from openai import AsyncOpenAI
from typing import List, Dict, Any, Optional

class NimClient:
    """
    Client for interacting with NVIDIA NIM (NVIDIA Inference Microservices) API.
    Uses OpenAI-compatible endpoints hosted on build.nvidia.com.
    """

    def __init__(self, api_key: str, default_model: str = "nvidia/llama-3.3-nemotron-super-49b-v1"):
        self.api_key = api_key
        self.default_model = default_model
        self.client = AsyncOpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=self.api_key
        )

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1524,
        json_mode: bool = False
    ) -> str:
        """
        Send a chat completion request to NVIDIA NIM.
        """
        target_model = model or self.default_model
        
        kwargs = {
            "model": target_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        if json_mode:
            # Note: Not all NIM models support response_format={"type": "json_object"}.
            # To remain fully robust, we ask for JSON in the prompt and fall back
            # to standard completion if needed, or specify the format parameter.
            kwargs["response_format"] = {"type": "json_object"}

        try:
            response = await self.client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content
            return content.strip()
        except Exception as e:
            raise RuntimeError(f"NVIDIA NIM API call failed: {str(e)}")

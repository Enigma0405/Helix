import json
import os
from typing import Dict, Any
from src.runtime.llm.inference_adapter import InferenceAdapter
from src.shared.logging import application_logger

class FireworksAdapter(InferenceAdapter):
    """
    Primary inference provider using Fireworks AI.
    Requires FIREWORKS_API_KEY environment variable.
    """
    
    def __init__(self, model_name: str = "accounts/fireworks/models/llama-v3p1-70b-instruct"):
        self.model_name = model_name
        
        try:
            from openai import OpenAI
            api_key = os.getenv("FIREWORKS_API_KEY")
            if not api_key:
                application_logger.warning("FIREWORKS_API_KEY not found. FireworksAdapter will fail on generate_assessment.")
            self.client = OpenAI(
                base_url="https://api.fireworks.ai/inference/v1",
                api_key=api_key
            )
        except ImportError:
            self.client = None
            application_logger.error("openai package not installed. Cannot use FireworksAdapter.")
            
    def generate_assessment(self, prompt: str) -> Dict[str, Any]:
        """Calls Fireworks AI and requests JSON output."""
        if not self.client:
            raise RuntimeError("FireworksAdapter cannot run without the openai package.")
            
        system_instruction = (
            "You must respond with a JSON object containing the following keys: "
            "'summary' (string), "
            "'evidence' (array of objects with 'document_id', 'chunk_id', 'title', 'section', 'page'), "
            "'recommendations' (array of strings), "
            "'next_actions' (array of strings). "
            "Do NOT include markdown block wrapping like ```json, just the raw JSON object."
        )

        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            application_logger.error(f"Failed to decode JSON from Fireworks: {content}")
            raise e

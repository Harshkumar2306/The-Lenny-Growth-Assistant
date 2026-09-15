with open("backend/app/services/llm_gateway.py", "r") as f:
    content = f.read()

old_func = '''    def remove_custom_model(self, provider: str, model_name: str) -> bool:
        provider_clean = provider.strip().lower()
        model_clean = model_name.strip()
        key = f"{provider_clean}:{model_clean}"
        if key in self.custom_models:
            del self.custom_models[key]
            # Restore defaults if we just deleted the default override
            if provider_clean == "groq" and settings.DEFAULT_GROQ_MODEL == model_clean:
                settings.DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
            elif provider_clean == "anthropic" and getattr(settings, "DEFAULT_ANTHROPIC_MODEL", DEFAULT_ANTHROPIC_MODEL) == model_clean:
                pass
            return True
        return False'''

new_func = '''    def remove_custom_model(self, provider: str, model_name: str) -> bool:
        provider_clean = provider.strip().lower()
        model_clean = model_name.strip()
        key = f"{provider_clean}:{model_clean}"
        removed = False
        
        if key in self.custom_models:
            del self.custom_models[key]
            removed = True
            
        # Also clear from memory if it matches built-in settings
        if provider_clean == "groq" and settings.DEFAULT_GROQ_MODEL == model_clean:
            settings.GROQ_API_KEY = None
            removed = True
        elif provider_clean == "anthropic" and getattr(settings, "DEFAULT_ANTHROPIC_MODEL", DEFAULT_ANTHROPIC_MODEL) == model_clean:
            settings.ANTHROPIC_API_KEY = None
            removed = True
        elif provider_clean == "openai" and getattr(settings, "DEFAULT_OPENAI_MODEL", DEFAULT_OPENAI_MODEL) == model_clean:
            settings.OPENAI_API_KEY = None
            removed = True
            
        return removed'''

content = content.replace(old_func, new_func)
with open("backend/app/services/llm_gateway.py", "w") as f:
    f.write(content)
print("Updated")

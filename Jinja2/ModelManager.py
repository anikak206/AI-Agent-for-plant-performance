import json

def getModelName(uiModel):

    with open(
        "config/Models.json",
        "r",
        encoding="utf-8"
    ) as file:

        models = json.load(file)

    return models.get(
        uiModel.lower().strip(),
        "llama3"
    )
''' 
Install Ollama
Verify:
    ollama --version

Open Terminal and run command to start the Ollama server:
    ollama serve  

Pull the Llama models:
    ollama pull llama3
    ollama pull llama3.2
    ollama pull qwen3

Verify the models are available:
    ollama list
'''
module.exports = function () {
    const getProviderDefinition = require("./getProviderDefinition"); 
    const listModels = require("./listModels");
    const textPrompt = require("./textPrompt"); 
    const imagePrompt = require("./imagePrompt"); 
    const listProviders = function () {
        // Currently support providers
        return [
            "ollama",
            "openai",
            "google",
            "google-vertex",
            "anthropic",
            "groq",
            "xai",
            "mistral"
        ];
    };
    const ai = {
        textPrompt: textPrompt ,
        imagePrompt: imagePrompt ,
        listModels: listModels,
        listProviders: listProviders,
        getProviderDefinition: getProviderDefinition
    };
    return ai;
};
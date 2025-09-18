module.exports = function () {
    const getProviderDefintion = require("./getProviderDefinition"); 
    const textPrompt = require("./textPrompt"); 
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
        listProviders: listProviders,
        getProviderDefintion: getProviderDefintion
    };
    return ai;
};
module.exports = function (provider) {
        const handlers = {
        //-------------------------------------------------------------------------------------------
        // OLLAMA AI text prompt driver
        "ollama": function () {
            return require("./definitions/ollama.json");
        },
        //-------------------------------------------------------------------------------------------
        // OPENAI text prompt driver
        "openai": function () {
            return require("./definitions/openai.json");
        },
        //-------------------------------------------------------------------------------------------
        // OPENAI text prompt driver
        "openai-compatible": function () {
            return require("./definitions/openai-compatible.json");
        },
        //-------------------------------------------------------------------------------------------
        // google text prompt driver
        "google": function () {
            return require("./definitions/google.json");
        },
        //-------------------------------------------------------------------------------------------
        // google vextex text prompt driver - documentation says this should work with service accounts
        "google-vertex": function () {
            return require("./definitions/google.json");
        },
        //-------------------------------------------------------------------------------------------
        // Anthropic text prompt driver
        "anthropic": function ()  {
            return require("./definitions/anthropic.json");
        },
        //-------------------------------------------------------------------------------------------
        // Groq text prompt driver
        "groq": function () {
             return require("./definitions/groq.json");
        },
        //-------------------------------------------------------------------------------------------
        // XAI text prompt driver
        "xai": function () {
             return require("./definitions/xai.json");
        },
        //-------------------------------------------------------------------------------------------
        // Mistral  text prompt driver
        "mistral": function () {
             return require("./definitions/mistral.json");
        }
    };
    if( provider == "" )
        provider = "ollama";
    // Resolve the provider and call the specific dynamic handler
    if (handlers[provider]) {
        return handlers[provider]();
    } else {
        return { "error" : `Provider ${provider} not recognized as supported`};
    }
};
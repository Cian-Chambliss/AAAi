const { tool } = require("ai");
const { z } = require("zod");

module.exports = function () {
    const getProviderDefinition = require("./getProviderDefinition"); 
    const getModelDefinition = require("./getModelDefinition");
    const listModels = require("./listModels");
    const textPrompt = require("./textPrompt"); 
    const imagePrompt = require("./imagePrompt"); 
    const speechPrompt = require("./speechPrompt"); 
    const transcribePrompt = require("./transcribePrompt"); 
    const filesLoad = require("./filesLoad");
    const streamTextPrompt = require("./streamTextPrompt");
    const makeImageResultSaver = require('./saveImageResults');
    const makeSpeechResultSaver = require('./saveSpeechResults');
        const listProviders = function () {
            // Currently support providers
            return [
                "ollama",
                "openai",
                "openai-compatible",
                "lmstudio",
                "google",
                "google-vertex",
                "anthropic",
                "groq",
                "huggingface",
                "xai",
                "mistral",
                "runware",
                "elevenlabs"
            ];
        };
    const ai = {
        textPrompt: textPrompt ,
        streamTextPrompt : streamTextPrompt,
        imagePrompt: imagePrompt ,
        speechPrompt: speechPrompt ,
        transcribePrompt: transcribePrompt,
        filesLoad: filesLoad ,
        listModels: listModels,
        listProviders: listProviders,
        getProviderDefinition: getProviderDefinition,
        getModelDefinition: getModelDefinition,
        makeImageResultSaver: makeImageResultSaver,
        makeSpeechResultSaver: makeSpeechResultSaver,
        tool: tool,
        z: z
    };
    return ai;
};

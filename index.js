module.exports = function () {
    const ai = {
        textPrompt: function (config,prompt, callback) {
            const handlers = {
                //-------------------------------------------------------------------------------------------
                // OLLAMA AI text prompt driver
                "ollama": function (config, prompt, callback) {
                    import('ollama-ai-provider-v2').then((module) => {
                        const createOllama = module.createOllama;
                        const ollama = createOllama({
                            baseURL: config.baseurl
                        });
                        import('ai').then((aiModule) => {
                            const generateText = aiModule.generateText;
                            const chatWithOllama = function (prompt) {
                                generateText({
                                    model: ollama(config.model), // Replace 'llama3' with your desired model
                                    prompt: prompt,
                                }).then((result) => {
                                    callback(null,result.text);
                                }).catch((error) => {
                                    callback(error.message,null);
                                });
                            }
                            chatWithOllama(prompt);
                        }).catch((error) => {
                            callback(error.message,null);
                        });
                    }).catch((error) => {
                        callback(error.message,null);
                    });
                },
                //-------------------------------------------------------------------------------------------
                // OPENAI text prompt driver
                "openai": function (config, prompt, callback) {
                    import('@ai-sdk/openai').then((module) => {
                        const createOpenAI = module.createOpenAI;
                        // Initialize the OpenAI client with your API key
                        const settings = {
                            apiKey: config.apikey
                        };
                        if (config.baseurl) {
                            settings.baseURL = config.baseurl;
                        }
                        if (config.name) {
                            settings.name = config.name;
                        }
                        if (config.organization) {
                            settings.organization = config.organization;
                        }
                        if (config.project) {
                            settings.project = config.project;
                        }
                        if (config.headers) {
                            settings.headers = config.headers;
                        }
                        try {
                            const openai = createOpenAI(settings);
                            import('ai').then((aiModule) => {
                                const generateText = aiModule.generateText;
                                const chatWithOpenAI = function (prompt) {
                                    generateText({
                                        model: openai(config.model),
                                        prompt: prompt,
                                    }).then((result) => {
                                        callback(null,result.text);
                                    }).catch((error) => {
                                        callback(error.message,null);
                                    });
                                }
                                chatWithOpenAI(prompt);
                            }).catch((error) => {
                                callback(error.message,null);
                            });
                        } catch (error) {
                            callback(error.message,null);
                        }
                    }).catch((error) => {
                        callback(error.message,null);
                    });
                }
            };
            // Resolve the provider and call the specific dynamic handler
            if (handlers[config.provider]) {
                handlers[config.provider](config, prompt, callback);
            } else {
                callback("No handler for provider " + config.provider,null);
            }
        }
    };
    return ai;
};
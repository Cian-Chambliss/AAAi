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
                            generateText({
                                model: ollama(config.model), // Replace 'llama3' with your desired model
                                prompt: prompt,
                            }).then((result) => {
                                callback(null,result.text);
                            }).catch((error) => {
                                callback(error.message,null);
                            });
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
                                generateText({
                                    model: openai(config.model),
                                    prompt: prompt,
                                }).then((result) => {
                                    callback(null,result.text);
                                }).catch((error) => {
                                    callback(error.message,null);
                                });
                        }).catch((error) => {
                                callback(error.message,null);
                            });
                        } catch (error) {
                            callback(error.message,null);
                        }
                    }).catch((error) => {
                        callback(error.message,null);
                    });
                },
                //-------------------------------------------------------------------------------------------
                // google text prompt driver
                "google": function (config, prompt, callback) {
                    import('@ai-sdk/google').then((module) => {
                        const createGoogleGenerativeAI = module.createGoogleGenerativeAI;
                        const settings = {
                            apiKey: config.apikey
                        };
                        if (config.baseurl) {
                            settings.baseURL = config.baseurl;
                        }
                        if (config.headers) {
                            settings.headers = config.headers;
                        }
                        try {
                        const google = createGoogleGenerativeAI(settings);
                        import('ai').then((aiModule) => {
                            const generateText = aiModule.generateText;
                            generateText({
                                model: google(config.model),
                                prompt: prompt,
                            }).then((result) => {
                                callback(null,result.text);
                            }).catch((error) => {
                                callback(error.message,null);
                            });
                        }).catch((error) => {
                                callback(error.message,null);
                            });
                        } catch (error) {
                            callback(error.message,null);
                        }
                    }).catch((error) => {
                        callback(error.message,null);
                    });
                },
                //-------------------------------------------------------------------------------------------
                // Anthropic text prompt driver
                "anthropic": function (config, prompt, callback) {
                    import('@ai-sdk/anthropic').then((module) => {
                        const createAnthropic  = module.createAnthropic;
                        // Initialize the OpenAI client with your API key
                        const settings = {
                            apiKey: config.apikey
                        };
                        if (config.baseurl) {
                            settings.baseURL = config.baseurl;
                        }
                        if (config.headers) {
                            settings.headers = config.headers;
                        }
                        try {
                            const anthropic = createAnthropic(settings);
                            import('ai').then((aiModule) => {
                                const generateText = aiModule.generateText;
                                generateText({
                                    model: anthropic(config.model),
                                    prompt: prompt,
                                }).then((result) => {
                                    callback(null,result.text);
                                }).catch((error) => {
                                    callback(error.message,null);
                                });
                        }).catch((error) => {
                                callback(error.message,null);
                            });
                        } catch (error) {
                            callback(error.message,null);
                        }
                    }).catch((error) => {
                        callback(error.message,null);
                    });
                },
                //-------------------------------------------------------------------------------------------
                // Groq text prompt driver
                "groq": function (config, prompt, callback) {
                    import('@ai-sdk/groq').then((module) => {
                        const createGroq  = module.createGroq;
                        // Initialize the OpenAI client with your API key
                        const settings = {
                            apiKey: config.apikey
                        };
                        if (config.baseurl) {
                            settings.baseURL = config.baseurl;
                        }
                        if (config.headers) {
                            settings.headers = config.headers;
                        }
                        try {
                            const groq = createGroq(settings);
                            import('ai').then((aiModule) => {
                                const generateText = aiModule.generateText;
                                generateText({
                                    model: groq(config.model),
                                    prompt: prompt,
                                }).then((result) => {
                                    callback(null,result.text);
                                }).catch((error) => {
                                    callback(error.message,null);
                                });
                        }).catch((error) => {
                                callback(error.message,null);
                            });
                        } catch (error) {
                            callback(error.message,null);
                        }
                    }).catch((error) => {
                        callback(error.message,null);
                    });
                },
                //-------------------------------------------------------------------------------------------
                // XAI text prompt driver
                "xai ": function (config, prompt, callback) {
                    import('@ai-sdk/xai ').then((module) => {
                        const createXai  = module.createXai;
                        // Initialize the OpenAI client with your API key
                        const settings = {
                            apiKey: config.apikey
                        };
                        if (config.baseurl) {
                            settings.baseURL = config.baseurl;
                        }
                        if (config.headers) {
                            settings.headers = config.headers;
                        }
                        try {
                            const xai = createXai(settings);
                            import('ai').then((aiModule) => {
                                const generateText = aiModule.generateText;
                                generateText({
                                    model: xai(config.model),
                                    prompt: prompt,
                                }).then((result) => {
                                    callback(null,result.text);
                                }).catch((error) => {
                                    callback(error.message,null);
                                });
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
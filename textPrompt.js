module.exports = function (config, prompt, callback , extra ) {
    var args = {
        model:null,
        prompt: prompt,
    };
    if( extra ) {
        const copyProps = [
            "system",
            "toolChoice",
            "provideOptions",
            "maxOutputTokens",
            "maxTokens",
            "temperature",
            "topP",
            "topK",
            "presencePenalty",
            "frequencyPenalty",
            "stopSequences",
            "seed",
            "maxRetries",
            "headers"
        ];
        for(var i = 0 ; i < copyProps.length ; ++i ) {
            var propName = copyProps[i];
            if( extra[propName] ) {
                args[propName] = extra[propName];
            } else if( extra[propName.toLowerCase()]) {
                args[propName] = extra[propName.toLowerCase()];
            }
        }
        //abortSignal - look at implementing
        //Tool Calling - loop at implementing - need some examples 
    }
    const handlers = {
        //-------------------------------------------------------------------------------------------
        // OLLAMA AI text prompt driver
        "ollama": function (config, prompt, callback) {
            import('ollama-ai-provider-v2').then((module) => {
                const createOllama = module.createOllama;
                const url = config.baseurl.replace("localhost:","127.0.0.1:"); // nodeJs 18.15 does not map this - we can remove this when we update nodeJs
                const ollama = createOllama({
                    baseURL: url
                });
                import('ai').then((aiModule) => {
                    const generateText = aiModule.generateText;
                    args.model = ollama(config.model);
                    generateText(args).then((result) => {
                        callback(null, result.text);
                    }).catch((error) => {
                        callback(error.message, null);
                    });
                }).catch((error) => {
                    callback(error.message, null);
                });
            }).catch((error) => {
                callback(error.message, null);
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
                        args.model = openai(config.model);
                        generateText(args).then((result) => {
                            callback(null, result.text);
                        }).catch((error) => {
                            callback(error.message, null);
                        });
                    }).catch((error) => {
                        callback(error.message, null);
                    });
                } catch (error) {
                    callback(error.message, null);
                }
            }).catch((error) => {
                callback(error.message, null);
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
                        args.model = google(config.model);
                        generateText(args).then((result) => {
                            callback(null, result.text);
                        }).catch((error) => {
                            callback(error.message, null);
                        });
                    }).catch((error) => {
                        callback(error.message, null);
                    });
                } catch (error) {
                    callback(error.message, null);
                }
            }).catch((error) => {
                callback(error.message, null);
            });
        },
        //-------------------------------------------------------------------------------------------
        // google vextex text prompt driver - documentation says this should work with service accounts
        "google-vertex": function (config, prompt, callback) {
            import('@ai-sdk/google-vertex').then((module) => {
                const createVertex = module.createVertex;
                const settings = {
                    project: config.project
                };
                if (config.location) {
                    settings.location = config.location;
                }
                if (config.auth) {
                    settings.googleAuthOptions = config.auth; // supplied auth from https://github.com/googleapis/google-auth-library-nodejs
                }
                if (config.baseurl) {
                    settings.baseURL = config.baseurl;
                }
                if (config.headers) {
                    settings.headers = config.headers;
                }
                try {
                    const vertex = createVertex(settings);
                    import('ai').then((aiModule) => {
                        const generateText = aiModule.generateText;
                        args.model = vertex(config.model);
                        generateText(args).then((result) => {
                            callback(null, result.text);
                        }).catch((error) => {
                            callback(error.message, null);
                        });
                    }).catch((error) => {
                        callback(error.message, null);
                    });
                } catch (error) {
                    callback(error.message, null);
                }
            }).catch((error) => {
                callback(error.message, null);
            });
        },
        //-------------------------------------------------------------------------------------------
        // Anthropic text prompt driver
        "anthropic": function (config, prompt, callback) {
            import('@ai-sdk/anthropic').then((module) => {
                const createAnthropic = module.createAnthropic;
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
                        args.model = anthropic(config.model);
                        generateText(args).then((result) => {
                            callback(null, result.text);
                        }).catch((error) => {
                            callback(error.message, null);
                        });
                    }).catch((error) => {
                        callback(error.message, null);
                    });
                } catch (error) {
                    callback(error.message, null);
                }
            }).catch((error) => {
                callback(error.message, null);
            });
        },
        //-------------------------------------------------------------------------------------------
        // Groq text prompt driver
        "groq": function (config, prompt, callback) {
            import('@ai-sdk/groq').then((module) => {
                const createGroq = module.createGroq;
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
                        args.model = groq(config.model);
                        generateText(args).then((result) => {
                            callback(null, result.text);
                        }).catch((error) => {
                            callback(error.message, null);
                        });
                    }).catch((error) => {
                        callback(error.message, null);
                    });
                } catch (error) {
                    callback(error.message, null);
                }
            }).catch((error) => {
                callback(error.message, null);
            });
        },
        //-------------------------------------------------------------------------------------------
        // XAI text prompt driver
        "xai": function (config, prompt, callback) {
            import('@ai-sdk/xai ').then((module) => {
                const createXai = module.createXai;
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
                        args.model = xai(config.model);
                        generateText(args).then((result) => {
                            callback(null, result.text);
                        }).catch((error) => {
                            callback(error.message, null);
                        });
                    }).catch((error) => {
                        callback(error.message, null);
                    });
                } catch (error) {
                    callback(error.message, null);
                }
            }).catch((error) => {
                callback(error.message, null);
            });
        },
        //-------------------------------------------------------------------------------------------
        // Mistral  text prompt driver
        "mistral": function (config, prompt, callback) {
            import('@ai-sdk/mistral ').then((module) => {
                const createMistral = module.createMistral;
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
                    const mistral = createMistral(settings);
                    import('ai').then((aiModule) => {
                        const generateText = aiModule.generateText;
                        args.model = mistral(config.model);
                        generateText(args).then((result) => {
                            callback(null, result.text);
                        }).catch((error) => {
                            callback(error.message, null);
                        });
                    }).catch((error) => {
                        callback(error.message, null);
                    });
                } catch (error) {
                    callback(error.message, null);
                }
            }).catch((error) => {
                callback(error.message, null);
            });
        }
    };
    // Resolve the provider and call the specific dynamic handler
    if (handlers[config.provider]) {
        handlers[config.provider](config, prompt, callback);
    } else {
        callback("No handler for provider " + config.provider, null);
    }
};
module.exports = function (config, prompt, callback , extra ) {
    var outputFormat = 'mp3';
    var processResponse = function(response) {} ;
    if( config.trackCallback ) {    
        processResponse = function( response ) {
            var usage = response.usage;
            if( !usage ) {
                usage = {inputTokens:0,outputTokens:0,totalTokens:0};
            }
            var trackingData = { 
                  config : config
                , inputTokens : usage.inputTokens
                , outputTokens : usage.outputTokens
                , totalTokens : usage.totalTokens 
                , cachedInputTokens : 0
                , reasoningTokens : 0
            };
            // Other types of tokens to track...
            if( response.totalUsage ) {
                if( response.totalUsage.cachedInputTokens ) {
                    trackingData.cachedInputTokens = response.totalUsage.cachedInputTokens;
                }
                if( response.totalUsage.reasoningTokens ) {
                    trackingData.reasoningTokens = response.totalUsage.reasoningTokens;
                }
            }
            config.trackCallback( trackingData );
        };
    }
    if( extra ) {
        if( extra.outputFormat ) {
            outputFormat = extra.outputFormat;
        }
    }
    var args = {
        model:null,
        text: prompt,
        outputFormat: outputFormat
    };
    if( Array.isArray(prompt) ) {
        if(  prompt.length ) {
            if( prompt[0].role ) {
                var ai = require('ai');
                args = {
                    model:null,
                    messages: ai.convertToModelMessages(prompt),
                    outputFormat: outputFormat
                }
            }
        }
    } else if (typeof prompt === 'object' &&  prompt !== null) {
        if( prompt.prompt ) {
            const keys = Object.keys(prompt);
            for( var i = 0 ; i < keys.length ; ++i )
            {
                args[keys[i]] = prompt[keys[i]];
            }
        } 
    }

    if( extra ) {
        const copyProps = [
            "voice",
            "instructions",
            "speed",
            "language",
            "providerOptions",
            "maxRetries",
            "abortSignal",
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
    const modelCheck = function(args,config,callback) {
        if( !args.model ) {            
            callback("Model '"+config.model+"' not found.", null);
            return false;
        }
        return true;
    };

    const handlers = {
        //-------------------------------------------------------------------------------------------
        // OLLAMA AI text prompt driver
        "ollama": function (config, prompt, callback) {
            import('ollama-ai-provider-v2').then((module) => {
                const createOllama = module.createOllama;
                var url = null;
                if( config.baseurl )
                    url = config.baseurl.replace("localhost:","127.0.0.1:"); // nodeJs 18.15 does not map this - we can remove this when we update nodeJs
                const ollama = createOllama({
                    baseURL: url
                });
                import('ai').then((aiModule) => {
                    const generateSpeech = aiModule.experimental_generateSpeech ;
                    args.model = ollama.speech(config.model);
                    if( modelCheck(args,config,callback) ) {
                        generateSpeech(args).then((result) => {
                            callback(null, result);
                            processResponse(result);
                        }).catch((error) => {
                            callback(error.message, null);
                        });
                    }
                }).catch((error) => {
                    callback(error.message, null);
                });
            }).catch((error) => {
                callback(error.message, null);
            });
        },
        //-------------------------------------------------------------------------------------------
        // ElevenLabs speech driver
        "elevenlabs": function (config, prompt, callback) {
            import('@ai-sdk/elevenlabs').then((module) => {
                const createElevenLabs = module.createElevenLabs;
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
                    const eleven = createElevenLabs(settings);
                    import('ai').then((aiModule) => {
                        const generateSpeech = aiModule.experimental_generateSpeech;
                        args.model = eleven.speech(config.model);
                        if( modelCheck(args,config,callback) ) {
                            generateSpeech(args).then((result) => {
                                callback(null, result);
                                processResponse(result);
                            }).catch((error) => {
                                callback(error.message, null);
                            });
                        }
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
                        const generateSpeech = aiModule.experimental_generateSpeech ;
                        args.model = openai.speech(config.model);
                        if( modelCheck(args,config,callback) ) {
                            generateSpeech(args).then((result) => {
                                callback(null, result);
                                processResponse(result);
                            }).catch((error) => {
                                callback(error.message, null);
                            });
                        }
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
        //-------------------------------------------------------------------------------------------
        // OPENAI text prompt driver
        "openai-compatible": function (config, prompt, callback) {
            import('@ai-sdk/openai-compatible').then((module) => {
                const createOpenAI = module.createOpenAICompatible;
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
                        const generateSpeech = aiModule.experimental_generateSpeech ;
                        args.model = openai.speech(config.model);
                        if( modelCheck(args,config,callback) ) {
                            generateSpeech(args).then((result) => {
                                callback(null, result);
                                processResponse(result);
                            }).catch((error) => {
                                callback(error.message, null);
                            });
                        }
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
                        const generateSpeech = aiModule.experimental_generateSpeech ;
                        args.model = google.speech(config.model);
                        if( modelCheck(args,config,callback) ) {
                            generateSpeech(args).then((result) => {
                                callback(null, result);
                                processResponse(result);
                            }).catch((error) => {
                                callback(error.message, null);
                            });
                        }
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
                        const generateSpeech = aiModule.experimental_generateSpeech ;
                        args.model = vertex.speech(config.model);
                        if( modelCheck(args,config,callback) ) {
                            generateSpeech(args).then((result) => {
                                callback(null, result);
                                processResponse(result);
                            }).catch((error) => {
                                callback(error.message, null);
                            });
                        }
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
                        const generateSpeech = aiModule.experimental_generateSpeech ;
                        args.model = anthropic.speech(config.model);
                        if( modelCheck(args,config,callback) ) {
                            generateSpeech(args).then((result) => {
                                callback(null, result);
                                processResponse(result);
                            }).catch((error) => {
                                callback(error.message, null);
                            });
                        }
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
                        const generateSpeech = aiModule.experimental_generateSpeech ;
                        args.model = groq.speech(config.model);
                        if( modelCheck(args,config,callback) ) {
                            generateSpeechs(args).then((result) => {
                                callback(null, result);
                                processResponse(result);
                            }).catch((error) => {
                                callback(error.message, null);
                            });
                        }
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
                        const generateSpeech = aiModule.experimental_generateSpeech ;
                        args.model = xai.speech(config.model);
                        if( modelCheck(args,config,callback) ) {
                            generateSpeech(args).then((result) => {
                                callback(null, result);
                                processResponse(result);
                            }).catch((error) => {
                                callback(error.message, null);
                            });
                        }
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
                    const mistral = createMistral.speech(settings);
                    import('ai').then((aiModule) => {
                        const generateSpeech = aiModule.experimental_generateSpeech ;
                        args.model = mistral(config.model);
                        if( modelCheck(args,config,callback) ) {
                            generateSpeech(args).then((result) => {
                                callback(null, result);
                                processResponse(result);
                            }).catch((error) => {
                                callback(error.message, null);
                            });
                        }
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

module.exports = function (config, prompt, callback , extra ) {
    var numberOfImages  = 1;
    var imageSize = '1024x1024';
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
    if( extra.imagesize ) {
        imageSize = extra.imagesize;
    }
    if( extra.numberofimages ) {
        numberOfImages =  extra.numberofimages;
    }
    var args = {
        model:null,
        prompt: prompt,
        n: numberOfImages, 
        size: imageSize
    };
    if( Array.isArray(prompt) ) {
        if(  prompt.length ) {
            if( prompt[0].role ) {
                var ai = require('ai');
                args = {
                    model:null,
                    messages: ai.convertToModelMessages(prompt),
                    n: numberOfImages, 
                    size: imageSize
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
                    const generateImage = aiModule.experimental_generateImage;
                    args.model = ollama.image(config.model);
                    if( modelCheck(args,config,callback) ) {
                        generateImage(args).then((result) => {
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
                        const generateImage = aiModule.experimental_generateImage;
                        args.model = openai.image(config.model);
                        if( modelCheck(args,config,callback) ) {
                           generateImage(args).then((result) => {
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
                        const generateImage = aiModule.experimental_generateImage;
                        args.model = openai.image(config.model);
                        if( modelCheck(args,config,callback) ) {
                            generateImage(args).then((result) => {
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
                        const generateImage = aiModule.experimental_generateImage;
                        args.model = google.image(config.model);
                        if( modelCheck(args,config,callback) ) {
                            generateImage(args).then((result) => {
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
                    const vertex = createVertex.image(settings);
                    import('ai').then((aiModule) => {
                        const generateImage = aiModule.experimental_generateImage;
                        args.model = vertex(config.model);
                        if( modelCheck(args,config,callback) ) {
                            generateImage(args).then((result) => {
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
                    const anthropic = createAnthropic.image(settings);
                    import('ai').then((aiModule) => {
                        const generateImage = aiModule.experimental_generateImage;
                        args.model = anthropic(config.model);
                        if( modelCheck(args,config,callback) ) {
                            generateImage(args).then((result) => {
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
                    const groq = createGroq.image(settings);
                    import('ai').then((aiModule) => {
                        const generateImage = aiModule.experimental_generateImage;
                        args.model = groq(config.model);
                        if( modelCheck(args,config,callback) ) {
                            generateImages(args).then((result) => {
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
                    const xai = createXai.image(settings);
                    import('ai').then((aiModule) => {
                        const generateImage = aiModule.experimental_generateImage;
                        args.model = xai(config.model);
                        if( modelCheck(args,config,callback) ) {
                            generateImage(args).then((result) => {
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
                    const mistral = createMistral.image(settings);
                    import('ai').then((aiModule) => {
                        const generateImage = aiModule.experimental_generateImage;
                        args.model = mistral(config.model);
                        if( modelCheck(args,config,callback) ) {
                            generateImage(args).then((result) => {
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
        // Runware image prompt driver
        "runware":function (config, prompt, callback) {
            // NOTE: Migrated from '@runware/ai-sdk-provider' to '@runware/sdk-js'.
            // Input mapping:
            //   - ai-sdk 'prompt' -> sdk-js 'positivePrompt'
            //   - ai-sdk 'n' -> sdk-js 'numberResults'
            //   - ai-sdk 'size' (e.g. "1024x1024") -> sdk-js 'width' and 'height'
            //   - ai-sdk 'model' -> sdk-js 'model'
            // Response format difference:
            //   Previously, ai.experimental_generateImage returned an AI SDK response object.
            //   Now, '@runware/sdk-js' returns an array of image objects (ITextToImage[]), e.g.:
            //     [{ imageURL, imageBase64Data, imageDataURI, taskUUID, ... }, ...]
            //   Calling code should detect/branch, for example:
            //     if (Array.isArray(result)) { /* handle Runware SDK images array */ }
            //     else { /* handle AI SDK result object */ }
            import('@runware/sdk-js').then((module) => {
                try {
                    const RunwareCtor = module.Runware || module.default;
                    if (!RunwareCtor) {
                        callback("@runware/sdk-js did not export a Runware client", null);
                        return;
                    }

                    // Derive prompt text from supported input shapes
                    let promptText = args.prompt;
                    if (!promptText && Array.isArray(args.messages)) {
                        // Combine user/content fields into a single prompt string
                        promptText = args.messages
                            .map(m => (typeof m.content === 'string' ? m.content : ''))
                            .filter(Boolean)
                            .join('\n');
                    }

                    // Parse size "WxH"
                    let width = 1024;
                    let height = 1024;
                    if (args.size && typeof args.size === 'string') {
                        const parts = args.size.toLowerCase().split('x');
                        const w = parseInt(parts[0], 10);
                        const h = parseInt(parts[1], 10);
                        if (!isNaN(w) && !isNaN(h)) {
                            width = w;
                            height = h;
                        }
                    }

                    const client = new RunwareCtor({
                        apiKey: config.apikey,
                        // sdk-js uses 'url' for custom server URL
                        url: config.baseurl,
                        // headers are not part of public ctor options but keep for forward-compat
                        headers: config.headers
                    });

                    // Ensure connection if the SDK exposes that method
                    const ensure = (client.ensureConnection && typeof client.ensureConnection === 'function')
                        ? client.ensureConnection() : Promise.resolve();

                    const request = {
                        positivePrompt: promptText || '',
                        negativePrompt: args.negativePrompt || (extra && (extra.negativePrompt || extra.negative)) || undefined,
                        model: config.model,
                        width: width,
                        height: height,
                        numberResults: args.n || 1
                    };

                    if (typeof args.seed !== 'undefined') request.seed = args.seed;

                    ensure.then(() => {
                        if (typeof client.imageInference !== 'function') {
                            callback('Unsupported @runware/sdk-js client: no image generation method found', null);
                            return;
                        }
                        return client.imageInference(request);
                    }).then((result) => {
                        if (typeof result === 'undefined') return; // already handled in previous branch
                        callback(null, result);
                        processResponse(result);
                    }).catch((error) => {
                        callback(error && (error.message || String(error)) , null);
                    });
                } catch (error) {
                    callback(error && (error.message || String(error)) , null);
                }
            }).catch((error) => {
                callback(error && (error.message || String(error)) , null);
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

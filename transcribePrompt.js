module.exports = function (config, audio, callback , extra ) {
    var args = {
        model:null,
        audio: audio,
    };
    var processResponse = function(response) {} ;
    if( config.trackCallback ) {    
        processResponse = function( response ) {
            var trackingData = { 
                  config : config
                , inputTokens : response.usage.inputTokens
                , outputTokens : response.usage.outputTokens
                , totalTokens : response.usage.totalTokens 
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
        const keys = Object.keys(extra);
        for(var i = 0 ; i < keys.length ; ++i ) {
            var propName = keys[i];
            args[propName] = extra[propName];
        }
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
        "ollama": function (config, callback) {
            import('ollama-ai-provider-v2').then((module) => {
                const createOllama = module.createOllama;
                var url = null;
                if( config.baseurl )
                    url = config.baseurl.replace("localhost:","127.0.0.1:"); // nodeJs 18.15 does not map this - we can remove this when we update nodeJs
                const ollama = createOllama({
                    baseURL: url
                });
                import('ai').then((aiModule)  => {
                    const transcribe = aiModule.experimental_transcribe ;
                    args.model = ollama.transcription(config.model);
                    if( modelCheck(args,config,callback) ) {
                        transcribe(args).then((result) => {
                            callback(null, result.text);
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
        "openai": function (config,  callback) {
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
                    import('ai').then((aiModule)  => {
                        const transcribe = aiModule.experimental_transcribe;
                        args.model = openai.transcription(config.model);
                        if( modelCheck(args,config,callback) ) {
                            transcribe(args).then((result) => {
                                callback(null, result.text);
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
        "openai-compatible": function (config,  callback) {
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
                    import('ai').then((aiModule)  => {
                        const transcribe = aiModule.experimental_transcribe;
                        args.model = openai.transcription(config.model);
                        if( modelCheck(args,config,callback) ) {
                            transcribe(args).then((result) => {
                                callback(null, result.text);
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
        "google": function (config,  callback) {
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
                    import('ai').then((aiModule)  => {
                        const transcribe = aiModule.experimental_transcribe ;
                        args.model = google.transcription(config.model);
                        if( modelCheck(args,config,callback) ) {
                            transcribe(args).then((result) => {
                                callback(null, result.text);
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
        "google-vertex": function (config, callback) {
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
                    import('ai').then((aiModule)  => {
                        const transcribe = aiModule.experimental_transcribe ;
                        args.model = vertex.transcription(config.model);
                        if( modelCheck(args,config,callback) ) {
                            transcribe(args).then((result) => {
                                callback(null, result.text);
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
        "anthropic": function (config, callback) {
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
                    import('ai').then((aiModule)  => {
                        const transcribe = aiModule.experimental_transcribe ;
                        args.model = anthropic.transcription(config.model);
                        if( modelCheck(args,config,callback) ) {
                            transcribe(args).then((result) => {
                                callback(null, result.text);
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
        "groq": function (config, callback) {
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
                    import('ai').then((aiModule)  => {
                        const transcribe = aiModule.experimental_transcribe ;
                        args.model = groq.transcription(config.model);
                        if( modelCheck(args,config,callback) ) {
                            transcribe(args).then((result) => {
                                callback(null, result.text);
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
        // LM Studio (OpenAI-compatible) text prompt driver
        "lmstudio": function (config,  callback) {
            import('@ai-sdk/openai-compatible').then((module) => {
                const createOpenAI = module.createOpenAICompatible;
                const settings = {
                    apiKey: config.apikey || "lmstudio"
                };
                if (config.baseurl) {
                    settings.baseURL = config.baseurl;
                } else {
                    settings.baseURL = "http://localhost:1234/v1";
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
                    import('ai').then((aiModule)  => {
                        const transcribe = aiModule.experimental_transcribe;
                        args.model = openai.transcription(config.model);
                        if( modelCheck(args,config,callback) ) {
                            transcribe(args).then((result) => {
                                callback(null, result.text);
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
        // Hugging Face transcription driver via @huggingface/inference
        "huggingface": function (config, callback) {
            import('@huggingface/inference').then((module) => {
                try {
                    const InferenceClient = module.InferenceClient || module.default || module;
                    if (!InferenceClient) {
                        callback("@huggingface/inference did not export InferenceClient", null);
                        return;
                    }
                    const client = new InferenceClient(config.apikey, config.baseurl ? { endpointUrl: config.baseurl } : undefined);

                    function isProbablyUrl(str) {
                        return typeof str === 'string' && /^https?:\/\//i.test(str);
                    }
                    function isDataUri(str) {
                        return typeof str === 'string' && /^data:/i.test(str);
                    }
                    function dataUriToBuffer(uri) {
                        try {
                            const idx = uri.indexOf(',');
                            const meta = uri.substring(0, idx);
                            const data = uri.substring(idx + 1);
                            if (/;base64/i.test(meta)) return Buffer.from(data, 'base64');
                            return Buffer.from(decodeURIComponent(data));
                        } catch (e) { return null; }
                    }

                    function loadAudioAsBuffer(input) {
                        return new Promise(function(resolve, reject){
                            try {
                                if (!input) return reject(new Error('No audio provided'));
                                if (Buffer.isBuffer(input) || input instanceof Uint8Array || (input && typeof input.byteLength === 'number')) {
                                    return resolve(Buffer.from(input));
                                }
                                if (typeof input === 'string') {
                                    if (isDataUri(input)) {
                                        const buf = dataUriToBuffer(input);
                                        if (buf) return resolve(buf);
                                        return reject(new Error('Invalid data URI'));
                                    }
                                    if (isProbablyUrl(input)) {
                                        // Use global fetch if available
                                        const fetchFn = (typeof fetch === 'function') ? fetch : null;
                                        if (!fetchFn) return reject(new Error('fetch not available to load URL'));
                                        fetchFn(input).then(function(res){
                                            if (!res.ok) throw new Error('HTTP '+res.status);
                                            return res.arrayBuffer();
                                        }).then(function(ab){ resolve(Buffer.from(ab)); }).catch(reject);
                                        return;
                                    }
                                    // Assume local file path
                                    try {
                                        const fs = require('fs');
                                        return resolve(fs.readFileSync(input));
                                    } catch(e) {
                                        return reject(e);
                                    }
                                }
                                return reject(new Error('Unsupported audio input type'));
                            } catch (e) { reject(e); }
                        });
                    }

                    function pickProvider(cfg) {
                        var cand = cfg && (cfg.hfProvider || cfg.hfprovider || cfg.inferenceProvider || cfg.inferenceprovider || cfg.huggingfaceProvider || cfg.providerOverride || cfg.providerOption || cfg.provider);
                        if (!cand) return undefined;
                        if (String(cand).toLowerCase() === 'huggingface') return undefined;
                        return cand;
                    }
                    const providerOverride = pickProvider(config);

                    loadAudioAsBuffer(args.audio).then(function(buf){
                        const req = { model: config.model, data: buf };
                        if (providerOverride) req.provider = providerOverride;
                        return client.automaticSpeechRecognition(req);
                    }).then(function(result){
                        let text = null;
                        if (!result) text = '';
                        else if (typeof result === 'string') text = result;
                        else if (result.text) text = result.text;
                        else if (result.transcription) text = result.transcription;
                        else if (Array.isArray(result) && result.length && result[0] && result[0].text) text = result[0].text;
                        else text = '';
                        callback(null, text);
                        processResponse({ usage: { inputTokens:0, outputTokens:0, totalTokens:0 } });
                    }).catch(function(error){
                        callback(error && error.message ? error.message : String(error), null);
                    });
                } catch (error) {
                    callback(error && error.message ? error.message : String(error), null);
                }
            }).catch((error) => {
                callback(error && error.message ? error.message : String(error), null);
            });
        },
        //-------------------------------------------------------------------------------------------
        // XAI text prompt driver
        "xai": function (config, callback) {
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
                    import('ai').then((aiModule)  => {
                        const transcribe = aiModule.experimental_transcribe ;
                        args.model = xai.transcription(config.model);
                        if( modelCheck(args,config,callback) ) {
                            transcribe(args).then((result) => {
                                callback(null, result.text);
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
        "mistral": function (config, callback) {
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
                    import('ai').then((aiModule)  => {
                        const transcribe = aiModule.experimental_transcribe ;
                        args.model = mistral.transcription(config.model);
                        if( modelCheck(args,config,callback) ) {
                            transcribe(args).then((result) => {
                                callback(null, result.text);
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
        handlers[config.provider](config,  callback);
    } else {
        callback("No handler for provider " + config.provider, null);
    }
};

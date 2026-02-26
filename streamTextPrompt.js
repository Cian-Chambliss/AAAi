module.exports = function (config, prompt, callback , eventcallback , extra ) {
    var args = {
        model: null,
        prompt: prompt,
    };
    const delay = function(ms) {
        return new Promise(resolve => setTimeout(resolve,ms));
    }
    //------------------------------------ Common stream logic
    const streamAllText = function(config,prompt,args,callback,eventcallback) {
        if( extra ) {
            if( extra.tools ) {
                args.tools = extra.tools;
            }
            //if( extra.system ) {
            //    args.system = extra.system;
            //}
            if( extra.maxsteps ) {
                args.maxSteps = extra.maxsteps;
            }
        }        
        if( !args.model ) {            
            callback("Model '"+config.model+"' not found.", null);
        } else {
            import('ai').then(async (aiModule) => {
                const streamText = aiModule.streamText;
                const controller = new AbortController(); 
                args.signal = controller.signal;
                if( config.trackCallback ) {
                    args.onFinish = async function( response ) {
                        var usage = response.usage;
                        if( !usage ) {
                            usage = {inputTokens:0,outputTokens:0,totalTokens:0};
                        }
                        var trackingData = {
                            config : config
                            , psuedo : false  
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
                        if( !response.usage.inputTokens
                        && !response.usage.outputTokens
                        && !response.usage.totalTokens
                        ) {
                            trackingData.psuedo = true;
                            trackingData.inputTokens = Math.ceil( (prompt.split(" ").join("").split("\r\n").join()).length / 4 );
                            trackingData.outputTokens = Math.ceil( ((await response.text).split(" ").join("").split("\r\n").join()).length / 4 );
                            trackingData.totalTokens = trackingData.inputTokens + trackingData.outputTokens;
                        }
                        config.trackCallback( trackingData );
                    };
                }
                var streamResult = null;
                var allText = "";
                if( extra && extra.tools ) {
                    const toTextParts = function(content) {
                        if (content === undefined || content === null) {
                            return [{ type: "text", text: "" }];
                        }
                        if (Array.isArray(content)) {
                            return content;
                        }
                        if (typeof content === "string") {
                            return [{ type: "text", text: content }];
                        }
                        return [{ type: "text", text: JSON.stringify(content) }];
                    }
                    const coerceToModelMessages = function(msgs) {
                        if (!Array.isArray(msgs)) {
                            return [];
                        }
                        if (!msgs.length) {
                            return [];
                        }
                        const hasParts = msgs.some((msg) => msg && Array.isArray(msg.parts));
                        if (hasParts) {
                            const uiMessages = msgs.map((msg) => {
                                if (msg && msg.parts) {
                                    return msg;
                                }
                                return {
                                    role: msg && msg.role ? msg.role : "user",
                                    parts: toTextParts(msg ? msg.content : "")
                                };
                            });
                            return ai.convertToModelMessages(uiMessages);
                        }
                        return msgs.map((msg) => {
                            if (!msg || typeof msg !== "object") {
                                return { role: "user", content: "" };
                            }
                            if (msg.content === undefined || msg.content === null) {
                                return { role: msg.role || "user", content: "" };
                            }
                            return msg;
                        });
                    }
                    var baseMessages = coerceToModelMessages(args.messages);
                    var messages = baseMessages.slice();
                    var handledToolCallIds = new Set();
                    for( var mi = 0 ; mi < messages.length ; ++mi ) {
                        var msg = messages[mi];
                        if( msg && msg.role === "tool" && Array.isArray(msg.content) ) {
                            for( var ci = 0 ; ci < msg.content.length ; ++ci ) {
                                var c = msg.content[ci];
                                if( c && c.type === "tool-result" && c.toolCallId ) {
                                    handledToolCallIds.add(c.toolCallId);
                                }
                            }
                        }
                    }
                    var nstep = 1;
                    if( config.provider != "openai" && args.maxSteps > 1 ) {
                        nstep = args.maxSteps;
                    }
                    for( var stepNo = 0 ; stepNo < nstep; ++stepNo ) {
                        args.messages = messages;
                        streamResult = streamText(args);
                        if( stepNo > 0 && config.delay ) {
                            await delay(config.delay);
                        }
                        const toolCalls = await streamResult.toolCalls;
                        var toolResults = [];
                        if( toolCalls.length > 0 ) {
                            for( const call of toolCalls ) {
                                if( call.toolCallId && handledToolCallIds.has(call.toolCallId) ) {
                                    continue;
                                }
                                const toolResult = await extra.tools[call.toolName].execute(call.args || call.input);
                                toolResults.push({
                                    call: call,
                                    result: toolResult
                                });
                            }
                        }
                        //-----------------------------------------------------------
                        for await (const event of streamResult.fullStream) {
                            var _eventtext = "";
                            switch (event.type) {
                                case "tool-call":
                                    _eventtext = "TOOL CALL:" + event.toolName;
                                    if( event.args ) {
                                        _eventtext += "Args:" + JSON.stringify(event.args);
                                    }
                                    if( event.input ) {
                                        _eventtext += "Args:" + JSON.stringify(event.input);
                                    }
                                    allText += _eventtext+"\r\n";
                                    break;

                                case "tool-result":
                                    _eventtext = "TOOL RESULT:" + event.toolName;
                                    if( event.result ) {
                                        _eventtext += JSON.stringify(event.result);
                                    }
                                    if( event.output ) {
                                        _eventtext += JSON.stringify(event.output);
                                    }
                                    allText += _eventtext+"\r\n";
                                    break;
                                default:
                                    _eventtext = event.type;
                                    break;
                            }
                            if( _eventtext.length ) {
                                if( !eventcallback(_eventtext,allText,event) ) {
                                    controller.abort();
                                    callback(' Stream aborted ',allText);
                                    streamResult.closeStream();
                                    return;
                                }
                            }
                        }
                        const streamResponsed = await streamResult.response;
                        if( streamResponsed && Array.isArray(streamResponsed.messages) && streamResponsed.messages.length ) {
                            const responseMessages = coerceToModelMessages(streamResponsed.messages);
                            messages = messages.concat(responseMessages);
                        }
                        if( toolResults.length > 0 ) {
                            for( var tr = 0 ; tr < toolResults.length ; ++tr ) {
                                var call = toolResults[tr].call;
                                var result = toolResults[tr].result;
                                if( call.toolCallId ) {
                                    handledToolCallIds.add(call.toolCallId);
                                }
                                messages.push({
                                    role: "tool",
                                    content: [{
                                        type: "tool-result",
                                        toolCallId: call.toolCallId,
                                        toolName: call.toolName,
                                        output: {
                                            type: "text",
                                            value: (result === undefined || result === null) ? "" : String(result)
                                        }
                                    }]
                                });
                            }
                        } else {
                            break;
                        }
                    }
                    callback(null, allText);
                } else {
                    streamResult = streamText(args);
                    for await (const textPart of streamResult.textStream) {
                        allText += textPart;
                        if( !eventcallback(textPart,allText) ) {
                            controller.abort();
                            callback(' Stream aborted ',allText);
                            streamResult.closeStream();
                            return;
                        }                        
                    }
                    var textOutput =  await streamResult.text;
                    callback(null, textOutput);
                }
                // Note - tools can have steps
            }).catch((error) => {
                callback(error.message, null);
            });
        }
    };
    var ai = require('ai');

    if( Array.isArray(prompt) ) {
        if(  prompt.length ) {
            if( prompt[0].role ) {
                args = {
                    model:null,
                    messages: ai.convertToModelMessages(prompt)
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
    if( extra && extra.tools && !args.messages ) {
        const keys = Object.keys(args);
        var messages = [];
        var userMessage = null;
        var systemMessage = null;
        var newArgs = {
            model: null,
            messages: null
        };
        for( var i = 0 ; i < keys.length ; ++i ) {
            if( keys[i] == "prompt" ) {
                userMessage = {
                    role : "user",
                    content : args[keys[i]]
                };
            } else if( keys[i] == "system" ) {
                systemMessage = {
                    role : "system",
                    content : args[keys[i]]
                };
            } else {
                newArgs[keys[i]] = args[keys[i]];
            }
        }
        if( extra.system && !systemMessage ) {
            systemMessage = {
               role : "system",
               content : extra.system
            };
        }        
        if( systemMessage ) {
            messages.push({ role: systemMessage.role, content: systemMessage.content || "" });
        }
        if( userMessage ) {
            var userContent = userMessage.content;
            if (userContent === undefined || userContent === null) {
                userContent = "";
            } else if (typeof userContent !== "string" && !Array.isArray(userContent)) {
                userContent = JSON.stringify(userContent);
            }
            messages.push({ role: userMessage.role, content: userContent });
        }
        newArgs.messages = messages;
        args = newArgs;
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
    if (Array.isArray(args.messages) && args.messages.length) {
        const toTextParts = function(content) {
            if (content === undefined || content === null) {
                return [{ type: "text", text: "" }];
            }
            if (Array.isArray(content)) {
                return content;
            }
            if (typeof content === "string") {
                return [{ type: "text", text: content }];
            }
            return [{ type: "text", text: JSON.stringify(content) }];
        }
        const needsConversion = args.messages.some((msg) => msg && msg.role && msg.parts);
        if (needsConversion) {
            const uiMessages = args.messages.map((msg) => {
                if (msg && msg.parts) {
                    return msg;
                }
                return { role: msg && msg.role ? msg.role : "user", parts: toTextParts(msg ? msg.content : "") };
            });
            args.messages = ai.convertToModelMessages(uiMessages);
        }
    }
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
                args.model = ollama(config.model);
                streamAllText(config,prompt,args,callback,eventcallback);
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
                    args.model = openai(config.model);
                    streamAllText(config,prompt,args,callback,eventcallback);
                } catch (error) {
                    callback(error.message, null);
                }
            }).catch((error) => {
                callback(error.message, null);
            });
        },
        //-------------------------------------------------------------------------------------------
        // OPENAI compatible text prompt driver
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
                    args.model = openai(config.model);
                    streamAllText(config,prompt,args,callback,eventcallback);
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
                    args.model = google(config.model);
                    streamAllText(config,prompt,args,callback,eventcallback);
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
                    args.model = vertex(config.model);
                    streamAllText(config,prompt,args,callback,eventcallback);                    
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
                    args.model = anthropic(config.model);
                    streamAllText(config,prompt,args,callback,eventcallback);
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
                    args.model = groq(config.model);
                    streamAllText(config,prompt,args,callback,eventcallback);
                } catch (error) {
                    callback(error.message, null);
                }
            }).catch((error) => {
                callback(error.message, null);
            });
        },
        //-------------------------------------------------------------------------------------------
        // LM Studio (OpenAI-compatible) text prompt driver
        "lmstudio": function (config, prompt, callback) {            
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
                    args.model = openai(config.model);
                    streamAllText(config,prompt,args,callback,eventcallback);
                } catch (error) {
                    callback(error.message, null);
                }
            }).catch((error) => {
                callback(error.message, null);
            });
        },
        //-------------------------------------------------------------------------------------------
        // Hugging Face text or chat driver via @huggingface/inference (streaming)
        "huggingface": function (config, prompt, callback) {
            import('@huggingface/inference').then((module) => {
                try {
                    const InferenceClient = module.InferenceClient || module.HfInference || module.default || module;
                    if (!InferenceClient) {
                        callback("@huggingface/inference did not export InferenceClient", null);
                        return;
                    }
                    const client = new InferenceClient(
                        config.apikey,
                        config.baseurl ? { endpointUrl: config.baseurl } : undefined
                    );

                    // Derive prompt text from supported input shapes
                    let promptText = args.prompt;
                    if (!promptText && Array.isArray(args.messages)) {
                        try {
                            promptText = args.messages
                                .map(function(m){ return (m && typeof m.content === 'string') ? m.content : ''; })
                                .filter(function(s){ return !!s; })
                                .join('\n');
                        } catch(_e) {}
                    }

                    // Map common options to HF parameters
                    const parameters = {};
                    const maxTokens = args.maxOutputTokens || args.maxTokens;
                    if (typeof maxTokens === 'number') {
                        parameters.max_new_tokens = maxTokens; // text-generation
                        parameters.max_tokens = maxTokens;      // chat-completions
                    }
                    if (typeof args.temperature === 'number') parameters.temperature = args.temperature;
                    if (typeof args.topP === 'number') parameters.top_p = args.topP;
                    if (typeof args.topK === 'number') parameters.top_k = args.topK;
                    if (Array.isArray(args.stopSequences) && args.stopSequences.length) {
                        parameters.stop = args.stopSequences;
                        parameters.stop_sequences = args.stopSequences;
                    }
                    if (typeof args.seed === 'number') parameters.seed = args.seed;

                    function pickProvider(cfg) {
                        var cand = cfg && (cfg.hfProvider || cfg.hfprovider || cfg.inferenceProvider || cfg.inferenceprovider || cfg.huggingfaceProvider || cfg.providerOverride || cfg.providerOption);
                        if (!cand) return undefined;
                        return cand;
                    }
                    const providerOverride = pickProvider(config);

                    const useChat = !!config.conversational;

                    const controller = new AbortController();
                    let allText = '';
                    let aborted = false;

                    (async function run(){
                        try {
                            if (useChat && typeof client.chatCompletionStream === 'function') {
                                // Prefer messages if provided, else wrap the promptText
                                let messages = Array.isArray(args.messages) && args.messages.length
                                    ? args.messages
                                    : (promptText ? [{ role: 'user', content: String(promptText) }] : []);

                                if (!messages.length) {
                                    callback('No prompt or messages provided for Hugging Face chat completion', null);
                                    return;
                                }

                                const req = Object.assign({ model: config.model, messages: messages }, parameters);
                                if (providerOverride) req.provider = providerOverride;

                                const stream = client.chatCompletionStream(req, { signal: controller.signal });
                                for await (const evt of stream) {
                                    // Expect evt.choices[0].delta.content chunks (OpenAI style) or evt.delta
                                    let part = '';
                                    if (evt && evt.delta && typeof evt.delta === 'string') part = evt.delta;
                                    else if (evt && Array.isArray(evt.choices) && evt.choices.length) {
                                        const delta = evt.choices[0].delta;
                                        part = (delta && (delta.content || delta.text)) || '';
                                    }
                                    if (part) {
                                        allText += part;
                                        if (!eventcallback(part, allText)) {
                                            aborted = true;
                                            controller.abort();
                                            break;
                                        }
                                    }
                                }
                            } else {
                                // Fallback to text generation streaming
                                if (!promptText || typeof promptText !== 'string') {
                                    callback('No prompt text provided for Hugging Face text generation', null);
                                    return;
                                }
                                const request = { model: config.model, inputs: promptText };
                                if (Object.keys(parameters).length) request.parameters = parameters;
                                if (providerOverride) request.provider = providerOverride;

                                const stream = client.textGenerationStream(request, { signal: controller.signal });
                                for await (const evt of stream) {
                                    if (evt && evt.token && typeof evt.token.text === 'string') {
                                        const part = evt.token.text;
                                        allText += part;
                                        if (!eventcallback(part, allText)) {
                                            aborted = true;
                                            controller.abort();
                                            break;
                                        }
                                    }
                                }
                            }

                            if (aborted) {
                                callback(' Stream aborted ', allText);
                                return;
                            }
                            callback(null, allText);

                            // Best-effort tracking (no usage provided by HF streaming)
                            if (config.trackCallback) {
                                try {
                                    var trackingData = {
                                        config: config,
                                        psuedo: true,
                                        inputTokens: Math.ceil(String(promptText || '').split(' ').join('').split('\r\n').join('').length / 4),
                                        outputTokens: Math.ceil(String(allText).split(' ').join('').split('\r\n').join('').length / 4),
                                        totalTokens: 0,
                                        cachedInputTokens: 0,
                                        reasoningTokens: 0
                                    };
                                    trackingData.totalTokens = trackingData.inputTokens + trackingData.outputTokens;
                                    config.trackCallback(trackingData);
                                } catch(_e) {}
                            }
                        } catch (error) {
                            if (aborted) {
                                callback(' Stream aborted ', allText);
                            } else {
                                callback(error && error.message ? error.message : String(error), null);
                            }
                        }
                    })();
                } catch (error) {
                    callback(error && error.message ? error.message : String(error), null);
                }
            }).catch((error) => {
                callback(error && error.message ? error.message : String(error), null);
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
                    args.model = xai(config.model);
                    streamAllText(config,prompt,args,callback,eventcallback);
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
                    args.model = mistral(config.model);
                    streamAllText(config,prompt,args,callback,eventcallback);
                    
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

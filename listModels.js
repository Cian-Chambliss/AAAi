module.exports = function (config, callback, extra) {
    const getProviderDefinition = require("./getProviderDefinition");
    const returnDescriptions = !!(extra && extra.returnDescriptions);
    const getBaseModelName = function(name) {
        if (!name || typeof name !== "string") return name;
        const m = name.match(/^(.*?)-(latest|\d{4}-\d{2}-\d{2})$/);
        if (m) return m[1];
        return name;
    };
    const formatReturn = function(provider, names, wantDescriptions) {
        if (!wantDescriptions) return names;
        const def = getProviderDefinition(provider);
        const descMap = new Map();
        const featMap = new Map();
        if (def && Array.isArray(def.modeldescriptions)) {
            for (var i = 0; i < def.modeldescriptions.length; ++i) {
                var m = def.modeldescriptions[i];
                if (m && m.name) {
                    descMap.set(m.name, m.description || "");
                    if (Array.isArray(m.features) && m.features.length) {
                        featMap.set(m.name, m.features);
                    }
                }
            }
        }
        return names.map(function(n){
            var item = { name: n, description: descMap.get(n) || "" };
            var feats = featMap.get(n);
            if (!feats || !feats.length) {
                var base = getBaseModelName(n);
                if (base !== n) feats = featMap.get(base);
            }
            if (Array.isArray(feats) && feats.length) item.features = feats.join(",");
            return item;
        });
    };
    const handlers = {
        //-------------------------------------------------------------------------------------------
        // OLLAMA AI text prompt driver
        "ollama": function (config, callback) {
            var url = config.baseurl;
            if (!url) {
                url = "http://localhost:11434/api";
            }
            url = url.replace("localhost:","127.0.0.1:"); // nodeJs 18.15 does not map this - we can remove this when we update nodeJs
            url += "/tags";
            var httpx = null;
            const urlP = new URL(url);
            if( urlP.protocol == "https:") {
                httpx =  require('https');
            } else {
                httpx = require('http');
            }
            var options = {
                hostname : urlP.hostname,
                port : urlP.port,
                path : urlP.pathname,
                method : "GET",
                headers: {
                    'Content-Type': 'application/json'
                },
            };
            httpx.get(options, (res) => {
                let data = '';
                // Collect data chunks
                res.on('data', (chunk) => {
                    data += chunk;
                });
                // Process the complete response
                res.on('end', () => {
                    try {
                        const obj = JSON.parse(data);
                        const listed = [];
                        const models = obj.models;
                        for(var i = 0  ; i < models.length ; ++i ) {
                            if(models[i].name)
                                listed.push(models[i].name);
                        }
                        callback(null, formatReturn("ollama", listed, returnDescriptions));
                    }  catch (error) {
                        callback(error.message, null);
                    }
                });
            }).on('error', (err) => {
                callback(`Error: ${err.message} for ${url}`,null);
            });
        },
        //-------------------------------------------------------------------------------------------
        // OPENAI AI text prompt driver
        "openai": function (config, callback,fallback) {
            var url = config.baseurl;
            if (!url) {
                url = "https://api.openai.com/v1/models";
            }
            var httpx = null;
            const urlP = new URL(url);
            if( urlP.protocol == "https:") {
                httpx =  require('https');
            } else {
                httpx = require('http');
            }
            var options = {
                hostname : urlP.hostname,
                port : urlP.port,
                path : urlP.pathname,
                method : "GET",
                headers: {
                    'Content-Type': 'application/json',
                     'Authorization': `Bearer ${config.apikey}`
                },
            };
            httpx.get(options, (res) => {
                let data = '';
                // Collect data chunks
                res.on('data', (chunk) => {
                    data += chunk;
                });
                // Process the complete response
                res.on('end', () => {
                    try {
                        const obj = JSON.parse(data);
                        const listed = [];
                        const models = obj.data;
                        for(var i = 0  ; i < models.length ; ++i ) {
                            if(models[i].id)
                                listed.push(models[i].id);
                        }
                        if( listed.length )
                            callback(null, formatReturn("openai", listed, returnDescriptions));
                        else
                            fallback("openai",callback, returnDescriptions);
                    }  catch (error) {
                        fallback("openai",callback, returnDescriptions);
                    }
                });
            }).on('error', (err) => {
                fallback("openai",callback, returnDescriptions);
            });
        },
        //-------------------------------------------------------------------------------------------
        // LM Studio (OpenAI-compatible) model list
        "lmstudio": function (config, callback, fallback) {
            var url = config.baseurl;
            if (!url) {
                url = "http://localhost:1234/v1";
            }
            if (!/\/models\/?$/.test(url)) {
                if (url.endsWith('/')) {
                    url += "models";
                } else {
                    url += "/models";
                }
            }
            var httpx = null;
            const urlP = new URL(url);
            if( urlP.protocol == "https:") {
                httpx =  require('https');
            } else {
                httpx = require('http');
            }
            var headers = {
                'Content-Type': 'application/json'
            };
            if (config.apikey) {
                headers['Authorization'] = `Bearer ${config.apikey}`;
            }
            if (config.headers && typeof config.headers === 'object') {
                Object.keys(config.headers).forEach(function(k){ headers[k] = config.headers[k]; });
            }
            var options = {
                hostname : urlP.hostname,
                port : urlP.port,
                path : urlP.pathname,
                method : "GET",
                headers: headers
            };
            httpx.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const obj = JSON.parse(data);
                        const listed = [];
                        var models = obj && (obj.data || obj.models || obj.items || obj.result || obj);
                        if (!Array.isArray(models)) {
                            models = [];
                        }
                        for (var i = 0; i < models.length; ++i) {
                            var m = models[i] || {};
                            var id = m.id || m.key || m.name || m.model || m.display_name;
                            if (id) listed.push(id);
                        }
                        if( listed.length )
                            callback(null, formatReturn("lmstudio", listed, returnDescriptions));
                        else
                            fallback("lmstudio",callback, returnDescriptions);
                    }  catch (error) {
                        fallback("lmstudio",callback, returnDescriptions);
                    }
                });
            }).on('error', (err) => {
                fallback("lmstudio",callback, returnDescriptions);
            });
        },
        //-------------------------------------------------------------------------------------------
        // HUGGINGFACE model list via public API
        "huggingface": function (config, callback, fallback) {
            var url = config.baseurl;
            if (!url) {
                url = "https://huggingface.co/api/models";
            }
            // Build query string from extra (lowercase keys). We currently honor: search, limit
            var query = [];
            if (extra && typeof extra === 'object') {
                if (typeof extra.search === 'string' && extra.search.trim()) {
                    query.push('search=' + encodeURIComponent(extra.search.trim()));
                }
                if (typeof extra.limit !== 'undefined') {
                    var lim = parseInt(extra.limit, 10);
                    if (!isNaN(lim) && lim > 0) query.push('limit=' + String(lim));
                }
            }
            if (query.length) {
                url += (url.indexOf('?') === -1 ? '?' : '&') + query.join('&');
            }

            var httpx = null;
            const urlP = new URL(url);
            if( urlP.protocol == "https:") {
                httpx =  require('https');
            } else {
                httpx = require('http');
            }
            var options = {
                hostname : urlP.hostname,
                port : urlP.port,
                path : urlP.pathname + (urlP.search || ''),
                method : "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            httpx.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const obj = JSON.parse(data);
                        if (!Array.isArray(obj)) {
                            return fallback("huggingface", callback, returnDescriptions);
                        }
                        const listed = [];
                        for (var i = 0; i < obj.length; ++i) {
                            var m = obj[i] || {};
                            var id = m.modelId || m.id || m.name;
                            if (id) listed.push(id);
                        }
                        if (listed.length) {
                            callback(null, formatReturn("huggingface", listed, returnDescriptions));
                        } else {
                            fallback("huggingface", callback, returnDescriptions);
                        }
                    } catch (error) {
                        fallback("huggingface", callback, returnDescriptions);
                    }
                });
            }).on('error', (err) => {
                fallback("huggingface", callback, returnDescriptions);
            });
        },
        //-------------------------------------------------------------------------------------------
        // RUNWARE AI text prompt driver
        "runware" : function (config, callback,fallback) {
            var url = config.baseurl;
            if (!url) {
                url = "https://api.runware.ai/v1";
            }
            var httpx = null;
            const urlP = new URL(url);
            if( urlP.protocol == "https:") {
                httpx =  require('https');
            } else {
                httpx = require('http');
            }
            var options = {
                hostname : urlP.hostname,
                port : urlP.port,
                path : urlP.pathname,
                method : "POST",
                headers: {
                    'Content-Type': 'application/json',
                     'Authorization': `Bearer ${config.apikey}`
                }                
            };
            const req = httpx.request(options, (res) => {
                let data = '';
                // Collect data chunks                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                // Process the complete response
                res.on('end', () => {
                    try {
                        const obj = JSON.parse(data);
                        const listed = [];
                        var models = obj.data;
                        if( models[0].results ) {
                            models = models[0].results;
                        }
                        if( returnDescriptions ) {
                            // enrich with features from provider definitions when available
                            const def = getProviderDefinition("runware");
                            const featMap = new Map();
                            if (def && Array.isArray(def.modeldescriptions)) {
                                for (var j = 0; j < def.modeldescriptions.length; ++j) {
                                    var md = def.modeldescriptions[j];
                                    if (md && md.name && Array.isArray(md.features) && md.features.length) {
                                        featMap.set(md.name, md.features);
                                    }
                                }
                            }
                            for(var i = 0  ; i < models.length ; ++i ) {
                                if(models[i].air) {
                                    var item = { "name" : models[i].air , "description" : models[i].name };
                                    var feats = featMap.get(models[i].air);
                                    if (!feats || !feats.length) {
                                        var base = getBaseModelName(models[i].air);
                                        if (base !== models[i].air) feats = featMap.get(base);
                                    }
                                    if (Array.isArray(feats) && feats.length) item.features = feats.join(",");
                                    listed.push(item);
                                }
                            }
                        } else {
                            for(var i = 0  ; i < models.length ; ++i ) {
                                if(models[i].air)
                                    listed.push(models[i].air);
                            }
                        }
                        if( listed.length ) {
                            callback(null, listed, models);
                        }
                        else
                            fallback("runware",callback, returnDescriptions);
                    }  catch (error) {
                        fallback("runware",callback, returnDescriptions);
                    }
                });
            }).on('error', (err) => {
                fallback("runware",callback, returnDescriptions);
            });
            //{ "taskType": "authentication", "apiKey": config.apikey }, 
            const crypto = require('crypto');
            const guid = crypto.randomUUID();
            // Build modelSearch payload from extra (lowercase keys); map common aliases and dotted filters
            var searchParams = {};
            if (extra && typeof extra === "object") {
                Object.keys(extra).forEach(function(k){
                    if (!k || k !== k.toLowerCase()) return;
                    var v = extra[k];
                    // Map legacy/alias keys to Runware spec
                    if (k === "query") {
                        if (searchParams.search === undefined) searchParams.search = v;
                        return;
                    }
                    // Flatten dotted keys like "filter.tags" -> "tags"
                    if (k.indexOf('.') !== -1) {
                        var parts = k.split('.');
                        var last = parts[parts.length - 1];
                        if (searchParams[last] === undefined) searchParams[last] = v;
                        return;
                    }
                    // Copy as-is
                    searchParams[k] = v;
                });
            }
            var payload = [{
                "taskType": "modelSearch",
                "taskUUID": guid,
                // spread user-supplied modelSearch params (e.g., query, filter, limit)
                ...searchParams
            }];
            req.write(JSON.stringify(payload));
            req.end();
        }
    };
    if (!config) {
        //default to ollama
        config = { provider: "ollama" };
    } else if (typeof config !== 'object') {
        config = { provider : config };
    }
    const fallback = function (provider,callback, wantDescriptions) {
        const def = getProviderDefinition(provider);
        var models = null;
        if (def) {
            if (def.models) {
                models = def.models;
            }
        }
        if( models ) {
            callback(null, formatReturn(provider, models, wantDescriptions));
        } else {
            callback("Error - could not find any models",null);
        }
    };
    // Resolve the provider and call the specific dynamic handler
    if (handlers[config.provider]) {
        return handlers[config.provider](config, callback, fallback);
    } else {
        fallback(config.provider,callback,returnDescriptions);
    }
};

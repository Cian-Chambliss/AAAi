module.exports = function (config, callback) {
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
                        callback(null,listed);
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
                    console.log(data);
                    try {
                        const obj = JSON.parse(data);
                        const listed = [];
                        const models = obj.data;
                        for(var i = 0  ; i < models.length ; ++i ) {
                            if(models[i].id)
                                listed.push(models[i].id);
                        }
                        if( listed.length )
                            callback(null,listed);
                        else
                            fallback("openai",callback);
                    }  catch (error) {
                        console.log(error);
                        fallback("openai",callback);
                    }
                });
            }).on('error', (err) => {
                fallback("openai",callback);
            });
        }
    };
    if (!config) {
        //default to ollama
        config = { provider: "ollama" };
    } else if (typeof config !== 'object') {
        config = { provider : config };
    }
    const fallback = function (provider,callback) {
        const getProviderDefinition = require("./getProviderDefinition");
        const def = getProviderDefinition(provider);
        var models = null;
        if (def) {
            if (def.models) {
                models = def.models;
            }
        }
        if( models ) {
            callback(null,models);
        } else {
            callback("Error - could not find any models",null);
        }
    };
    // Resolve the provider and call the specific dynamic handler
    if (handlers[config.provider]) {
        return handlers[config.provider](config, callback, fallback);
    } else {
        fallback(config.provider);
    }
};
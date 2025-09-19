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
        }
    };
    if (!config) {
        //default to ollama
        config = { provider: "ollama" };
    } else if (typeof config !== 'object') {
        config = { provider : config };
    }
    // Resolve the provider and call the specific dynamic handler
    if (handlers[config.provider]) {
        return handlers[config.provider](config, callback);
    } else {
        const getProviderDefinition = require("./getProviderDefinition");
        const def = getProviderDefinition(config.provider);
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
    }
};
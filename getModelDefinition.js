module.exports = function (config,callback) {
    // Normalize to base model name by stripping trailing -latest or -YYYY-MM-DD
    const getBaseModelName = function (name) {
        if (!name || typeof name !== "string") return name;
        const m = name.match(/^(.*?)-(latest|\d{4}-\d{2}-\d{2})$/);
        if (m) return m[1];
        return name;
    };

    const base = getBaseModelName(config.model || "");
    try {
        // Try to load a matching model definition JSON
        callback(null,require("./definitions/models/" + base + ".json") );
    } catch (e) {
        // If not found or invalid, return empty object
        console.log(base);
        callback(null,{});
    }
};

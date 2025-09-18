module.exports = function () {
    const textPrompt = require("./textPrompt"); 
    const ai = {
        textPrompt: textPrompt
    };
    return ai;
};
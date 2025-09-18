# AAAi

Alpha Anywhere AI integration NPM package source

Example - call an ollama endpoint.


```javascript
const aaai = require('AAAi')();
const config = {
 "provider" : "ollama",
 "model" : "qwen3-coder",
 "baseurl": "http://localhost:11434/api"
};
const prompt = 'What is the capital of France?';

aaai.textPrompt(config, prompt, function(err, result) {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Result:', result);
    }
});
```
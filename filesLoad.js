const path = require('path');

module.exports = function (files, callback , ctx ) {
    var fs = require("fs");
    var path = require('path');
    var items = [];
    var encoding = null;
    if( ctx ) {
        encoding = ctx.encoding;
    }
    import('mime').then((mime) => {
        var countDown = files.length;
        files.forEach(function(val,index) {
            var extn = path.extname(val);
            if(extn[0] == '.') {
                extn = extn.substring(1);
            }
            var item = null;
            if( encoding == "base64" ) {
                item = {
                    "type": "file",
                    "mediaType":  mime.default.getType(extn),
                    "filename": val,
                    "url": null
                };
            } else {
                item = {
                    "type": "file",
                    "mediaType":  mime.default.getType(extn),
                    "filename": val,
                    "data": null
                };
            }
            fs.readFile( val , function(err,data) {
                if( err ) {
                    countDown = 0;
                    callback(err.message, null, ctx );
                    return;
                }
                if( encoding == "base64" ) {
                    var base64String = data.toString('base64');
                    base64String = "data:image/png;base64," + base64String;
                    item.url = base64String;
                } else {
                    item.data = data;
                }
                items.push(item);
                --countDown;
                if( countDown == 0 ) {
                    callback(null,items, ctx );
                }
            });
        });
    }).catch((error) => {
        callback(error.message, null, ctx );
    });
};
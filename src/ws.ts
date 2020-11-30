export default function(uri) {
    var socket = new WebSocket(uri);
    return {
        "on" : function(name, callback) {
            if (name == "open") {
                socket.onopen = callback;
            } else if (name == "close") {
                socket.onclose = callback;
            } else if (name == "error") {
                socket.onerror = callback;
            } if (name == "message") {
                socket.onmessage = function(message) {
                    callback(message.data);
                }
            }
        },
        "send" : function(message) {
            socket.send(message);
        }
    }
}

const mongo = require('mongodb').MongoClient;
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const client = require('socket.io')(server);

// connect to mongo
mongo.connect('mongodb://spencerm:bradfordboy@ds235418.mlab.com:35418/plugwin-vi-test', function(err, db) {
    if (err) {
        throw err;
    }

    console.log('MongoDB connected...');

    // Connect to Socket.io
    client.on('connection', function(socket){
        let chat = db.collection("chats");
        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        };

        // Get chats from the collection
        chat.find().limit(100).sort({_id: 1}).toArray(function(err, res) {
            if (err) {
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // handle input events
        socket.on('input', function(data) {
            let name = data.name;
            let message = data.message;

            // Check for name and message
            if (!name || !message) {
                // Send error status
                sendStatus('You must enter a name and message');
            } else {
                // Insert message
                chat.insert({name: name, message: message}, function() {
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // handle clear
        socket.on('clear', function() {
            // Remove all chats from the collection
            chat.remove({}, function() {
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});

app.use(express.static(__dirname));

app.get('/*', function(req, res){
   res.sendFile(__dirname + '/index.html');
});

server.listen(4200);
const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.urlencoded( { extended: false}))
app.use(bodyParser.json())
app.listen((process.env.PORT || 3000))

// server index page
app.get(`/`, (req, res) => {
    res.send(`App deployed`)
})

// facebook webhook used for verification
app.get(`/webhook`, (req, res) => {
    if (req.query[`hub.verify_token`] === process.env.VERIFICATION_TOKEN) {
        console.log(`verified webhook`)
        res.status(200).send(req.query[`hub.challenge`])

    } else {
        console.error(`Verification failed. The token do not match`)
        res.sendStatus(403)

    }
})

 // all callbacks for messenger 
 app.post(`/webhook`, (req, res) => {
    // make sure that we have a page
    if (req.body.object == `page`) {
        //  iterate over each entry because there may be multiple if bached
        req.body.entry.forEach((entry) => {
            // iterate over each mesaging event
            entry.messaging.forEach((event) => {
                if (event.postback) {
                    processPostback(event)
                }
            })
        })
        res.sendStatus(200)

    }
})

function processPostback(event) {
    let senderId = event.sender.id;
    let payload = event.postback.payload;

    if (payload === "Greeting") {
      // Get user's first name from the User Profile API
      // and include it in the greeting
      request({
        url: "https://graph.facebook.com/v2.6/" + senderId,
        qs: {
          access_token: process.env.PAGE_ACCESS_TOKEN,
          fields: "first_name"
        },
        method: "GET"
      }, function(error, response, body) {
        let greeting = "";
        if (error) {
          console.log("Error getting user's name: " +  error);
        } else {
          let bodyObj = JSON.parse(body);
          name = bodyObj.first_name;
          greeting = "Hi " + name + ". ";
        }
        let message = greeting + "This is a test bot i am building for my bot development practice";
        sendMessage(senderId, {text: message});
      });
    }
  }

  // sends message to user
function sendMessage(recipientId, message) {
    request({
      url: "https://graph.facebook.com/v2.6/me/messages",
      qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
      method: "POST",
      json: {
        recipient: {id: recipientId},
        message: message,
      }
    }, function(error, response, body) {
      if (error) {
        console.log("Error sending message: " + response.error);
      }
    });
  }

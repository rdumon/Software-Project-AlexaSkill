'use strict';
var request = require("request");
let userID = null;

// var http = require('http');
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = "Welcome to the Nuffield Health Alexa Booking System. What would you like to do?";
    const repromptText = "Just say, I would like to, followed by what you want. Your options are: book a class, view availability of a class, cancel a booking or know your current bookings.";
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for using the Nuffield Skill. Have a nice day!';

    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}


//---------------------Booking SYSTEM ---------------------------
function bookClassIntent(intent, session, callback) {

    let sessionAttributes = {};
    const cardTitle = intent.name;
    let speechOutput = "What class would you like to book? Tell me time and class name. For example, you can say: book pilates on Friday";
    let repromptText = "If you would like to know the availability of a class say: I would like to know the availability of class.";
    const shouldEndSession = false;

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

}

function bookClassCommand(intent, session, callback){   

    let sessionAttributes = {};
    const cardTitle = intent.name;
    let speechOutput = '';
    let repromptText = '';
    const shouldEndSession = false;
    const className = intent.slots.Class;
    const time = intent.slots.Time;

    repromptText = "You can know the availability of a class by saying I would like to know the availability of a class!";

    if(className && time){

        request({
            url: 'http://nuffieldhealth.azurewebsites.net/classAvailable',
            method: 'POST',
                json: {
                class_title: "'"+className+"'",
                class_date: "'"+time+"'"
            }
         }, function(error, response, body){

            if(error) {
                    console.log(error);
                } else {
                    if(body.length == 0) {
                        speechOutput = "The class is not available at this time! Make sure you check the availability of a class before booking it.";
                        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                    }
                    else {
                      // session.classInformation = body;
                      // session.classTime = body[0].classTime;
                      var count = 0;
                      var intervalFunction = function(){
                          userIsLoggedin(user_session);
                          count++;
                          if(count == 3) {
                            clearInterval(myVar);
                            if(user_id_login == null) {
                                speechOutput = "The class is not available at this time! Make sure you check the availability of a class before booking it.";
                                callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));         
                            }
                            else {
                              getNuffieldID();
                              getSubscribers(session);
                              request({
                                    url: 'http://nuffieldhealth.azurewebsites.net/book_class',
                                    method: 'POST',
                                    json: {
                                        userID: userID,
                                        classID: session.classID  //what is this bruv
                                }
                            }, function(error, response, body){
                            if(error) {
                                console.log(error);
                            } else {
                                console.log("SUCCESS");
                            }

                          }
                      }
                      var myVar = setInterval(intervalFunction, 10000);


                  }
            }
            });

    } else if (!className && time){
        speechOutput = "You have not provided a class name.";
    } else if (className && !time) {
        speechOutput = "You have not provided a class time." ;
    } else {
        speechOutput = "You have not provided any information.";
    }


    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));


}

//-------------------------Canceling SYSTEM----------------------

function cancelClassIntent(intent, session, callback) {

    let sessionAttributes = {};
    const cardTitle = intent.name;
    let speechOutput = "What class would you like to cancel? Tell me time and class name. For example, you can say: cancel pilates on Friday.";
    let repromptText = "If you would like to know what classes you have booked. Say: what classes have I booked?";
    const shouldEndSession = false;

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

}


function cancelClassCommand(intent, session, callback){

    let sessionAttributes = {};
    const cardTitle = intent.name;
    let speechOutput = '';
    let repromptText = '';
    const shouldEndSession = false;
    const className = intent.slots.Class;
    const time = intent.slots.Time;

    if(className && time){

        request({
            // What do I put here !?
            url: 'http://nuffieldhealth.azurewebsites.net/cancelBooking',
            method: 'POST',
            json: {
                class_name: className,
                class_date: time
            }
        }, function(error, response, body){
            if(error) {
                console.log(error);
            } else {
                speechOutput = "The "+ className +" class has been canceled!";
            }
        });


    } else if (!className && time){
        speechOutput = "You have not provided a class name";
    } else if (className && !time) {
        speechOutput = "You have not provided a class time" ;
    } else {
        speechOutput = "You have not provided any information";
    }

    repromptText = "If you would like to know what classes you have booked. Just say, what classes have I booked?";

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

}

//---------------------Active bookings SYSTEM-----------------

function activeBookingsIntent(intent, session, callback) {


    const cardTitle = intent.name;
    let repromptText = '';
    let sessionAttributes = {};
    const shouldEndSession = false;
    var classInformation = {};
    let speechOutput = "";

    getActiveBookings(function(data) {
        classInformation = data;
        console.log(classInformation);
        if (classInformation.length == 0){
            speechOutput = "You have not booked any classes yet. Would you like to book one?";    
        } else if (classInformation.length == 1) {
            speechOutput = "You have booked 1 class! You have "+ classInformation.ClassName[0] + " at "+ classInformation[0].classTime +
                                    ", on " + classInformation[0].classDays + " which lasts " + classInformation[0].Duration + ".";
        } else {
            speechOutput = " You have booked "+ classInformation.length +" classes!";

            var classInfoBuilder = "";
            for(var i = 0; i < classInformation.length; i++){
            classInfoBuilder =  " You have "+ classInformation.ClassName[i] + " at " + classInformation[i].classTime +
                                     ", on " + classInformation[i].classDays + " which lasts " + classInformation[i].Duration + ".";
             speechOutput = speechOutput + classInfoBuilder;
            }
        }
        

        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    })


}

//------------------------------Availibility System-----------------------

function viewClassIntent(intent, session, callback) {

    let sessionAttributes = {};
    const cardTitle = intent.name;
    let speechOutput = "You can know what classes are available by class name or for a certain date. Simply say, for example, what are the gyms available on this day or ,is their pilates 24th of april"+userID;
    let repromptText = "Once you have found an available gym that you like you can say, for example, book pilates on friday the 8th of April.";
    const shouldEndSession = false;

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

}


function viewClassCommandByDate(intent, session, callback) {

    let sessionAttributes = {};
    const cardTitle = intent.name;
    let speechOutput = '';
    let repromptText = '';
    const shouldEndSession = false;
    const className = intent.slots.Class;

    if(className){

        request({
          url: 'http://nuffieldhealth.azurewebsites.net/classAvailableOnDay',
          method: 'POST',
          json: {
              class_day: "'"+classInfo.date+"'"
          }
      }, function(error, response, body){
          if(error) {
              console.log(error);
          } else {
              console.log(response.statusCode, body);
              speechOutput = "All  of these classes are available on that date: " + body.className;
      }
});

    } else {
        speechOutput = "You have not provided a correct date";
    }

    repromptText = "";

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    
    
}


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}


/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    
    if (intentName === 'BookClassIntent') {
        bookClassIntent(intent, session, callback);
    //}else if(intentName === 'BookClassCommand'){
    //    bookClassCommand(intent, session, callback);
    }else if(intentName === 'ViewClassIntent'){
        viewClassIntent(intent, session, callback);
    //}else if(intentName === 'ViewClassCommandByDate'){
    //    viewClassCommandByDate(intent, session, callback);
    }else if(intentName === 'CancelClassIntent'){
        cancelClassIntent(intent, session, callback);
    //}else if(intentName === 'CancelClassCommand'){
    //    cancelClassCommand(intent, session, callback);
    // }else if(intentName === 'ActiveBookingsIntent'){
    //     activeBookingsIntent(intent, session, callback);
    }else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    }else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log('hey!!');
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */
        //get the session ID 
        userID = event.session.sessionId;
        createCurrentSession();


        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};



//--------------------------HTTP Functions--------------------------


function getActiveBookings(callback){

    request({
        url: 'http://nuffieldhealth.azurewebsites.net/ActiveBookings', //URL to hit
        method: 'GET',
        //Lets post the following key/values as form
        body: {
          userID: "1"
        }
    }, function(error, response, body){
        if(error) {
            console.log(error);
        } else {
            console.log(response.statusCode, body);
            session.send("Your class is successfully booked!");
            session.send("OK...Is there anything else you want to do?");
    }
    })

}

// function isAvailable(className, time){

//      request({
//                 url: 'http://nuffieldhealth.azurewebsites.net/classAvailable',
//                 method: 'POST',
//                 json: {
//                     class_title: "'"+className+"'",
//                     class_date: "'"+time+"'"
//                 }
//             }, function(error, response, body){
//                 if(error) {
//                     console.log(error);
//                 } else {
//                     if(body.length == 0) {
//                       return false;
//                     }
//                     else {
//                         return true;
//                     }
//                 }
//             }
//     });

// }

// returns true if the class is in the list of existing classes
// function classNameChecker(inputClass){

//     //TODO: make sure you have all possible available classes in the array.
//     const classNames = {'yoga','pilates','cardio', 'pilate'};

//     for(var i = 0; i < classNames.length ; i++) {
//         if (inputClass.toLowerCase() === ClassNames[i].toLowerCase()) {
//             return true;
//         }
//     }
//     return false;
// }

function userIsLoggedIn(user_session) {
    
    request({
        url: 'http://nuffieldhealth.azurewebsites.net/isLoggedin',
        method: 'POST',
        json: {
            user_session: "'"+user_session+"'"
        }
    }, function(error, response, body){
        if(error) {
            console.log(error);
        } else {
            userID = body[0].user_id;
            console.log("SUCCESS" + userID);
    }
    });
}

function createCurrentSession() {

    request({
         url: 'http://nuffieldhealth.azurewebsites.net/addSession',
         method: 'POST',
         json: {
             user_session: "'"+userID+"'"
         }
     }, function(error, response, body){
         if(error) {
             console.log(error);
         } else {
             console.log("Session Created" + body);
     }
    });

}



function setStatus(message) {
    console.log(message);
    document.getElementById("loadertext").innerHTML = message;
}

let mqtt = null;
let config = null;
let myName = window.location.search.split('?')[1];

document.addEventListener("DOMContentLoaded", async function(){
    setStatus("Loading configuration");
    const response = await fetch('../config.json');
    config = await response.json();
    console.log(config);

    setStatus("Determining my name");
    if ( myName == "" || myName === undefined ) {
        console.log("There was no name provided as a query string");
        myName = document.cookie.split('; ').find(row => row.startsWith('name'));
        if ( myName !== undefined ) {
            myName = myName.split('=')[1];
            console.log("Name from cookie");
        } else {
            console.log("There was no name in a cookie either. Generating");
            myName = Math.random().toString(36).substr(2, 5);
            document.cookie = "name=" + myName;
            document.location.href = "?" + myName;
        }
    }
    setStatus("My name is " + myName);
    document.getElementById("me").innerHTML = myName;

    setStatus("Connecting to MQTT");
    mqtt = new Paho.MQTT.Client(config.brokerHostname, config.brokerWsPort, "bigwallweb-" + myName);
    mqtt.onMessageArrived = function(message) {
        console.log(message.destinationName + " " + message.payloadString);
        document.getElementsByTagName('iframe')[0].src = message.payloadString;
        document.getElementsByTagName('iframe')[0].style.display = "block";
        document.getElementById("loader").style.display = "none";
    };
    mqtt.onConnectionLost = function() {
        window.location.reload(true);
    };
    mqtt.connect({useSSL: true, onSuccess: function() {
        mqtt.subscribe(config.baseTopic + "/" + myName + "/url");
        setStatus("Waiting for instructions");
    }});
});

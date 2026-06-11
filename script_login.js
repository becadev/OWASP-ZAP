function sendingRequest(msg, initiator, helper) {
    msg.getRequestHeader().setHeader(
        "Authorization",
        "Bearer ACCESS_TOKEN"
    );
}

function responseReceived(msg, initiator, helper) {}

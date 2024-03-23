function send() {
    chrome.runtime.sendMessage({ message: "stayAlive" });
}

setInterval(send, 30000);
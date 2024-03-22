document.addEventListener("DOMContentLoaded", function () {
    // Retrieve the checkbox state from chrome.storage.local
    chrome.storage.local.get(['checkbox', 'captain_checkbox', 'gameDataPath', 'dataVersion', 'clientVersion'], function(data) {
        let isEnabled = data.checkbox || false;
        document.getElementById("checkbox").checked = isEnabled;

        let captainEnabled = data.captain_checkbox || false;
        document.getElementById("captain_checkbox").checked = captainEnabled;
        console.log("Set checkbox state from storage");

        // Display the strings in the info_container div
        let infoContainer = document.getElementById("info_container");
        infoContainer.innerHTML = `
            <p><b>Game Data Path:</b> ${data.gameDataPath || 'N/A'}</p>
            <p><b>Data Version:</b> ${data.dataVersion || 'N/A'}</p>
            <p><b>Client Version:</b> ${data.clientVersion || 'N/A'}</p>
        `;
    });

    // Listen for click event on the checkbox
    document.getElementById("checkbox").addEventListener('click', function () {
        let isChecked = this.checked;
        chrome.storage.local.set({ 'checkbox': isChecked }, function() {
            console.log("Checkbox state saved.");
        });
    });

    document.getElementById("captain_checkbox").addEventListener('click', function () {
        let isChecked = this.checked;
        chrome.storage.local.set({ 'captain_checkbox': isChecked }, function() {
            console.log("Checkbox state saved.");
        });
    });
});

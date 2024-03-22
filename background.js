//Listens for messages from the popup script containing the toggle switch states and send them to the content script.
'use strict';

async function getCookies() {

  //Get cookies for http request
  chrome.cookies.getAll({ url: 'https://www.streamraiders.com/' }, function (cookies) {
    // Process the retrieved cookies
    if (cookies && cookies.length > 0) {
      return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    } else {
      return ""
    }
  });
}

// Reloader for when the game data changes
async function checkGameData() {
  const response = await fetch('https://www.streamraiders.com/api/game/?cn=getUser&command=getUser');
  const data = await response.json();
  const dataVersion = data.info.dataVersion
  const clientVersion = data.info.version
  if (data.info.dataPath) {
    const dataPath = data.info.dataPath;

    chrome.storage.local.get("gameDataPath", function (result) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }

      const gameDataPath = result.gameDataPath;

      if (!gameDataPath) {
        chrome.storage.local.set({ "gameDataPath": dataPath });
        chrome.storage.local.set({ "dataVersion": dataVersion });
        chrome.storage.local.set({ "clientVersion": clientVersion });
        updateQuests(dataPath)
      } else if (gameDataPath !== dataPath) {
        chrome.storage.local.set({ "gameDataPath": dataPath });
        chrome.storage.local.set({ "dataVersion": dataVersion });
        chrome.storage.local.set({ "clientVersion": clientVersion });
        updateQuests(dataPath)
        console.log("New game data path set successfully.");
      }
    });
  }
}

async function updateQuests(dataPath) {
  const response = await fetch(dataPath);
  const data = await response.json();
  const quests = data.sheets.Quests
  chrome.storage.local.set({ "quests": quests }, () => {
    console.log("Quests saved in local storage:", quests);
  });
}


async function collectQuests() {
  const cookieString = await getCookies()
  const { checkbox, captain_checkbox, clientVersion, dataVersion, quests } = await getDataFromLocalStorage();
  if (!checkbox) {
    return
  }
  let isCaptain = "0";
  if (captain_checkbox) {
    isCaptain = "1"
  }

  const questsUrl = (
    "https://www.streamraiders.com/api/game/?cn=getUserQuests&clientVersion="
    + clientVersion
    + "&clientPlatform=WebGL&gameDataVersion="
    + dataVersion
    + "&command=getUserQuests&isCaptain=" + isCaptain
  )
  const response = await fetch(questsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieString,
    },
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const currentQuests = await response.json();
  const questData = currentQuests.data

  for (let quest of questData) {
    const questId = quest.currentQuestId
    const questSlotId = quest.questSlotId
    const completedQuests = quest.completedQuestIds

    if (!questId) {
      continue
    }

    if (questId && completedQuests && completedQuests.includes(questId)) {
      continue;
    }

    const currentProgress = quest.currentProgress
    let currentProgressInt = 0
    try {
      currentProgressInt = parseInt(currentProgress);
    } catch (error) {
      continue
    }

    for (const node in quests) {
      if (Object.hasOwnProperty.call(quests, node)) {
        if (node === questId) {
          const nodeKey = quests[node];
          const nodeAmount = nodeKey["GoalAmount"];
          if (currentProgressInt >= nodeAmount) {
            const questUrl = ("https://www.streamraiders.com/api/game/?cn=collectQuestReward&slotId=" +
              questSlotId +
              "&autoComplete=False&clientVersion=" +
              clientVersion +
              "&clientPlatform=WebGL&gameDataVersion=" +
              dataVersion +
              "&command=collectQuestReward&isCaptain=" + isCaptain)
            await fetch(questUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookieString,
              },
            });
            break
          }
        }
      }
    }
  }
}

async function getDataFromLocalStorage() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["checkbox", "captain_checkbox", "clientVersion", "dataVersion", "quests"], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

//Set checkbox to false as default and update variables from the the game
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      "checkbox": false,
      "captain_checkbox": false
    });
    checkGameData()
  }
});


setInterval(checkGameData, 60000);
setInterval(collectQuests, 20000);
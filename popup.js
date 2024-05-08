window.onload = () => {
    loadGroups();
    const groupTabsButton = document.getElementById("groupTabsButton");
    groupTabsButton.addEventListener("click", async () => {
        chrome.runtime.sendMessage({message: "groupTabs"});
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for the tabs to be grouped
        loadGroups();
    });
};

function loadGroups() {
    // Clear existing groups
    const existingGroups = document.getElementsByClassName("group");
    while (existingGroups[0]) {
        existingGroups[0].parentNode.removeChild(existingGroups[0]);
    }

    // Retrieve current groups and display them in popup
    getTabGroups().then(groups => {
      for (const group of groups) {
        const button = document.createElement("button");
        button.textContent = `Save Group ${group.title}`;
        button.className = "btn btn-primary mb-3";
        button.addEventListener("click", () => {
          // Save group information in storage
          chrome.tabs.query({ groupId: group.id }, (tabs) => {
            const groupInfo = { groupId: group.id, title: group.title, tabs: tabs.map(tab => tab.url) };
            chrome.storage.local.set({ [group.title]: groupInfo }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Error saving group info:", chrome.runtime.lastError.message);
                } else {
                    location.reload(); // Reload the popup to reflect the saved group
                }
            });
          });
        });
        document.getElementById("groups").appendChild(button);
      }
    });

    // Retrieve saved groups and display them in popup
    getSavedGroups().then(items => {
      for (const [groupTitle, groupInfo] of Object.entries(items)) {
        const groupDiv = document.createElement("div");
        groupDiv.className = "card mb-3";

        const cardBody = document.createElement("div");
        cardBody.className = "card-body";
        groupDiv.appendChild(cardBody);

        const title = document.createElement("h5");
        title.textContent = `Group ${groupInfo.title}`;
        title.className = "card-title";
        cardBody.appendChild(title);

        if (groupInfo.tabs) {
            const tabs = document.createElement("p");
            tabs.textContent = groupInfo.tabs.join(", ");
            tabs.className = "card-text";
            cardBody.appendChild(tabs);
        }

        const restoreButton = document.createElement("button");
        restoreButton.textContent = `Restore Group ${groupInfo.title}`;
        restoreButton.className = "btn btn-success mb-3";
        restoreButton.addEventListener("click", () => {
          // Restore group from storage
          for (const url of groupInfo.tabs) {
            chrome.tabs.create({ url }, (tab) => {
              chrome.tabs.group({ tabIds: [tab.id] }).then((groupId) => {
                // Set the group title to the domain name
                chrome.tabGroups.update(groupId, { title: groupInfo.title });
              }).catch((error) => {
                console.error("Error restoring tab group:", error);
              });
            });
          }
        });
        cardBody.appendChild(restoreButton);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = `Delete Group ${groupInfo.title}`;
        deleteButton.className = "btn btn-danger mb-3";
        deleteButton.addEventListener("click", () => {
          // Delete group from storage
          chrome.storage.local.remove(groupTitle, () => {
            if (chrome.runtime.lastError) {
                console.error("Error deleting group info:", chrome.runtime.lastError.message);
            } else {
                // Remove the group info and buttons from the popup
                groupDiv.remove();
            }
          });
        });
        cardBody.appendChild(deleteButton);

        document.getElementById("groups").appendChild(groupDiv);
      }
    });
}

function getTabGroups() {
    return new Promise((resolve, reject) => {
        chrome.tabGroups.query({}, (groups) => {
            if (chrome.runtime.lastError) {
                console.error("Error getting groups:", chrome.runtime.lastError.message);
                reject(chrome.runtime.lastError);
            } else {
                resolve(groups);
            }
        });
    });
}

function getSavedGroups() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(null, (items) => {
            if (chrome.runtime.lastError) {
                console.error("Error getting saved groups:", chrome.runtime.lastError.message);
                reject(chrome.runtime.lastError);
            } else {
                resolve(items);
            }
        });
    });
}

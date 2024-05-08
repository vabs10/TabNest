chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "groupTabs") {
      groupTabs();
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  if (!tab.draggable) {
      groupTabs();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.draggable && changeInfo.url) {
      groupTabs();
  }
});

function groupTabs() {
  chrome.tabs.query({}, (tabs) => {
      const domains = {};
      for (const tab of tabs) {
          if (!tab.draggable) {
              try {
                  const url = new URL(tab.url);
                  const hostname = url.hostname;
                  if (!domains[hostname]) {
                      domains[hostname] = [];
                  }
                  domains[hostname].push(tab.id);
              } catch (error) {
                  console.error("Error parsing URL:", error);
              }
          }
      }

      for (const [domain, tabIds] of Object.entries(domains)) {
          if (tabIds.length > 1) {
              chrome.tabs.group({ tabIds }).then((groupId) => {
                  // Set the group title to the domain name
                  chrome.tabGroups.update(groupId, { title: domain });
              }).catch((error) => {
                  console.error("Error creating tab groups:", error);
              });
          }
      }
  });
}


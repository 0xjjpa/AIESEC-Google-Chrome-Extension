regExMyAIESEC = new RegExp(/http:\/\/www.myaiesec.net\/exchange\/*/);
heyAIESEC = null;
		
chrome.windows.onCreated.addListener(function(window) {
	//if(heyAIESEC) chrome.windows.remove(window.id);
});

// Listen for any changes to the URL of our tab
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  var match = regExMyAIESEC.exec(tab.url);
  if(match) { // To make sure we only affect myaiesec windows.
	heyAIESEC = 'What\'s up!';
	chrome.pageAction.show(tab.id);
    chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.sendRequest(tab.id, { state: "onDemand"}, function(response) {
			console.log(response.data);
	   });
	});
  }
});
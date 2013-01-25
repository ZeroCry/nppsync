﻿var nppSyncData = {};

function updateIcon(tabId, show, enabled) {
	if (show) {
		chrome.pageAction.show(tabId);
		if (enabled) {
			chrome.pageAction.setIcon({
				tabId : tabId,
				path : "icon_19_enabled.png"
			});
			chrome.pageAction.setTitle({
				tabId : tabId,
				title : "NppSync is enabled."
			});
		} else {
			chrome.pageAction.setIcon({
				tabId : tabId,
				path : "icon_19_disabled.png"
			});
			chrome.pageAction.setTitle({
				tabId : tabId,
				title : "NppSync is disabled."
			});
		}
	} else {
		chrome.pageAction.hide(tabId);
	};
};

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (changeInfo.status != "complete") { return };
	if (tab.url.indexOf('file:///') < 0) { return };
	
	if (nppSyncData[tabId] === undefined) {
		nppSyncData[tabId] = {
			enabled : false,
			hash : ""
		};
		updateIcon(tabId, true, false);
		return;
	};
	
	if (nppSyncData[tabId].enabled) { 
        updateIcon(tabId, true, true)
    } else { 
        updateIcon(tabId, true, false) 
    };	
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) { 
    delete nppSyncData[tabId]; 
});

chrome.pageAction.onClicked.addListener(function (tab) {
	if (!nppSyncData[tab.id].enabled) {
		nppSyncData[tab.id].enabled = true;
		updateIcon(tab.id, true, true);
		chrome.alarms.create("NppSync:" + tab.id, {
			delayInMinutes : 0.016
		});
	} else {
		nppSyncData[tab.id].enabled = false;
		updateIcon(tab.id, true, false);
	};
});

chrome.alarms.onAlarm.addListener(function (a) {
    if (a.name.indexOf("NppSync:") < 0) { return };
	var tabId = parseInt(a.name.split(":")[1]);
    chrome.tabs.get(tabId, function(tab) {
        if (tab === undefined) { 
            delete nppSyncData[tabId];
            return;
        };
        f = encodeURIComponent(tab.url.split("///")[1]);
        var r = new XMLHttpRequest();
        r.open("GET", "http://localhost:40500/" + f, true);
        r.onreadystatechange = function() {
            if (r.readyState == 4) {
                chrome.tabs.get(tabId, function(tab) {
                    if (tab !== undefined) { 
                        if (r.responseText != nppSyncData[tabId].hash) {
                            nppSyncData[tabId].hash = r.responseText;
                            chrome.tabs.reload(tabId, {bypassCache: true});
                        };
                        if (nppSyncData[tabId].enabled) {
                            chrome.alarms.create("NppSync:" + tabId, {delayInMinutes: 0.016});
                        };
                    };
                });             
            };
        };
        r.send();
    });
});
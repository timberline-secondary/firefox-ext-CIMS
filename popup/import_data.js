/**
 * Created by couture on 26/01/18.
 */

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute beastify content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.executeScript({file: "/content_scripts/jquery-3.3.1.min.js"});
browser.tabs.executeScript({file: "/content_scripts/importmarks.js"});
// .then(listenForClicks)
// .catch(reportExecuteScriptError);
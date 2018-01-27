/**
 * Created by couture on 26/01/18.
 */
/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
    document.addEventListener("click", (e) => {

        function importMarks(tabs) {
            browser.tabs.sendMessage(tabs[0].id, {
                command: "importMarks",
            });
        }

        /**
         * Just log the error to the console.
         */
        function reportError(error) {
            console.error(`Could not beastify: ${error}`);
        }

        /**
         * Get the active tab,
         * then call "importMarks()" or "reset()" as appropriate.
         */
        if (e.target.classList.contains("import")) {
            browser.tabs.query({active: true, currentWindow: true})
                .then(importMarks)
                .catch(reportError);
        }
    });
}


/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
    document.querySelector("#popup-content").classList.add("hidden");
    document.querySelector("#error-content").classList.remove("hidden");
    console.error(`Failed to execute content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.executeScript({file: "/content_scripts/jquery-3.3.1.min.js"});
browser.tabs.executeScript({file: "/content_scripts/importmarks.js"})
    .then(listenForClicks)
    .catch(reportExecuteScriptError);
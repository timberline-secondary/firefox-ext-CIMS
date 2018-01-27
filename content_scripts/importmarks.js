/**
 * Created by couture on 26/01/18.
 */

/**
 * Convenience function to help find matching names
 * @param char
 */
String.prototype.a = function () {
    return this.trim().toUpperCase();
};
String.prototype.b = function () {
    let re = /[^A-Za-z\\s]+/g; // all non letters
    return this.replace(re, "").toUpperCase();
};

(function () {
    /**
     * Check and set a global guard variable.
     * If this content script is injected into the same page again,
     * it will do nothing next time.
     */
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;


    /**
     * Given a URL to a beast image, remove all existing beasts, then
     * create and style an IMG node pointing to
     * that image, then insert the node into the document.
     */
    function importMarks() {
        let jsonMarkData = prompt("Paste JSON Mark Data");
        // console.log(jsonMarkData);
        jsonMarkData = jQuery.parseJSON(jsonMarkData);
        console.log("Data length: " + jsonMarkData.length);
        // console.log(jsonMarkData);
        let $rowsNotFound = $();

        let $markstable = $('table#FormContentPlaceHolder_FormContentPlaceHolder_ContentPlaceHolder1_GradeList');
        //$markstable.css('background-color', 'red');
        let $rows = $markstable.find('tr').slice(2, -2); //first & last two rows are headers/footers, remove

        $rows.each(function( index ) {
            let found = false;
            let $this = $(this);
            let firstname = $this.find('td:nth-child(2)').text();
            let lastname = $this.find('td:nth-child(1)').text();
            let $term2 = $this.find('td > input[name*=IGR02]');
            let $finrk = $this.find('td > input[name*=IGR08]');


            function matchLast(student) {
                return student['Last Name'].b() === lastname.b();
            }

            function matchFirst(student) {
                return student['First Name'].b() === firstname.b();
            }

            function matchBothNames(student) {
                return matchLast(student) && matchFirst(student);
            }


            function removeFoundStudent(student) {
               let index = jsonMarkData.indexOf(student);
               jsonMarkData.splice(index,1);
            }

            function processResults(students) {
                if (students.length == 1) { // exact match found
                    let mark = Math.min( Math.round(parseFloat(students[0].Mark)), 100);
                    $finrk.val(mark);
                    $term2.val(mark);
                    $this.css('background-color', 'lightgreen');
                    found = true;
                    removeFoundStudent(students[0]);
                    return true;
                }
                else {
                    return false;
                }
            }

            if (firstname.length > 1) { // entry isn't blank(ish)... empty cells have a space?
                // MATCH BOTH NAMES EXACT
                found = processResults( $.grep(jsonMarkData, matchBothNames) );
                if (!found) { // student may have netered a nickname, hope for unique last name
                    found = processResults( $.grep(jsonMarkData, matchLast) );
                }
                if (!found) { // last resort... unique first name?
                    found = processResults( $.grep(jsonMarkData, matchLast) );
                }

                if (!found) { // no unique exact match yet
                    $rowsNotFound += $this;
                    $this.css('background-color','lightcoral');
                    console.log(`Match not found:  ${firstname} ${lastname}`);
                }
            }


        });

        console.log("Data length after: " + jsonMarkData.length);

    }


    /**
     * Listen for messages from the background script.
     * Call "importMarks()" or "reset()".
     */
    browser.runtime.onMessage.addListener((message) => {
        if (message.command === "importMarks") {
            importMarks();
        }
    });

})();






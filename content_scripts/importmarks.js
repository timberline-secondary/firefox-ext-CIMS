/**
 * Created by couture on 26/01/18.
 */

/**
 * Convenience function to help find matching names
 */
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
     * Paste JSON data into the prompt and it will enter the marks into CIMS
     */
    function importMarks() {
        let jsonMarkData = prompt("Paste JSON Mark Data");
        // console.log(jsonMarkData);
        jsonMarkData = jQuery.parseJSON(jsonMarkData).data;
        console.log("Data length: " + jsonMarkData.length);

        // check for required fields
        let teststudent = jsonMarkData[0];
        let errorMessage = "";
        let missingField = false;
        if( !("First Name" in teststudent) ) {
          errorMessage += "[First Name] field not found.\n";
          missingField = true;
        }
        if( !("Last Name" in teststudent) ) {
            errorMessage += "[Last Name] field not found.\n";
            missingField = true;
        }
        if( !("Mark" in teststudent) ) {
            errorMessage += "[Mark] field not found.\n";
            missingField = true;
        }

        if( missingField) {
          errorMessage+="Make sure your JSON export inclueds these fields."
          alert(errorMessage);
          return false;
        }



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
            // console.log(`Searching for: ${firstname} ${lastname}`)
            let $termMark = $this.find('td > input[name*=IGR01]');
            let $wkHabit = $this.find('td > input[name*=IGR02]');
            let $finrk = $this.find('td > input[name*=IGR06]');

            function matchLast(student) {
                last1 = student['Last Name'].b();
                last2 = lastname.b();
                // if (last1 === last2)
                //     console.log(`Found a match: ${last1} == ${last2} --> ${last1 === last2}`);

                return last1 === last2;
            }

            function matchFirst(student) {
                // console.log(" *** Matching FIRST name.");
                first1 = student['First Name'].b();
                // console.log(first1);
                first2 = firstname.b();
                // console.log(first2);
                // console.log( `${first1} == ${first2} --> ${first1 === first2}`)
                // if (first1 === first2)
                //     console.log(`Found a match: ${first1} == ${first2} --> ${first1 === first2}`);
                return first1 === first2;
            }

            function matchBothNames(student) {
                let found = matchLast(student) && matchFirst(student);
                // console.log(`Matching both names: ${found}`);
                return found;
            }

            function removeFoundStudent(student) {
               let index = jsonMarkData.indexOf(student);
               jsonMarkData.splice(index,1);
            }

            function getWorkHabit(mark) {
                if (mark > 72.5)
                    return "G"
                else if (mark > 59.5)
                    return "S"
                else
                    return "N"
            }

            function processResults(students) {
                if (students.length == 1) { // exact match found
                    let mark = Math.min( Math.round(parseFloat(students[0].Mark)), 100);
                    $finrk.val(mark);
                    $termMark.val(mark);
                    $wkHabit.val(getWorkHabit(mark))
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
                // console.log("First check if exact name match is found");
                matches = $.grep(jsonMarkData, matchBothNames)
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

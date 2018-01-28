/**
 * Created by couture on 27/01/18.
 */

// // CREATE A DATA FILE at content_scripts/data.js:
//
// // CSV to Keyed JSON
// // http://www.convertcsv.com/csv-to-json.htm
// let studentData;
// studentData = {};

(function () {

    /**
     * Check and set a global guard variable.
     * If this content script is injected into the same page again,
     * it will do nothing next time.
     */
    if (window.attendanceByKeypadhasRun) {
        return;
    }
    window.attendanceByKeypadhasRun = true;


    // Block Schedule Data. https://stackoverflow.com/a/6212411/2700631
    let blocks = {
        1 : {
            'name': 'A',
            'start':"08:55"
        },
        2 : {
            'name': 'B',
            'start':"10:35"
        },
        3 : {
            'name': 'C',
            'start':"12:25"
        },
        4 : {
            'name': 'D',
            'start':"13:50"
        }
    };


    let modalDlg = `<!-- Modal -->
      <div class="modal fade" id="keypadEntryModal" tabindex="-1" role="dialog" aria-labelledby="keypadEntryModal">
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span
                  aria-hidden="true">&times;</span></button>
              <h4 class="modal-title" id="myModalLabel">Attendance Keypad Entry</h4>
            </div>
            <div class="modal-body">
              <h1>Enter Student Number:<span id="clock" class="pull-right">CLOCK</span></h1>
              <input id="studentNumberField" type="text" name="studentNumber" class="form-control" value="99">
              <h1 id="keypadResult"></h1>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" id="keypadEnter">Enter</button>
            </div>
          </div>
        </div>
      </div>`;

    $('body').append(modalDlg);

    let $modal = $('#keypadEntryModal');
    let $numberField = $("#studentNumberField");
    let $confirmBtn = $("#keypadEnter");
    let $results = $("#keypadResult");
    let $title = $("#myModalLabel");

    let $table = $('table#FormContentPlaceHolder_FormContentPlaceHolder_ContentPlaceHolder1_AttList');
    let $rows = $table.find('tr').slice(2, -2); //first & last two rows are headers/footers, remove

    let period, block;

    function updateclock() {
        let start = blocks[period].start


        let date = new Date();
          let ampm = date.getHours() < 12
             ? 'AM'
             : 'PM';
          let hr = date.getHours() == 0
                      ? 12
                      : date.getHours() > 12
                        ? date.getHours() - 12
                        : date.getHours();

          let min = date.getMinutes() < 10
                        ? '0' + date.getMinutes()
                        : date.getMinutes();

          let sec = date.getSeconds() < 10
                        ? '0' + date.getSeconds()
                        : date.getSeconds();

          let timeString = `${hr}:${min}:${sec} ${ampm}`;

          $('#clock').html(timeString);
    }


    function setBlock() {
        let $period = $('select[name*=OPERIODN]');
        period = parseInt( $period.text() );
        block = blocks[period].name;

        $title.html(`Attendance Keypad Entry for <b>${block} Block</b>`);
        updateclock()
        window.setInterval(updateclock, 1000);
    }


    function resetKeyInput() {
        $numberField.focus();
        $numberField.val("");
        $numberField.val("99");
        // fancy footwork seems to be required to get the cursor to appear at the end of the 99
    }

    // Bind "Enter" key to the submit button:
    $numberField.keyup(function (event) {
        if (event.keyCode == 13) {
            $confirmBtn.click();
        }
    });

    let timer;

    // When the enter button is click (via enter key also) set absent to false on form for that student
    $confirmBtn.click(function (e) {

        // studentData format: (duplicates possible)
            // "9912345": [
            //     {
            //         "LAST NAME": "JOHN           ",
            //         "FIRST NAME": "DOE         "
            //     },
            //     {
            //         "LAST NAME": "JOHN           ",
            //         "FIRST NAME": "DOE         "
            //     }
            // ],

        // FIND THE STUDENT IN THE DATA
        let results, lastname, firstname, $row;
        try {
            let studentNumber = $numberField.val();
            if( studentNumber.length != 7 ) throw {'msg': `INVALID NUMBER: ${studentNumber}`, 'style': 'danger' };

            let student = studentData[studentNumber];
            if (student == undefined) throw {'msg': `NOT FOUND: ${studentNumber}`, 'style': 'danger' };

            // STUDENT FOUND
            lastname = student[0]["LAST NAME"].trim();
            firstname = student[0]["FIRST NAME"].trim();
            results = `${firstname} ${lastname}`;
            $results.attr('class',`text-success`);

            // FIND THE ROW BY NAME
            $row = $rows.filter(function(index) {
                let $this = $(this);
                let firstnameRow = $this.find('td:nth-child(8)').text().trim();
                let lastnameRow = $this.find('td:nth-child(9)').text().trim();
                return  firstnameRow === firstname && lastnameRow === lastname;
            });

            if ($row.length == 0) throw {'msg': `${firstname} ${lastname}:\nWRONG BLOCK GET OUT!`, 'style': 'warning' };
            let $absentCheckBox = $row.find('input[name*=chkA]');
            let $lateCheckBox = $row.find('input[name*=chkT]');

            $absentCheckBox.prop('checked', false);

        }
        catch(err) {
            results = err.msg;
            $results.attr('class',`text-${err.style}`);
        }
        finally {
            $results.html(results);
            resetKeyInput();

            clearTimeout(timer);
            timer = window.setTimeout(function(){
                $results.html("");
            }, 5000);

        }



    });


    function absentByDefault() {
        $chkA = $table.find('input[name*=chkA]');
        $chkA.prop('checked', true);
    }

    /**
     * Initiate Keypad Attendance Entry
     */
    function attendanceByKeypad() {

        $modal.modal();
        $results.html("");
        setBlock();

        $modal.on('shown.bs.modal', function () {
            resetKeyInput();
        });

        console.log("Attendancing!!");
    }

    function attendanceInit() {
        absentByDefault();
    }


    /**
     * Listen for messages from the background script.
     * Call "importMarks()" or "reset()".
     */
    browser.runtime.onMessage.addListener((message) => {
        if (message.command === "attendanceByKeypad") {
            attendanceByKeypad();
        }
        if (message.command === "attendanceInit") {
            attendanceInit();
        }
    });

})();
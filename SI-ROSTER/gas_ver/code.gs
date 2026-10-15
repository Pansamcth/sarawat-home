const API_BASE_URL = "https://spell-everything-work-designers.trycloudflare.com/api";

function doGet(e) {
    let t = HtmlService.createTemplateFromFile("index");
    t.page = (e && e.parameter && e.parameter.page) ? e.parameter.page : "";
    t.id = (e && e.parameter && e.parameter.id) ? e.parameter.id : "";
    return t.evaluate()
        .setTitle("ระบบลงหน้าที่สารวัตรนักเรียน - โรงเรียนเดชะปัตนยานุกูล")
        .addMetaTag("viewport", "width=device-width, initial-scale=1")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function callApi(method, args = []) {
    var options = {
        method: 'post',
        contentType: 'application/json',
        headers: {
            'ngrok-skip-browser-warning': 'true',
            'Bypass-Tunnel-Reminder': 'true'
        },
        payload: JSON.stringify({ args: args }),
        muteHttpExceptions: true
    };
    try {
        var response = UrlFetchApp.fetch(API_BASE_URL + "/gas/" + method, options);
        var data = JSON.parse(response.getContentText());
        if (data.success) {
            return data.result;
        } else {
            throw new Error("ERROR (400) : " + data.message + " - กรุณารีเฟรชหน้าเว็บ");
        }
    } catch (e) {
        console.error("API Fetch Error in " + method + ": ", e);
        let errorMsg = e.message || String(e);

        if (errorMsg.includes("ERROR (400)")) {
            throw e;
        } else if (errorMsg.includes("DNS") || errorMsg.includes("fetch") || errorMsg.includes("timeout") || errorMsg.includes("ข้อผิดพลาดของ DNS")) {
            throw new Error("ERROR (507) : ปัญหาเกี่ยวกับการเชื่อมต่อเซิร์ฟเวอร์ กรุณาติดต่อผู้พัฒนา");
        } else if (errorMsg.includes("JSON") || errorMsg.includes("parse") || errorMsg.includes("Unexpected token")) {
            throw new Error("ERROR (502) : ปัญหาเกี่ยวกับการอ่านข้อมูลเซิร์ฟเวอร์ กรุณาติดต่อผู้พัฒนา");
        } else {
            throw new Error("ERROR (500) : ระบบขัดข้อง กรุณารีเฟรชหน้าเว็บ");
        }
    }
}

// Delegate all backend functions to Node API
function getStudents() { return callApi('getStudents'); }
function getCalendarData(month, year) { return callApi('getCalendarData', [month, year]); }
function getUpcomingActivities() { return callApi('getUpcomingActivities'); }
function getAllActivities() { return callApi('getAllActivities'); }
function getSignupsForActivity(sheetName) { return callApi('getSignupsForActivity', [sheetName]); }
function checkStudentStatus(studentName) { return callApi('checkStudentStatus', [studentName]); }
function saveSignup(dateString, sheetName, duty, name, grade) { return callApi('saveSignup', [dateString, sheetName, duty, name, grade]); }
function verifyAdmin(user, pass, ip) { return callApi('verifyAdmin', [user, pass, ip]); }
function getAdmins() { return callApi('getAdmins'); }
function saveAdmin(user, pass, name, role) { return callApi('saveAdmin', [user, pass, name, role]); }
function editAdmin(oldUser, newUser, newPass, newName, newRole) { return callApi('editAdmin', [oldUser, newUser, newPass, newName, newRole]); }
function deleteAdmin(user, currentUser) { return callApi('deleteAdmin', [user, currentUser]); }
function saveActivity(sheetNameId, dateString, title, description, dutiesJsonString, startTimeString, deadlineString, viewMode, endDateString, allowMultipleDuties, creatorName, adminName) { return callApi('saveActivity', [sheetNameId, dateString, title, description, dutiesJsonString, startTimeString, deadlineString, viewMode, endDateString, allowMultipleDuties, creatorName, adminName]); }
function deleteActivity(sheetNameId, adminName) { return callApi('deleteActivity', [sheetNameId, adminName]); }
function deleteSignup(sheetName, row, adminName) { return callApi('deleteSignup', [sheetName, row, adminName]); }
function importStudentsList() { return callApi('importStudentsList'); }
function getAppInitData() { return callApi('getAppInitData'); }
function getActivityLogs() { return callApi('getActivityLogs'); }
function getDashboardStats() { return callApi('getDashboardStats'); }
function getDuties() { return callApi('getDuties'); }
function addDuty(dutyName) { return callApi('addDuty', [dutyName]); }
function deleteDuty(dutyName) { return callApi('deleteDuty', [dutyName]); }
function editDuty(oldDutyName, newDutyName) { return callApi('editDuty', [oldDutyName, newDutyName]); }
function reorderDuties(dutiesArray) { return callApi('reorderDuties', [dutiesArray]); }
function getConfig(key, defaultValue) { return callApi('getConfig', [key, defaultValue]); }
function setConfig(key, value) { return callApi('setConfig', [key, value]); }
function addStudent(name, grade) { return callApi('addStudent', [name, grade]); }
function deleteStudent(name) { return callApi('deleteStudent', [name]); }
function editStudent(oldName, oldGrade, newName, newGrade) { return callApi('editStudent', [oldName, oldGrade, newName, newGrade]); }
function randomizeSignups(dateString, sheetName, targetDuty, excludeSheetName) { return callApi('randomizeSignups', [dateString, sheetName, targetDuty, excludeSheetName]); }
function getAllUpcomingSignups() { return callApi('getAllUpcomingSignups'); }
function adminMoveSignup(dateString, sheetName, row, newDuty, studentName, adminName) { return callApi('adminMoveSignup', [dateString, sheetName, row, newDuty, studentName, adminName]); }
function adminAddSignup(dateString, sheetName, duty, name, grade, adminName) { return callApi('adminAddSignup', [dateString, sheetName, duty, name, grade, adminName]); }
function getCompleteActivitiesSummary() { return callApi('getCompleteActivitiesSummary'); }
function getSingleActivitySummary(sheetName) { return callApi('getSingleActivitySummary', [sheetName]); }
function getMultiActivitySummary(sheetNames) { return callApi('getMultiActivitySummary', [sheetNames]); }
function getNtpTime() { return callApi('getNtpTime'); }
// trigger push
function bulkDeleteSignups(sheetName, rows, adminName) { return callApi('bulkDeleteSignups', [sheetName, rows, adminName]); }

//// ConnectLineB2BConnector.setMasterData 
/// ----------------------------------------------------
/// LAST UPDATE -> 2022-06-15 15:51 - galex
/// ----------------------------------------------------
lib.include("ConnectLineEshopCommon.common");

// ---------------------------------------------------------------
// DESCRIPTION: Creates or updates the customer.
// ---------------------------------------------------------------
function setCustomer(obj) {
    debugger
    if (!fieldHasValue(obj.name) && !fieldHasValue(obj.key))
        return responseError("Customer Name is required!", false);

    var respmsg = "";
    var isUpdate = fieldHasValue(obj.key);
    var objTRDR = X.CREATEOBJ("CUSTOMER");
    var tblTRDR = objTRDR.FINDTABLE("TRDR");

    var newid = 0;
    try {
        var response = initializeResponse(false);
        if (obj.key) {
            objTRDR.DBLOCATE(obj.key);
        }
        else {
            objTRDR.DBINSERT;
        }
        tblTRDR.EDIT;

        if (isUpdate == false) {
            if (fieldHasValue(obj.code))
                tblTRDR.CODE = obj.code;
            // else if (fieldHasValue(obj.name))
            //     tblTRDR.CODE = obj.name;
            else
                tblTRDR.CODE = '*';
        }

        if (fieldHasValue(obj.name) && !fieldHasValue(obj.key))
            tblTRDR.NAME = obj.name;


        if (obj.afm) tblTRDR.AFM = obj.afm;
        if (obj.irsdata) tblTRDR.IRSDATA = obj.irsdata;
        if (obj.email) tblTRDR.EMAIL = obj.email;
        if (obj.phone1) tblTRDR.PHONE01 = obj.phone1;
        if (obj.phone2) tblTRDR.PHONE02 = obj.phone2;
        if (obj.fax) tblTRDR.FAX = obj.fax;
        if (obj.address) tblTRDR.ADDRESS = obj.address;
        if (obj.zip) tblTRDR.ZIP = obj.zip;
        if (obj.district) tblTRDR.DISTRICT = obj.district;
        if (obj.city) tblTRDR.CITY = obj.city;
        if (obj.remarks) tblTRDR.REMARKS = obj.remarks;
        if (obj.jobtypetrd) tblTRDR.JOBTYPETRD = obj.jobtypetrd;
        if (obj.trdcategory) tblTRDR.TRDCATEGORY = obj.trdcategory;

        newid = objTRDR.DBPOST;
        if (obj.key)
            response.customer_id = obj.key;
        else
            response.customer_id = newid;
    }
    catch (e) {
        return responseError("Error in posting data. Error Message: " + e.message, false);
    }
    finally {
        obj.FREE;
        obj = null;
    }

    return response;
}


function searchSalesman(vSfId, vSfName) {
    if (vSfName == "" || vSfName == null || vSfName == undefined)
        return null;
    /*Search Salesman by Salesforce ID*/
    vId = X.SQL("SELECT A.PRSN FROM PRSN A WHERE A.COMPANY=:1 AND A.SODTYPE=20 AND A.CCCCLSFID=:2 "
        + " AND EXISTS (SELECT 1 FROM PRSEXT WHERE A.PRSN=PRSEXT.PRSN AND PRSEXT.SODTYPE=30 "
        + " AND PRSEXT.ISACTIVE=1 AND PRSEXT.COMPANY=:3)", X.SYS.COMPANY, vSfId, X.SYS.COMPANY);

    if (vId > 0)
        return vId;



    /*Search Salesman by Name and property Salesman*/
    vId = X.SQL("SELECT A.PRSN FROM PRSN A WHERE A.COMPANY=:1 AND A.SODTYPE=20 AND A.NAME + ' ' + A.NAME2 = :2 "
        + " AND EXISTS (SELECT 1 FROM PRSEXT WHERE A.PRSN=PRSEXT.PRSN AND PRSEXT.SODTYPE=30 "
        + " AND PRSEXT.ISACTIVE=1 AND PRSEXT.COMPANY=:3)", X.SYS.COMPANY, vSfName, X.SYS.COMPANY);

    if (vId > 0)
        return vId

    /*Search PrsnIn by Name without property Salesman. If found, update Salesman and add property*/
    vId = X.SQL("SELECT A.PRSN FROM PRSN A WHERE A.COMPANY=:1 AND A.SODTYPE=20 AND A.NAME + ' ' + A.NAME2 = :2 ", X.SYS.COMPANY, vSfName);


    // code & name
    vMaxId = X.SQL("SELECT ISNULL((SELECT Max(PRSN) FROM PRSN WHERE COMPANY=:1 AND SODTYPE=20),0)", X.SYS.COMPANY);
    vName = vSfName.split(" ");
    if (vId > 0)
        vKey = vId;
    else
        vKey = "";

    var ws = {};
    ws.SERVICE = "setData";
    ws.OBJECT = "PRSNIN";
    ws.KEY = vKey;
    ws.appid = 0;
    ws.data = {};
    ws.data.PRSNIN = [];
    ws.data.PRSNIN.push({
        "SODTYPE": 20,
        "CODE": vMaxId > 0 ? "*" : "1000",
        "NAME": vName[0],
        "NAME2": vName[1] == "" ? " - " : vName[1],
        "ISACTIVE": 1,
        "TINPERSON": 30,
        "CCCCLSFID": vSfId
    });
    ws.data.PRSEXT = [];
    ws.data.PRSEXT.push({
        "SODTYPE": 30,
        "ISACTIVE": 1
    });
    ws = X.WEBREQUEST(JSON.stringify(ws));
    ws = JSON.parse(ws);
    vId = ws.id;
    return vId;
}
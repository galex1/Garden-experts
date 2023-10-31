//// ConnectLineB2BConnector.setDocs
/// ----------------------------------------------------
/// LAST UPDATE -> 2023-09-05 13:12 - galex
/// ----------------------------------------------------
lib.include("ConnectLineEshopCommon.common");
lib.include("ConnectLineB2BConnector.setMasterData");
lib.include("ConnectLineB2BConnector.getMasterData");

/*
 * Καταχώρηση Παραγγελίας
 */
function setOrder(obj) {
  debugger;
  obj.invoice = 0;
  //obj.site = 0;
  //obj.defauleClient = 1;
  if (!fieldHasValue(obj.date))
    return responseError("Date is required!", false);
  //if (obj.trdr == null)
  //	return responseError("Must have trdr for customer ID!", false);

  var customerProcessResult = processCustomer(obj);
  if (customerProcessResult.id == null) {
    return responseError(customerProcessResult.error, false);
  }

  if (obj.invoice && obj.invoice == 1) var objFINDOC = X.CREATEOBJ("SALDOC");
  else var objFINDOC = X.CREATEOBJ("SALDOC");

  var tblFINDOC = objFINDOC.FINDTABLE("FINDOC");
  var tblMTRDOC = objFINDOC.FINDTABLE("MTRDOC");
  var tblITELINES = objFINDOC.FINDTABLE("ITELINES");
  var tblSRVLINES = objFINDOC.FINDTABLE("SRVLINES");
  var tblEXPANAL = objFINDOC.FINDTABLE("EXPANAL");
  var newid = 0;
  try {
    objFINDOC.DBINSERT;
    tblFINDOC.EDIT;

    // tblFINDOC.SERIES = getSeries(obj);
    // if (!obj.series) tblFINDOC.SERIES = getSeries(obj);
    // else tblFINDOC.SERIES = obj.series;

    tblFINDOC.SERIES = 7020;
    tblFINDOC.TRDR = customerProcessResult.id;
    tblFINDOC.TRNDATE = obj.date;
    //tblFINDOC.VARCHAR01 = obj.varchar01;

    if (obj.payment) tblFINDOC.PAYMENT = obj.payment;
    if (obj.shipment) tblFINDOC.SHIPMENT = obj.shipment;
    if (obj.remarks) tblFINDOC.REMARKS = obj.remarks;
    if (obj.comments) tblFINDOC.COMMENTS = obj.comments;
    if (obj.saler) tblFINDOC.SALESMAN = getSalesMan(obj.saler);
    if (obj.finstates) tblFINDOC.FINSTATES = obj.finstates; else tblFINDOC.FINSTATES = "1000";

    if (obj.webid) tblFINDOC.FINCODE = obj.webid;
    // if (obj.billinfo.name) tblFINDOC.cccclvarchar02 = obj.billinfo.name;

    var shipInfo = obj.shipinfo;
    tblMTRDOC.EDIT;
    if (shipInfo.shippingaddr) tblMTRDOC.SHIPPINGADDR = shipInfo.shippingaddr;
    if (shipInfo.shpzip) tblMTRDOC.SHPZIP = shipInfo.shpzip;
    if (shipInfo.shpdistrict) tblMTRDOC.SHPDISTRICT = shipInfo.shpdistrict;
    if (shipInfo.shpcity) tblMTRDOC.SHPCITY = shipInfo.shpcity;
    debugger;
    for (i in obj.items) {
      tblITELINES.EDIT;
      tblITELINES.APPEND;

      // responseCode = checkItem(obj.itelines[i]);
      responseCode = checkItemSku(obj.items[i].code);
      if (responseCode.success == false) return code.error;
      else if (responseCode.success == "true" || responseCode.success == true)
        tblITELINES.SRCHCODE = responseCode.code;

      // tblITELINES.SRCHCODE = obj.items[i].code;
      tblITELINES.QTY1 = seriralizePrices(obj.items[i].qty1);
      tblITELINES.PRICE = seriralizePrices(obj.items[i].price);
      // if (obj.items[i].discount)
      //     tblITELINES.DISC1VAL = seriralizePrices(obj.items[i].discount);
      if (fieldHasValue(obj.items[i].total))
        tblITELINES.LINEVAL = seriralizePrices(obj.items[i].total);
      else tblITELINES.LINEVAL = tblITELINES.QTY1 * tblITELINES.PRICE;

      if (fieldHasValue(obj.items[i].comments))
        tblITELINES.COMMENTS1 = obj.items[i].comments;
      tblITELINES.POST;
    }

    // // Υπηρεσίες ------------
    // for (i in obj.services) {
    //   tblSRVLINES.EDIT;
    //   tblSRVLINES.APPEND;
    //   srchcode = obj.services[i].mtrl;

    //   debugger;
    //   tblSRVLINES.MTRL = srchcode;
    //   tblSRVLINES.QTY1 = obj.services[i].qty1;
    //   tblSRVLINES.PRICE = obj.services[i].price;
    //   tblSRVLINES.LINEVAL = obj.services[i].total;
    //   tblSRVLINES.POST;
    // }

    // //-----ΕΞΟΔΑ------------------------------------------------
    // for (i in obj.expanal) {
    //     tblEXPANAL.EDIT;
    //     tblEXPANAL.APPEND;
    //     tblEXPANAL.EXPN = obj.expanal[i].expn;
    //     tblEXPANAL.EXPVAL = obj.expanal[i].expval;
    //     tblEXPANAL.POST;
    // }
    // //----------------------------------------------------------

    if (obj.kathestos) tblFINDOC.VATSTS = obj.kathestos;

    newid = objFINDOC.DBPOST;
    var response = initializeResponse(false);
    response.id = newid;
  } catch (e) {
    return responseError(
      "Error in saving order. Error Message: " + e.message,
      false
    );
  } finally {
    obj.FREE;
    obj = null;
  }

  return response;
}

function updateOrder(obj) {
  obj.saldoc = obj.saldoc[0];
  //"KEY":"129023",
  //"FINSTATES":"1004",
  //"INVOICE":0
  if (!fieldHasValue(obj.saldoc.key))
    return responseError("No order id on key field!", false);

  if (!fieldHasValue(obj.saldoc.finstates))
    return responseError("No order status on request!", false);

  if (obj.invoice && obj.invoice == 1)
    var objFINDOC = X.CREATEOBJ("SALDOC;Προβολή για site");
  else var objFINDOC = X.CREATEOBJ("SALDOC;Προβολή για site");

  var tblFINDOC = objFINDOC.FINDTABLE("FINDOC");

  var newid = 0;
  try {
    //objFINDOC.DBINSERT;
    objFINDOC.DBLocate(obj.saldoc.key);
    tblFINDOC.EDIT;

    tblFINDOC.FINSTATES = obj.saldoc.finstates;

    objFINDOC.DBPOST;
    var response = initializeResponse(false);
    response.id = obj.saldoc.key;
  } catch (e) {
    return responseError(
      "Error in saving order. Error Message: " + e.message,
      false
    );
  } finally {
    obj.FREE;
    obj = null;
  }

  return response;
}

function getShipInfo(obj) {
  var info = obj.billinfo;
  if (obj.shipinfo != null) info = obj.shipinfo;

  var shipInfoInternal = {};
  shipInfoInternal.company = info.company;
  shipInfoInternal.name = info.name;
  shipInfoInternal.address = info.address;
  shipInfoInternal.city = info.city;
  shipInfoInternal.zip = info.zip;
  shipInfoInternal.district = info.district;
  shipInfoInternal.email = info.email;
  shipInfoInternal.phone1 = info.phone1;

  return shipInfoInternal;
}

function getSeries(obj) {
  if (customerNeedsInvoice(obj) == true) return 7021;
  return 7022;
}

function customerNeedsInvoice(obj) {
  if (!fieldHasValue(obj.invoice)) return true;
  return fieldHasValue(obj.invoice) && obj.invoice == true;
}

function getTrdCategory(obj) {
  if (customerNeedsInvoice(obj) == true) return 3000;
  return 3099;
}

function processCustomer(obj) {
  var criteria = {};
  criteria.trdcategory = getTrdCategory(obj);
  if (customerNeedsInvoice(obj) == true) {
    criteria.afm = obj.billinfo.afm;
  } else {
    criteria.email = obj.billinfo.email;
  }

  var responseCustomerProcess = { id: null, error: "" };
  if (fieldHasValue(obj.billinfo.id)) {
    responseCustomerProcess.id = obj.billinfo.id;
  } else {
    var customerData = getCustomers(criteria);
    if (customerData.success == true) {
      // The customer already exists
      if (customerData.totalcount == 1) {
        // ToDo: Decide if we have to update the customer or not.
        responseCustomerProcess.id = customerData.data[0].customer_id;
      } else if (customerData.totalcount == 0) {
        obj.billinfo.trdcategory = criteria.trdcategory;
        customerData = setCustomer(obj.billinfo);
        if (customerData.success == true) {
          // The customer inserted succesfully.
          responseCustomerProcess.id = customerData.customer_id;
        } else {
          // The customer is not inserted at SoftOne. Return error
          responseCustomerProcess.error =
            "Failed to insert customer at SoftOne!";
        }
      } else {
        // customerData.totalcount > 1
        responseCustomerProcess.error =
          "More than 1 customer found at SoftOne!";
      }
    } else {
      // Failed to check for customers.
      responseCustomerProcess.error =
        "Failed to check for customers at SoftOne!";
    }
  }

  return responseCustomerProcess;
}

function calculateOrder(obj) {
  debugger;
  var response = {};
  var characteristicsObj = {};
  response.success = "";
  response.sum = "";
  response.items = [];
  response.expenses = [];
  var resItelines = {};
  var resExpenses = {};

  //if (!fieldHasValue(obj.date))
  //	return responseError("Date is required!", false);
  //if (!fieldHasValue(obj.customer_id))
  //	return responseError("Customer is required!", false);
  //if (obj.billinfo == null)
  //	return responseError("Billing information is required!", false);
  //
  //if (!fieldHasValue(obj.billinfo.trdcategory))
  //{
  //	obj.billinfo.trdcategory = getTrdCategory(obj);
  //}
  //
  //var customerProcessResult = processCustomer(obj);
  //if (customerProcessResult.id == null)
  //{
  //	return responseError(customerProcessResult.error, false);
  //}

  var ws = {};
  ws.SERVICE = "Calculate";
  ws.OBJECT = "SALDOC";
  ws.LOCATEINFO = obj.locatinfo;
  // ws.FORM = "Προβολή για site";
  ws.DATA = {};
  ws.DATA.SALDOC = [];
  //ws.DATA.MTRDOC = [];
  ws.DATA.ITELINES = [];
  //ws.DATA.EXPANAL = [];
  try {
    var saldocObj = {};
    obj = obj.data;
    saldocObj.SERIES = obj.saldoc[0].series;

    var costomerID = "";

    if (obj.customerdata) {
      if (obj.customerdata[0].afm != null && obj.customerdata[0].afm != "")
        customerData = getCustomers(obj.customerdata[0]);


      if (customerData.success == true) {
        // The customer already exists
        if (customerData.totalcount == 1) {
          // ToDo: Decide if we have to update the customer or not.
          costomerID = customerData.data[0].customer_id;
        } else {
          return responseError("Customer is required!", false);
        }
      }
    } else {
      if (!obj.saldoc[0].trdr || obj.saldoc[0].trdr == null || obj.saldoc[0].TRDR == "") {
        if (obj.saldoc[0].afm != null && obj.saldoc[0].afm != "") {
          // arrCustomer = array("afm" => obj.afm);
          var arrCustomer = {
            afm: obj.saldoc[0].afm
          };
          customerData = getCustomers(arrCustomer);


          if (customerData.success == true) {
            // The customer already exists
            if (customerData.totalcount == 1) {
              // ToDo: Decide if we have to update the customer or not.
              costomerID = customerData.data[0].customer_id;
            } else {
              return responseError("Customer is required! Not found with afm", false);
            }
          }
        }
      } else {
        costomerID = obj.saldoc[0].trdr;
      }
    }
    if (costomerID != "") saldocObj.TRDR = costomerID;
    //saldocObj.TRNDATE = obj.date;

    //if (obj.payment) saldocObj.PAYMENT = obj.payment;
    //if (obj.shipment) saldocObj.SHIPMENT = obj.shipment;
    //if (obj.remarks)	saldocObj.REMARKS = obj.remarks;
    //if (obj.comments)	saldocObj.COMMENTS = obj.comments;

    ws.DATA.SALDOC.push(saldocObj);

    //var shipInfo = getShipInfo(obj);
    //var mtrdocObj = {};
    //if (shipInfo.address)  mtrdocObj.SHIPPINGADDR = shipInfo.address;
    //if (shipInfo.zip)	     mtrdocObj.SHPZIP       = shipInfo.zip;
    //if (shipInfo.district) mtrdocObj.SHPDISTRICT  = shipInfo.district;
    //if (shipInfo.city)     mtrdocObj.SHPCITY      = shipInfo.city;
    //if (mtrdocObj.length != 0 && mtrdocObj.length != null )
    //{
    //	ws.DATA.MTRDOC = [];
    //	ws.DATA.MTRDOC.push(mtrdocObj);
    //}
    //ws.DATA.MTRDOC.push(mtrdocObj);

    for (i in obj.itelines) {
      //*** Έλεγχος για ύπραξει είδους ***//
      // codeSearch = checkItemWithCustomSku(obj.itelines[i].srchcode);
      // if (codeSearch.success) srchcode = codeSearch.code;
      // else srchcode = obj.itelines[i].srchcode;
      var srchcode = obj.itelines[i].srchcode;

      var iteLinesObj = {};
      iteLinesObj.LINENUM = i;
      iteLinesObj.SRCHCODE = srchcode;
      iteLinesObj.QTY1 = obj.itelines[i].qty1;
      // iteLinesObj.PRICE = obj.itelines[i].price;
      // iteLinesObj.DISC1VAL = obj.itelines[i].discountvalue;
      //iteLinesObj.LINEVAL = obj.items[i].value;
      ws.DATA.ITELINES.push(iteLinesObj);
    }

    for (i in obj.expenses) {
      var expanalObj = {};
      expanalObj.EXPN = obj.expenses[i].code;
      expanalObj.EXPVAL = obj.expenses[i].value;
      ws.DATA.EXPANAL.push(expanalObj);
    }

    //return ws;
    var result = X.WEBREQUEST(JSON.stringify(ws));
    result = JSON.parse(result);

    response.success = result.success;
    response.sum = result.data.SALDOC[0].SUMAMNT;
    //SALDOC:SUMAMNT;ITELINES:MTRL,MTRL_ITEM_CODE,MTRL_ITEM_NAME,QTY1,PRICE,DISC1PRC,DISC1VAL,DISC2PRC,DISC2VAL,DISC3PRC,DISC3VAL,LINEVAL;EXPANAL:EXPN,EXPVAL
    for (i in result.data.ITELINES) {
      //return result.data.ITELINES;
      resItelines = {};
      resItelines.id = result.data.ITELINES[i].MTRL;
      resItelines.code = result.data.ITELINES[i].MTRL_ITEM_CODE;
      resItelines.name = result.data.ITELINES[i].MTRL_ITEM_NAME;
      resItelines.qty1 = result.data.ITELINES[i].QTY1;
      resItelines.price = result.data.ITELINES[i].PRICE;
      //resItelines.price = 150;
      resItelines.discount1prc = result.data.ITELINES[i].DISC1PRC;
      resItelines.discount1value = result.data.ITELINES[i].DISC1VAL;
      //resItelines.discount1value = '50,5';
      resItelines.discount2prc = result.data.ITELINES[i].DISC2PRC;
      resItelines.discount2value = result.data.ITELINES[i].DISC2VAL;
      //resItelines.discount2value = 100;
      resItelines.discount3prc = result.data.ITELINES[i].DISC3PRC;
      resItelines.discount3value = result.data.ITELINES[i].DISC3VAL;
      resItelines.value = result.data.ITELINES[i].LINEVAL;
      resItelines.vat = result.data.ITELINES[i].VATAMNT;
      //resItelines.value = '1.514,5';
      //expanalObj.EXPVAL = obj.expenses[i].price;
      response.items.push(resItelines);
    }

    for (i in result.data.EXPANAL) {
      //return result.data.ITELINES;
      resExpenses = {};
      resExpenses.code = result.data.EXPANAL[i].EXPN;
      resExpenses.value = result.data.EXPANAL[i].EXPVAL;
      //expanalObj.EXPVAL = obj.expenses[i].price;
      response.expenses.push(resExpenses);
    }
    return response;
    //return JSON.parse(result);
  } catch (e) {
    return responseError(
      "Error in calculating order. Error Message: " + e.message,
      false
    );
  } finally {
    obj.FREE;
    obj = null;
  }

  //return response;
}

// DESCRIPTION: Creates a Item.
// ---------------------------------------------------------------
function setItem(obj) {
  if (!fieldHasValue(obj.code) || !fieldHasValue(obj.name))
    return responseError(
      "Could not create product. Null code or name! ",
      false
    );
  //obj.saldoc = obj.saldoc[0];

  //if (!fieldHasValue(obj.saldoc.trndate))
  //	return responseError("Date is required!", false);
  //if (obj.saldoc.trdr == null)
  //	return responseError("Must have trdr for customer ID!", false);

  //if ((obj.invoice) && (obj.invoice == 1))
  //	var objFINDOC = X.CREATEOBJ("SALDOC");
  //else
  //	var objFINDOC = X.CREATEOBJ("RETAILDOC");
  var objITEM = X.CREATEOBJ("ITEM");
  var tblMTRL = objITEM.FINDTABLE("MTRL");
  var tblMTREXTRA = objITEM.FINDTABLE("MTREXTRA");
  try {
    objITEM.DBINSERT;
    objITEM.EDIT;

    tblMTRL.CODE = obj.code;
    tblMTRL.NAME = obj.name;
    tblMTRL.MTRUNIT1 = obj.mmid; // "101"; //τεμάχ.
    tblMTRL.VAT = obj.vatid; //"1410"; //24%

    newid = objITEM.DBPOST;
    var response = initializeResponse(false);
    response.id = newid;
  } catch (e) {
    return responseError(
      "Error in Item order. Error Message: " + e.message,
      false
    );
  } finally {
    obj.FREE;
    obj = null;
  }

  return response;
}

// ---------------------------------------------------------------


// DESCRIPTION: Creates a Item with X.WEBREQUEST.
// ---------------------------------------------------------------
function setItemX(obj) {
  debugger;
  if (!fieldHasValue(obj.code) || !fieldHasValue(obj.name))
    return responseError(
      "Could not create product. Null code or name! ",
      false
    );

  try {

    var ws = {};
    ws.SERVICE = "setData";
    ws.OBJECT = "ITEM";
    ws.appid = obj.appid;
    //ws.key = cusdata.trdr;
    var itemMtrl = getItemMtrl(obj.code);
    if (itemMtrl.success) ws.key = itemMtrl.mtrl;
    ws.DATA = {};
    ws.DATA.ITEM = [];
    var itemVal = {};
    itemVal.name = obj.name;
    itemVal.code = obj.code;
    itemVal.VAT = obj.vatcode;
    itemVal.MTRUNIT1 = obj.mmcode;
    itemVal.MTRUNIT3 = obj.mmcodeBuy;
    itemVal.MTRUNIT4 = obj.mmcodeSell;

    ws.DATA.ITEM.push(itemVal);
    // X.LOG("updateCustomerData: " + JSON.stringify(ws));
    var result = X.WEBREQUEST(JSON.stringify(ws));
    // return JSON.parse(result);

    // var objITEM = X.CREATEOBJ("ITEM");
    // var tblMTRL = objITEM.FINDTABLE("MTRL");
    // var tblMTREXTRA = objITEM.FINDTABLE("MTREXTRA");
    // objITEM.DBINSERT;
    // objITEM.EDIT;

    // tblMTRL.CODE = obj.code;
    // tblMTRL.NAME = obj.name;
    // tblMTRL.MTRUNIT1 = obj.mmid; // "101"; //τεμάχ.
    // tblMTRL.VAT = obj.vatid; //"1410"; //24%

    // newid = objITEM.DBPOST;
    var response = initializeResponse(false);
    // response.id = newid;
    // response.id = JSON.parse(result);
    response = JSON.parse(result);
  } catch (e) {
    return responseError(
      "Error in Item order. Error Message: " + e.message,
      false
    );
  } finally {
    obj.FREE;
    obj = null;
  }

  return response;
}

// ---------------------------------------------------------------

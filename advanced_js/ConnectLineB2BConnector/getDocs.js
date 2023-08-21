//// ConnectLineB2BConnector.getDocs
/// ----------------------------------------------------
/// LAST UPDATE -> 2023-06-19 17:37 - galex
/// ----------------------------------------------------
lib.include("ConnectLineEshopCommon.common");

function getSeries(obj) {
  if (customerNeedsInvoice(obj) == true) return 7024;
  return 7024;
}

// ---------------------------------------------------------------
// DESCRIPTION: Gets if an order exists.
// ---------------------------------------------------------------
function getOrderExists(obj) {
  // Initialize response array
  var response = initializeResponse(true);

  // Query Filters
  dsSqlWhere =
    " where f.COMPANY=" +
    X.SYS.COMPANY +
    " and f.SOSOURCE=1351 and f.SOREDIR=0 and f.SODTYPE=13 and f.series = " +
    getSeries(obj);

  if (fieldHasValue(obj.webid))
    dsSqlWhere += " and f.FINCODE = '" + obj.webid + "' ";

  //dsSqlWhere += " and f.int02 = " + obj.webid;

  if (obj.erpid && obj.erpid != "") dsSqlWhere += " and f.int02 = " + obj.erpid;

  // Query Order
  dsSqlOrder = " order by f.TRNDATE desc, f.FINDOC ";

  dsSql = "select f.FINDOC " + "from FINDOC f ";

  dsSql = dsSql + dsSqlWhere + dsSqlOrder;
  //return dsSql;
  dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY);

  response.totalcount = dsData.RECORDCOUNT;
  response.data = JSON.parse(dsData.JSON);

  return response;
}

function getOrdersStatus(obj) {
  var strExtraWhere =
    " WHERE FS.FINSTATES IS NOT NULL AND F.COMPANY = " + X.SYS.COMPANY;
  var strSort = " ORDER BY F.TRNDATE DESC";
  var response = initializeResponse(true);

  // if (obj.eshopid) strExtraWhere += " AND f.CCCMAGENTO = '" + obj.eshopid + "'";
  if (obj.update) strExtraWhere += " AND f.UPDDATE >= '" + obj.update + "'";
  if (obj.status) strExtraWhere += " AND FS.FINSTATES = '" + obj.status + "'";
  if (obj.orderid) strExtraWhere += " AND F.FINDOC = '" + obj.orderid + "'";
  if (obj.orderid) strExtraWhere += " AND F.FINCODE = '" + obj.ordercode + "'";

  strqry =
    " SELECT  F.FINDOC as orderid, F.FINCODE as  ordercode, FS.FINSTATES as statusCode, " +
    " FS.NAME as status " +
    // " CASE FS.FINSTATES WHEN 100 THEN 'pending' WHEN 101 THEN 'processing' WHEN 102 THEN 'complete' WHEN 103 THEN 'canceled' ELSE '' END AS status " +
    " FROM FINDOC F " +
    " LEFT JOIN FINSTATES FS ON F.FINSTATES = FS.FINSTATES AND F.COMPANY = FS.COMPANY ";

  dsSql = strqry + strExtraWhere + strSort;
  dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY);

  response.totalcount = dsData.RECORDCOUNT;
  response.data = JSON.parse(dsData.JSON);
  //response.data = dsSqlWhere;
  return response;
}
// ---------------------------------------------------------------
// DESCRIPTION: Gets the customers
// ---------------------------------------------------------------
function getCustomers(obj) {
  debugger;
  // Initialize response array
  var response = initializeResponse(true);

  // Query Filters
  var dsSqlWhere = "where c.COMPANY=:1 and c.SODTYPE=13 ";

  if (fieldHasValue(obj.code) && obj.code != '*') dsSqlWhere += " and c.CODE='" + obj.code + "'";

  //if (fieldHasValue(obj.name))
  //	dsSqlWhere += " and c.NAME='" + obj.name + "'";

  if (fieldHasValue(obj.afm)) dsSqlWhere += " and c.AFM='" + obj.afm + "'";

  if (fieldHasValue(obj.email))
    dsSqlWhere += " and c.EMAIL='" + obj.email + "'";

  if (fieldHasValue(obj.trdcategory))
    dsSqlWhere += " and c.TRDCATEGORY = " + obj.trdcategory;

  if (fieldHasValue(obj.phone))
    dsSqlWhere +=
      " and (c.PHONE01 LIKE '%" +
      obj.phone +
      "%' or c.PHONE02 LIKE '%" +
      obj.phone +
      "%') ";

  // Query Order
  dsSqlOrder = " order by c.CODE, c.TRDR";

  dsSql =
    "select top 2 c.TRDR as customer_id " +
    "from TRDR c " +
    dsSqlWhere +
    dsSqlOrder;
  dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY);

  response.totalcount = dsData.RECORDCOUNT;
  response.data = JSON.parse(dsData.JSON);
  //response.data = dsSqlWhere;

  return response;
}




// ---------------------------------------------------------------
// DESCRIPTION: Gets the customers details
// ---------------------------------------------------------------
function getCustomerInfo(obj) {
  // Initialize response array
  var response = initializeResponse(true);
  debugger;
  // Query Filters
  var dsSqlWhere = "where c.COMPANY=:1 and c.SODTYPE=13 ";

  if (fieldHasValue(obj.code))
    dsSqlWhere += " and c.CODE='" + obj.code + "'";

  if (fieldHasValue(obj.name))
    dsSqlWhere += " and c.NAME like '" + obj.name + "'";

  if (fieldHasValue(obj.afm))
    dsSqlWhere += " and c.AFM='" + obj.afm + "'";

  if (fieldHasValue(obj.email))
    dsSqlWhere += " and c.EMAIL like '" + obj.email + "'";

  // if (fieldHasValue(obj.trdcategory))
  //     dsSqlWhere += " and c.TRDCATEGORY = " + obj.trdcategory;

  if (fieldHasValue(obj.phone))
    dsSqlWhere += " and (c.PHONE01 LIKE '%" + obj.phone + "%' or c.PHONE02 LIKE '%" + obj.phone + "%') ";

  if (fieldHasValue(obj.upddate)) {
    // dsSqlWhere += "and A.UPDDATE >= '" + obj.upddate + "' ";
    dsSqlWhere += "and c.UPDDATE >= DATEADD(hour,-2," + formatDateTime(obj.upddate) + ") ";
  }

  // Query Order
  dsSqlOrder = "order by c.CODE, c.TRDR";

  // dsSql = "select c.TRDR as CLIENT_ID, c.CODE, c.NAME, c.AFM, c.IRSDATA, c.ADDRESS, c.ZIP, c.DISTRICT, c.CITY, c.PHONE01, c.PHONE02, c.EMAIL  " +
  //   "FROM TRDR c " + dsSqlWhere + dsSqlOrder;
  dsSql = "select distinct c.TRDR as CLIENT_ID, c.CODE, c.NAME, c.AFM, c.EMAIL, c.PAYMENT as PAYMENT_CODE, p.NAME as PAYMENT, c.SHIPMENT as SHIPMENT_CODE, s.NAME as SHIPMENT, c.ISACTIVE  " +
    "FROM TRDR c " +
    "INNER JOIN PAYMENT p on (c.PAYMENT = p.PAYMENT  AND p.SODTYPE = 13 AND p.COMPANY =:1) " +
    "INNER JOIN SHIPMENT s on (c.SHIPMENT = s.SHIPMENT AND c.COMPANY =:1) ";

  dsSql = dsSql + dsSqlWhere + dsSqlOrder;

  // return dsSql; 
  dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY, X.SYS.COMPANY, X.SYS.COMPANY);

  response.totalcount = dsData.RECORDCOUNT;
  response.data = JSON.parse(dsData.JSON);
  //response.data = dsSqlWhere;

  return response;
}


// ---------------------------------------------------------------
// DESCRIPTION: Check if item exist, if not create it.
// ---------------------------------------------------------------
//unction checkItem(itemData)
//
//response = {};
//response.success = "true";
//
//

// ---------------------------------------------------------------
// DESCRIPTION: Gets if an item exists or create
// ---------------------------------------------------------------
function checkItemSku(sku) {
  //debugger;
  //return sku;
  if (sku == 0 || sku == null) return false;
  // Initialize response array
  var response = initializeResponse(true);

  // Query Filters
  dsSqlWhere =
    " WHERE COMPANY=" +
    X.SYS.COMPANY +
    " AND SODTYPE = 51 AND ISACTIVE = 1 AND CODE = '" +
    sku +
    "' ";
  dsSql = "SELECT ISNULL(CODE,0) as CODE FROM MTRL ";

  dsSql = dsSql + dsSqlWhere;
  dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY);
  //return dsSql;
  //response.data = JSON.parse(dsData.JSON);
  dsData.FIRST;
  while (!dsData.EOF()) {
    if (dsData.CODE == 0) {
      response.success = false;
      response.code = 0;
    } else {
      response.success = true;
      response.code = dsData.CODE;
    }
    return response;
  }
  //return dsData;
  return false;
}

// ---------------------------------------------------------------
// DESCRIPTION: Gets if an item exists.
// ---------------------------------------------------------------
function checkItemWithCustomSku(sku) {
  //debugger;
  //return sku;
  if (sku == 0 || sku == null) return false;
  // Initialize response array
  var response = initializeResponse(true);

  // Query Filters
  dsSqlWhere =
    " WHERE COMPANY=" +
    X.SYS.COMPANY +
    " AND SODTYPE = 51 AND ISACTIVE = 1 AND CCCCLVARCHAR02 = '" +
    sku +
    "' ";

  // Query Order
  //dsSqlOrder = " order by f.TRNDATE desc, f.FINDOC " ;

  dsSql = "SELECT ISNULL(CODE,0) as CODE FROM MTRL ";

  dsSql = dsSql + dsSqlWhere;
  dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY);
  //return dsSql;
  //response.data = JSON.parse(dsData.JSON);
  dsData.FIRST;
  while (!dsData.EOF()) {
    if (dsData.CODE == 0) {
      response.success = false;
      response.code = 0;
    } else {
      response.success = true;
      response.code = dsData.CODE;
    }
    return response;
  }
  //return dsData;
  return false;
}
// ---------------------------------------------------------------

// DESCRIPTION: Check if item exist, if not create it.
// ---------------------------------------------------------------
function checkItem(itemData) {
  response = {};
  response.success = "true";
  if (getItemExists(itemData.srchcode)) {
    response.code = itemData.srchcode;
    return response;
  } else {
    response = setItem(itemData);
    //return response;
    if (response.success == true) response.code = itemData.srchcode;
    return response;
  }
}
// ---------------------------------------------------------------

// DESCRIPTION: Gets if an item exists.
// ---------------------------------------------------------------
function getItemExists(sku) {
  //return sku;
  if (sku == 0 || sku == null) return false;
  // Initialize response array
  var response = initializeResponse(true);

  // Query Filters
  dsSqlWhere =
    " WHERE COMPANY=" +
    X.SYS.COMPANY +
    " AND SODTYPE = 51 AND ISACTIVE = 1 AND CODE = '" +
    sku +
    "' ";

  // Query Order
  //dsSqlOrder = " order by f.TRNDATE desc, f.FINDOC " ;

  dsSql = "SELECT ISNULL(CODE,0) as CODE FROM MTRL ";

  dsSql = dsSql + dsSqlWhere;
  dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY);
  //return dsSql;
  //response.data = JSON.parse(dsData.JSON);
  dsData.FIRST;
  while (!dsData.EOF()) {
    if (dsData.CODE == 0) return false;
    else return true;
  }
  //return dsData;
  return false;
}

// ---------------------------------------------------------------

function getColor(product_code, color) {
  dsSql =
    "SELECT CD1.cdimlines " +
    " FROM MTRL A   " +
    " LEFT OUTER JOIN CDIMLINES CD1 ON CD1.COMPANY = A.COMPANY AND CD1.CDIM = A.CDIM1  " +
    " WHERE A.CODE = '" +
    product_code +
    "' AND CD1.NAME = '" +
    color +
    "'";
  //return dsSql;
  dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY);
  dsData.FIRST;

  return dsData.cdimlines;
}

function getDimension(product_code, size) {
  dsSql = dsSql =
    "SELECT CD2.cdimlines " +
    " FROM MTRL A   " +
    " LEFT OUTER JOIN CDIMLINES CD2 ON CD2.COMPANY = A.COMPANY AND CD2.CDIM = A.CDIM2  " +
    " WHERE A.CODE = '" +
    product_code +
    "' AND CD2.NAME = '" +
    size +
    "'";
  //return dsSql;
  dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY);
  dsData.FIRST;

  return dsData.cdimlines;
}


// ---------------------------------------------------------------
// DESCRIPTION: Gets if an item exists or create
// ---------------------------------------------------------------
function getItemMtrl(sku) {
  //debugger;
  //return sku;
  if (sku == 0 || sku == null) return false;
  // Initialize response array
  var response = initializeResponse(true);

  // Query Filters
  dsSqlWhere =
    " WHERE COMPANY=" +
    X.SYS.COMPANY +
    " AND SODTYPE = 51 AND CODE = '" +
    sku +
    "' ";
  dsSql = "SELECT ISNULL(MTRL,0) as mtrl FROM MTRL ";

  dsSql = dsSql + dsSqlWhere;
  dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY);
  //return dsSql;
  //response.data = JSON.parse(dsData.JSON);
  dsData.FIRST;
  while (!dsData.EOF()) {
    if (dsData.mtrl == 0) {
      response.success = false;
      response.mtrl = 0;
    } else {
      response.success = true;
      response.mtrl = dsData.mtrl;
    }
    return response;
  }
  //return dsData;
  return false;
}



function getSalesMan(saler_code) {
  dsSqlWhere = " WHERE SODTYPE = 20 AND COMPANY=:1 AND CODE='" + saler_code + "' "
  dsSql =
    "SELECT PRSN " +
    " FROM PRSN ";
  dsSql = dsSql + dsSqlWhere;
  //return dsSql;
  dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY);
  dsData.FIRST;
  return dsData.PRSN;
}


function getOrderOnPdf(obj) {
  var response = {};
  response.success = true;
  response.pdf_path = '';

  if (obj.id != null) {
    findoc = obj.id; //42031; // getLatestFinodc(obj.eshopid);
  } else if (obj.code != null) {
    findoc = getFinodc(obj);
  }
  // if (findoc == 0) {
  //   response.success = false;
  //   return response;
  // } else {
  //   response.success = false;
  //   return response;
  // }

  var ws = {};
  ws.SERVICE = "printDoc";
  ws.OBJECT = "SALDOC";
  ws.KEY = findoc;
  ws.TEMPLATE = "7011";
  ws.FORMAT = "PDF";
  //return JSON.stringify(ws);
  var result = X.WEBREQUEST(JSON.stringify(ws));
  result = JSON.parse(result);


  return result;
}

function getFinodc(obj) {
  //debugger;
  if (obj.id) return obj.id;
  if (obj.year == null)
    var currentYear = new Date().getFullYear();
  else
    var currentYear = obj.year;


  dsSqlWhere = "";

  var dsSql = "select top 1 ISNULL(f.FINDOC ,0) as FINDOC from FINDOC f where l.FINDOCS = (select top 1 findoc from findoc where FINCODE = '" + orderId + "') ORDER BY F.INSDATE DESC";

  dsMaster = X.GETSQLDATASET(dsSql, X.SYS.COMPANY);
  dsMaster.FIRST;

  return dsMaster.FINDOC;
}


function getLatestFinodc(orderId) {
  //debugger;
  var dsSql = "select top 1 ISNULL(f.FINDOC ,0) as FINDOC from FINDOC f join MTRLINES l on l.FINDOC = f.FINDOC where l.FINDOCS = (select top 1 findoc from findoc where FINCODE = '" + orderId + "') ORDER BY F.INSDATE DESC";

  dsMaster = X.GETSQLDATASET(dsSql, X.SYS.COMPANY);
  dsMaster.FIRST;

  return dsMaster.FINDOC;
}


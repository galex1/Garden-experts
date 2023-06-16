//// ConnectLineB2BConnector.Archived
function getItems(obj) {
    //debugger
    //return;
    // Initialize response array
    var response = initializeResponse(true);

    // Query Filters
    dsSqlWhere = " where A.COMPANY = " + X.SYS.COMPANY + " AND A.SODTYPE = 51 AND A.ISACTIVE = 1 AND A.CCCWEBACTIVE = 1 ";// AND A.CODE = 'Π0010' AND A.cccclimgcode = 'BIEN-1600386-001'
    if (fieldHasValue(obj.code))
        dsSqlWhere += "and A.CODE = '" + obj.code + "' ";
    if (fieldHasValue(obj.mtrl))
        dsSqlWhere += "and A.MTRL = " + obj.mtrl + " ";
    if (fieldHasValue(obj.vdatetimefrom))
        dsSqlWhere += "and A.UPDDATE >= '" + obj.vdatetimefrom + "' ";

    // Query Order
    dsSqlOrder = " order by A.CCCPARENTCODE ,A.CODE, A.MTRL ";

    /*Main Query of master table*/
    dsSql = " SELECT A.CCCPARENTCODE, A.MTRL AS ITEMID, CASE WHEN (A.CCCPARENTCODE <> '') THEN A.CCCPARENTCODE ELSE A.CODE END AS SKU, " +
        " CASE WHEN ((A.CCCPARENTDESC IS NULL) OR ((A.CCCPARENTDESC = ''))) THEN CASE WHEN ((C.VARCHAR04 IS NULL) OR ((C.VARCHAR04 = ''))) " +
        " THEN A.NAME ELSE CONCAT(A.NAME, ' | ',C.VARCHAR04 ) END ELSE CASE WHEN ((C.VARCHAR04 IS NULL) OR ((C.VARCHAR04 = ''))) THEN A.CCCPARENTDESC ELSE CONCAT(A.CCCPARENTDESC, ' | ',C.VARCHAR04 ) END END AS NAME, " +
        //"  CASE WHEN ((A.CCCPARENTDESC IS NULL) OR ((A.CCCPARENTDESC = ''))) THEN A.NAME ELSE CONCAT(A.CCCPARENTDESC, ' | ',C.VARCHAR04 )  END AS NAME, " + 
        //" CASE WHEN ((A.cccclimgcode IS NOT NULL ) OR (A.cccclimgcode <> '')) THEN A.cccclimgcode ELSE A.CODE END AS PHOTONAME, " +
        "  CASE WHEN ((A.cccclimgcode IS NULL ) OR (A.cccclimgcode = '')) THEN A.CCCPARENTCODE ELSE A.cccclimgcode END AS PHOTONAME, " +

        " REPLACE(REMARKS,'\n','<br>') AS DESCRIPTION, ISNULL(A.CODE1,0) AS BARCODE, A.ISACTIVE, " +
        " ISNULL(A.PRICEW, 0) AS PRICE, ISNULL(A.WEIGHT, 0) AS WEIGHT, A.MTRMANFCTR AS BRANDID, a.cccclimgcode, C.VARCHAR02 AS CCCCLORDER, " +
        " convert(varchar, getdate(), 20) AS SQLDATE " +
        " , M.NAME AS BRAND " +
        " , A.CCCTECHCHARHTML AS DESCRIPTIONHTML, A.PRICEW06 AS EDIKHEKPTOSI, " +
        " PRICEW06 AS DISCOUNT, C.VARCHAR04 AS DISCOUNT_TITLE, CCCTECHCHAR AS TECHCHAR " +
        " FROM MTRL A    " +
        " INNER JOIN MTREXTRA C ON C.MTRL = A.MTRL AND C.SODTYPE = A.SODTYPE AND C.COMPANY = A.COMPANY " +
        " LEFT JOIN MTRMANFCTR M ON M.MTRMANFCTR = A.MTRMANFCTR AND M.COMPANY = A.COMPANY " +
        dsSqlWhere;
    //" and a.mtrl in (select distinct A.mtrl from mtrl A " + dsSqlWhere + " and A.CCCPARENTCODE <> '') " ;

    dsSql = dsSql + dsSqlOrder;//+ " offset 3272 rows "
    //return dsSql;
    dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY, X.SYS.COMPANY, X.SYS.COMPANY);

    response.totalcount = dsData.RECORDCOUNT;
    currentPCode = '';
    dsData.FIRST;
    while (!dsData.EOF()) {
        if (dsData.CCCPARENTCODE != '') {
            while ((!dsData.EOF()) && (currentPCode == dsData.CCCPARENTCODE)) {
                dsData.NEXT;
            }
            currentPCode = dsData.CCCPARENTCODE;
        }
        response.data.push({
            "ITEMID": dsData.ITEMID,
            "SKU": dsData.SKU,
            //"NAME": '', 
            "NAME": dsData.NAME,
            "DESCRIPTION": dsData.DESCRIPTION,
            "DESCRIPTIONHTML": dsData.DESCRIPTIONHTML,
            "BARCODE": dsData.BARCODE,
            "PRICE": dsData.PRICE,
            "STOCK": 100,
            "WEIGHT": dsData.WEIGHT,
            "BRANDID": dsData.BRANDID,
            "BRAND": dsData.BRAND,
            "PHOTONAME": dsData.PHOTONAME,
            "SQLDATE": dsData.SQLDATE,
            "ORDER": dsData.CCCCLORDER,
            "CCCPARENTCODE": dsData.CCCPARENTCODE,
            "PRICER02": dsData.DISCOUNT,
            //"DISCOUNT_TITLE": dsData.DISCOUNT_TITLE,
            "TECHCHAR": dsData.TECHCHAR,
            "CATEGORIES": [],
            "VARIATIONS": [],
            "ATTRIBUTES": []
        });
        dsData.NEXT;
    }

    /*Categories*/
    dsCategoriesSql = "SELECT c.mtrl as ITEMID, c1.name as CNAME1, c2.name as CNAME2 " +
        " FROM CCCCLITEMCATEGORIES c " +
        " inner join CCCCLWEBCATEGORIES c1 on c.CCCCLCATEG1 = c1.CCCCLWEBCATEGORIES " +
        " left join CCCCLWEBCATEGORIES c2 on c.CCCCLCATEG2 = c2.CCCCLWEBCATEGORIES ";


    //dsCategoriesSql = " SELECT A.MTRL AS ITEMID,D.CCCCLCATEG1,D.CCCCLCATEG2+200000 AS CATEGORYID2, " +
    //" D.CCCCLDEFAULTCATEG AS DEFAULTCATEGORY,C1.NAME AS CNAME1,C2.NAME AS CNAME2 " +
    //" FROM MTRL A  " +
    //" INNER JOIN CCCCLITEMCATEGORIES D ON A.MTRL=D.MTRL  " +
    //" LEFT OUTER JOIN MTRCATEGORY C1 ON C1.MTRCATEGORY = D.CCCCLCATEG1  " +
    //" LEFT OUTER JOIN MTRGROUP C2 ON C2.MTRGROUP = D.CCCCLCATEG2 " ;

    dsCategoriesSql = dsCategoriesSql;
    //return dsCategoriesSql;
    dsCategories = X.GETSQLDATASET(dsCategoriesSql, X.SYS.COMPANY);

    dsCategories.FIRST;
    while (!dsCategories.EOF()) {
        vDataIndex = response.data.map(function (o) { return o.ITEMID; }).indexOf(dsCategories.ITEMID);

        if (vDataIndex == -1) {
            dsCategories.NEXT;
            continue;
        }

        cat = []
        cat.push(dsCategories.CNAME1, dsCategories.CNAME2);
        response.data[vDataIndex].CATEGORIES.push(cat);

        dsCategories.NEXT;
    }

    /*Variations*/
    dsVariationsSql = "select a.mtrl, a.code, a.CCCPARENTCODE, a.name, a.pricew, a.pricew06, " +
        " CASE WHEN A.CCCSHORTDESCR IS NULL THEN A.NAME ELSE A.CCCSHORTDESCR END AS PNAME, a.cccclimgcode  " +
        " from mtrl  a " +
        " where a.CCCPARENTCODE is not null AND A.COMPANY = " + X.SYS.COMPANY + " AND A.SODTYPE = 51 AND A.ISACTIVE = 1 AND CCCWEBACTIVE = 1 " +
        " order by a.CCCPARENTCODE, a.code asc";


    //dsVariationsSql = dsVariationsSql + dsSqlWhere + dsVariationsWhere + dsSqlOrder;

    dsVariations = X.GETSQLDATASET(dsVariationsSql, X.SYS.COMPANY);
    //
    dsVariations.FIRST;
    while (!dsVariations.EOF()) {
        vDataIndex = response.data.map(function (o) { return o.CCCPARENTCODE; }).indexOf(dsVariations.CCCPARENTCODE);

        if (vDataIndex == -1) {
            dsVariations.NEXT;
            continue;
        }

        response.data[vDataIndex].VARIATION1 = 1000;
        response.data[vDataIndex].VARIATIONNAME1 = 'VARIATION';

        response.data[vDataIndex].VARIATIONS.push({
            "BARCODE": dsVariations.code,
            "PHOTO": dsVariations.cccclimgcode,
            "VARIATIONOPTIONS": [{
                //"VALUE1": dsVariations.VARIATIONID1 > 0 ? dsVariations.VARIATIONID1 +'-'+ dsVariations.VARIATIONIDVALUE1 : "",
                //"VALUE2": dsVariations.VARIATIONID2 > 0 ? dsVariations.VARIATIONID2 +'-'+ dsVariations.VARIATIONIDVALUE2 : "",
                //"VALUE3": dsVariations.VARIATIONID3 > 0 ? dsVariations.VARIATIONID3 +'-'+ dsVariations.VARIATIONIDVALUE3 : "",
                "VALUE1": dsVariations.PNAME,
                //"VALUE1": dsVariations.VARIATIONID1 > 0 ? dsVariations.VARIATIONIDVALUE1 : "",
                //"VALUE2": dsVariations.VARIATIONID2 > 0 ? dsVariations.VARIATIONIDVALUE2 : "",
                //"VALUE3": dsVariations.VARIATIONID3 > 0 ? dsVariations.VARIATIONIDVALUE3 : "",
            }],
            "PRICE": dsVariations.pricew,
            "SALESPRICE": dsVariations.pricew06,
            "STOCK": 100,
            //"ISACTIVE": dsVariations.ISACTIVE,
        });

        dsVariations.NEXT;
    }


    ///*Attributes*/
    dsAttributesSql = "select m.mtrl as ITEMID, m.CCCCLCHARTYPE as type_id, t.name as type_name,m.CCCCLCHARVALS as value_id,v.name as value_name,m.CCCCLCHARVALT as value_free_name " +
        " from CCCCLITEMCHARCTYPE m " +
        " left join CCCCLCHARTYPE t on m.CCCCLCHARTYPE = t.CCCCLCHARTYPE " +
        " left join CCCCLCHARVAL v on m.CCCCLCHARVALS = v.CCCCLCHARVAL AND t.CCCCLCHARTYPE = V.CCCCLCHARTYPE";


    //dsAttributesWhere	= "AND (ISNULL(A.CDIMCATEG1,0)<>0 OR ISNULL(A.CDIMCATEG2,0)<>0  OR ISNULL(A.CDIMCATEG3,0)<>0 ) ";
    //dsAttributesWhere="";
    dsAttributesSql = dsAttributesSql;
    //return dsAttributesSql ;
    dsAttributes = X.GETSQLDATASET(dsAttributesSql, X.SYS.COMPANY);

    dsAttributes.FIRST;
    while (!dsAttributes.EOF()) {
        vDataIndex = response.data.map(function (o) { return o.ITEMID; }).indexOf(dsAttributes.ITEMID);

        if (vDataIndex == -1) {
            dsAttributes.NEXT;
            continue;
        }

        response.data[vDataIndex].ATTRIBUTES.push({
            "ATTRIBUTEID": dsAttributes.type_id,
            "ATTRIBUTENAME": dsAttributes.type_name,
            "ATTRIBUTENAMEVALUE": dsAttributes.value_name
        });

        dsAttributes.NEXT;
    }

    return response;
}
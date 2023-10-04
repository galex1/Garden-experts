//// ConnectLineB2BConnector.getMasterData
// ------------------------------------------------
// LAST UPDATE -> 2023-10-04 12:11 - galex
// ------------------------------------------------
lib.include("ConnectLineEshopCommon.common");
lib.include("ConnectLineB2BConnector.Params");



function testResponse(obj) {
    var str = "";
    str = str.replace(/[^\x00-\x7F]/g, "");
    return str;
}


function getItems(obj) {
    // debugger
    // return;
    // Initialize response array
    var response = initializeResponse(true);

    // Query Filters
    dsSqlWhere = " where A.COMPANY = " + X.SYS.COMPANY + " AND A.SODTYPE = 51 AND A.ISACTIVE = 1 AND A.CCCCLESHOPSYNC = 1 ";// AND A.CODE = 'Π0010' AND A.cccclimgcode = 'BIEN-1600386-001'
    if (fieldHasValue(obj.code))
        dsSqlWhere += "and A.CODE = '" + obj.code + "' ";
    if (fieldHasValue(obj.itemid))
        dsSqlWhere += "and A.MTRL = " + obj.itemid + " ";
    if (fieldHasValue(obj.upddate)) {
        // dsSqlWhere += "and A.UPDDATE >= '" + obj.upddate + "' ";
        dsSqlWhere += "and A.UPDDATE >= DATEADD(hour,-2," + formatDateTime(obj.upddate) + ") ";
    }
    // Query Order
    dsSqlOrder = " order by A.CODE, A.MTRL ";




    /*Main Query of master table*/
    dsSql = "SELECT A.MTRL AS ITEMID, A.CODE AS SKU, U.NAME AS UNIT, A.VAT AS VATID, V.NAME AS VAT, A.UPDDATE AS UPDDATE, " +
        " A.NAME AS NAME, A.CCCCLESHOPNAME as SHOPNAME, A.CCCCLESHOPDTDESC as DESCRIPTION, " +
        " ISNULL(A.CODE1,0) AS BARCODE, A.ISACTIVE, " +
        " ISNULL(A.PRICEW, 0) AS PRICE, ISNULL(A.PRICER12, 0) AS LIANIKI, ISNULL(A.SODISCOUNT, 0) AS EKPTOSILIANIKIS,  ISNULL(A.GWEIGHT, 1) AS MINQANTITY, A.MTRMARK AS BRANDID, " +
        " convert(varchar, getdate(), 20) AS SQLDATE " +
        " , M.NAME AS BRAND " +
        " , A.CCCCLESHOPSHOW AS VISIBILITY " +

        " ,ISNULL((SELECT (-1) * ISNULL((SELECT SUM(ISNULL(Z1.QTY1,0)-ISNULL(Z1.QTY1COV,0)-ISNULL(Z1.QTY1CANC,0))  " +
        " FROM MTRLINES Z1, RESTMODE Z2  WHERE Z1.MTRL = A.MTRL   " +
        " AND Z1.PENDING   = 1 AND Z1.WHOUSE IN (" + whouses + ")  " +
        " AND Z2.COMPANY   =  " + X.SYS.COMPANY + " AND Z1.RESTMODE  = Z2.RESTMODE AND Z2.RESTCATEG = 2),0)),0) +" +
        " ISNULL((SELECT SUM(A1.IMPQTY1-A1.EXPQTY1) " +
        "          FROM   MTRBALSHEET A1 " +
        "          WHERE  A1.COMPANY= " + X.SYS.COMPANY + " AND A1.MTRL=A.MTRL AND A1.FISCPRD=YEAR(getdate()) AND A1.PERIOD <MONTH(GETDATE()) AND A1.WHOUSE IN (" + whouses + ") ),0) " +
        " +ISNULL((SELECT SUM(A2.QTY1*(B2.FLG01-B2.FLG04)) " +
        "          FROM   MTRTRN A2,TPRMS B2 " +
        "          WHERE  A2.COMPANY= " + X.SYS.COMPANY + " " +
        "          AND    A2.SODTYPE = 51 AND    A2.MTRL =A.MTRL  AND    A2.TRNDATE >=DATEADD(month, DATEDIFF(month, 0, getdate()), 0) AND    A2.TRNDATE <=GETDATE() AND A2.WHOUSE IN (" + whouses + ") " +
        "          AND    A2.COMPANY = B2.COMPANY  AND    A2.SODTYPE = B2.SODTYPE AND    A2.TPRMS = B2.TPRMS),0) AS STOCK " +


        " FROM MTRL A    " +
        " INNER JOIN MTREXTRA C ON C.MTRL = A.MTRL AND C.SODTYPE = A.SODTYPE AND C.COMPANY = A.COMPANY " +
        " LEFT JOIN MTRMARK M ON M.MTRMARK = A.MTRMARK AND M.COMPANY = A.COMPANY " +
        " LEFT JOIN VAT V ON V.VAT = A.VAT " +
        " LEFT JOIN MTRUNIT U ON U.MTRUNIT = A.MTRUNIT1 AND U.COMPANY = A.COMPANY " +
        dsSqlWhere;
    //" and a.mtrl in (select distinct A.mtrl from mtrl A " + dsSqlWhere + " and A.CCCPARENTCODE <> '') " ;

    dsSql = dsSql + dsSqlOrder;//+ " offset 3272 rows "
    // return dsSql;
    dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY, X.SYS.COMPANY, X.SYS.COMPANY);

    response.totalcount = dsData.RECORDCOUNT;
    currentPCode = '';
    dsData.FIRST;
    while (!dsData.EOF()) {

        var minQ = dsData.MINQANTITY;
        if (dsData.MINQANTITY == 0) minQ = 1;



        response.data.push({
            "ITEMID": dsData.ITEMID,
            "CODE": dsData.SKU,
            "NAME": dsData.NAME,
            "SHOPNAME": dsData.SHOPNAME,
            "DESCRIPTION": dsData.DESCRIPTION,
            // "DESCRIPTIONHTML": dsData.DESCRIPTIONHTML,
            "BARCODE": dsData.BARCODE,
            "LIANIKI": dsData.LIANIKI,
            // "DISCOUNT": dsData.EKPTOSILIANIKIS,
            "PRICE": dsData.PRICE,
            "VATID": dsData.VATID,
            "VAT": dsData.VAT,
            "UNIT": dsData.UNIT,
            "STOCK": dsData.STOCK,
            "MINQANTITY": minQ,
            "BRANDID": dsData.BRANDID,
            "BRAND": dsData.BRAND,
            // "SQLDATE": dsData.SQLDATE,
            "SQLDATE": dsData.UPDDATE,
            "VISIBILITY": dsData.VISIBILITY,
            "CATEGORIES": [],
            // "VARIATIONS": [],
            "ATTRIBUTES": []
        });
        dsData.NEXT;
    }

    /*Categories*/
    dsCategoriesSql = "SELECT c.mtrl as ITEMID, cat1.CCCCLWEBCATEGORIES as IDC1,  cat1.SODTYPE as TYPE1,  cat1.CODE  AS  CODEC1, cat1.NAME  AS  NAMEC1, " +
        "cat2.CCCCLWEBCATEGORIES as IDC2,  cat2.SODTYPE as TYPE2, cat2.CODE  AS  CODEC2, cat2.NAME  AS  NAMEC2, " +
        "cat3.CCCCLWEBCATEGORIES as IDC3,  cat3.SODTYPE as TYPE3, cat3.code  AS  CODEC3, cat3.NAME  AS  NAMEC3, " +
        "cat4.CCCCLWEBCATEGORIES as IDC4,  cat4.SODTYPE as TYPE4, cat4.CODE  AS  CODEC4, cat4.NAME  AS  NAMEC4, " +
        "cat5.CCCCLWEBCATEGORIES as IDC5,  cat5.SODTYPE as TYPE5, cat5.code  AS  CODEC5, cat5.NAME  AS  NAMEC5  " +
        " FROM CCCCLITEMCATEGORIES  c" +
        " left join  CCCCLWEBCATEGORIES cat1 on cat1.CCCCLWEBCATEGORIES = c.CCCCLCATEG1 AND cat1.sodtype=1  and cat1.COMPANY =  " + X.SYS.COMPANY +
        " left join  CCCCLWEBCATEGORIES cat2 on cat2.CCCCLWEBCATEGORIES = c.CCCCLCATEG2 AND cat2.sodtype=2  and cat2.COMPANY = " + X.SYS.COMPANY +
        " left join  CCCCLWEBCATEGORIES cat3 on cat3.CCCCLWEBCATEGORIES = c.CCCCLCATEG3 AND cat3.sodtype=3  and cat3.COMPANY =" + X.SYS.COMPANY +
        " left join  CCCCLWEBCATEGORIES cat4 on cat4.CCCCLWEBCATEGORIES = c.CCCCLCATEG4 AND cat4.sodtype=4  and cat4.COMPANY =" + X.SYS.COMPANY +
        " left join  CCCCLWEBCATEGORIES cat5 on cat5.CCCCLWEBCATEGORIES = c.CCCCLCATEG5 AND cat5.sodtype=5  and cat5.COMPANY = " + X.SYS.COMPANY;


    dsCategoriesSql = dsCategoriesSql;
    // return dsCategoriesSql;
    dsCategories = X.GETSQLDATASET(dsCategoriesSql, X.SYS.COMPANY);

    dsCategories.FIRST;
    cat = [];
    while (!dsCategories.EOF()) {
        vDataIndex = response.data.map(function (o) { return o.ITEMID; }).indexOf(dsCategories.ITEMID);
        if (vDataIndex == -1) {
            dsCategories.NEXT;
            continue;
        }

        if (dsCategories.IDC5 != "") {
            category_id = dsCategories.TYPE5 + "" + dsCategories.IDC5;
            category_name = dsCategories.NAMEC5;
        } else if (dsCategories.IDC4 != "") {
            category_id = dsCategories.TYPE4 + "" + dsCategories.IDC4;
            category_name = dsCategories.NAMEC4;
        } else if (dsCategories.IDC3 != "") {
            category_id = dsCategories.TYPE3 + "" + dsCategories.IDC3;
            category_name = dsCategories.NAMEC3;
        } else if (dsCategories.IDC2 != "") {
            category_id = dsCategories.TYPE2 + "" + dsCategories.IDC2;
            category_name = dsCategories.NAMEC2;
        } else if (dsCategories.IDC1 != "") {
            category_id = dsCategories.TYPE1 + "" + dsCategories.IDC1;
            category_name = dsCategories.NAMEC1;
        }

        // str_categories = "id , "; // `{ "CATEGORY_ID": ${category_id} },`;
        // cat.push({ "CATEGORY_ID": category_id });
        if (category_id) response.data[vDataIndex].CATEGORIES.push({
            "CATEGORY_ID": category_id,
            "CATEGORY_NAME": category_name
        });
        dsCategories.NEXT;
    }
    // response.data[vDataIndex].CATEGORIES.push(JSON.stringify(cat[0]));
    // return str_categories;
    // response.data[vDataIndex].CATEGORIES = str_categorie; 




    /*Variations*/
    // dsVariationsSql = "SELECT C.MTRL, C.CDIM1, C.CDIMLINES1, C.CDIM2, C.CDIMLINES2, C.CDIM3, C.CDIMLINES3, SUM(ISNULL(C.OPNIMPQTY1,0)+ISNULL(C.IMPQTY1,0)-ISNULL(C.EXPQTY1,0)) AS QTY1 " +
    //     ", (SELECT name FROM CDIMLINES WHERE CDIM =  C.CDIM1 AND CDIMLINES =  C.CDIMLINES1 ) as nameColor " +
    //     " , (SELECT name FROM CDIMLINES WHERE CDIM =  C.CDIM2 AND CDIMLINES =  C.CDIMLINES2 ) as nameSize " +
    //     " , (SELECT CODE FROM MTRSUBSTITUTE WHERE MTRDIM1 = C.CDIMLINES1 AND MTRDIM2 = C.CDIMLINES2  AND MTRL = C.MTRL ) as barcode " +
    //     " FROM CDIMFINDATA C " +
    //     " LEFT OUTER JOIN MTRL M ON C.MTRL=M.MTRL" +
    //     " WHERE C.COMPANY=:1 AND C.FISCPRD=2023 AND M.CODE= '" + dsData.SKU + "' " +
    //     " GROUP BY c.MTRL, C.CDIM1, C.CDIMLINES1, C.CDIM2, C.CDIMLINES2, C.CDIM3, C.CDIMLINES3 ";

    // dsVariations = X.GETSQLDATASET(dsVariationsSql, X.SYS.COMPANY);
    // dsVariations.FIRST;
    // while (!dsVariations.EOF()) {
    //     vDataIndex = response.data.map(function (o) { return o.ITEMID; }).indexOf(dsVariations.MTRL);

    //     if (vDataIndex == -1) {
    //         dsVariations.NEXT;
    //         continue;
    //     }

    //     response.data[vDataIndex].VARIATIONS.push({
    //         "BARCODE": dsVariations.barcode,
    //         "CODE": dsVariations.nameColor.replace(/,/g, '.') + " - " + dsVariations.nameSize.replace(/,/g, '.'),
    //         "STOCK": dsVariations.QTY1,
    //     });

    //     dsVariations.NEXT;
    // }




    ///*Attributes*/
    dsAttributesSql = "select m.mtrl as ITEMID, m.CCCCLCHARTYPE as type_id, t.name as type_name,m.CCCCLCHARVALS as value_id,v.name as value_name,m.CCCCLCHARVALT as value_free_name " +
        " from CCCCLITEMCHARCTYPE m " +
        " left join CCCCLCHARTYPE t on m.CCCCLCHARTYPE = t.CCCCLCHARTYPE " +
        " left join CCCCLVCHARLIST v on m.CCCCLCHARVALS = v.CCCCLVCHARLIST AND t.CCCCLCHARTYPE = v.CCCCLCHARTYPE ";


    //dsAttributesWhere	= "AND (ISNULL(A.CDIMCATEG1,0)<>0 OR ISNULL(A.CDIMCATEG2,0)<>0  OR ISNULL(A.CDIMCATEG3,0)<>0 ) ";
    //dsAttributesWhere="";
    dsAttributesSql = dsAttributesSql;
    // return dsAttributesSql;
    dsAttributes = X.GETSQLDATASET(dsAttributesSql, X.SYS.COMPANY);

    dsAttributes.FIRST;
    while (!dsAttributes.EOF()) {
        vDataIndex = response.data.map(function (o) { return o.ITEMID; }).indexOf(dsAttributes.ITEMID);

        if (vDataIndex == -1) {
            dsAttributes.NEXT;
            continue;
        }

        var attrValue;
        if (!dsAttributes.value_name || dsAttributes.value_name == '') { attrValue = dsAttributes.value_free_name } else { attrValue = dsAttributes.value_name }
        response.data[vDataIndex].ATTRIBUTES.push({
            "ATTRIBUTEID": dsAttributes.type_id,
            "ATTRIBUTENAME": dsAttributes.type_name,
            "ATTRIBUTENAMEVALUE": attrValue
            // "ATTRIBUTENAMEVALUE": dsAttributes.value_name
        });

        dsAttributes.NEXT;
    }

    return response;
}

function getCategories(obj) {
    // Initialize response array
    var response = initializeResponse(true);

    // Query Filters
    dsSqlWhere = " where COMPANY = " + X.SYS.COMPANY;
    if (fieldHasValue(obj.code))
        dsSqlWhere += "and A.mtrcategory = '" + obj.category_id + "' ";
    // Query Order
    dsSqlOrder = " order by CCCCLWEBCATEGORIES,SODTYPE ";
    dsSql = " SELECT CCCCLWEBCATEGORIES AS CAT_ID, NAME, PARENT, SODTYPE FROM CCCCLWEBCATEGORIES ";

    dsSql = dsSql + dsSqlWhere + dsSqlOrder;
    //return dsSql;
    dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY);



    response.totalcount = dsData.RECORDCOUNT;
    dsData.FIRST;
    rows = [];

    while (!dsData.EOF()) {
        categories = {};
        categories.CATEGORY_ID = dsData.SODTYPE + "" + dsData.CAT_ID;
        categories.NAME = dsData.NAME;
        if (dsData.SODTYPE == 1)
            categories.PARENTID = "0";
        else
            categories.PARENTID = (dsData.SODTYPE - 1) + "" + dsData.PARENT;



        categories.CATEGORY_LEVEL = dsData.SODTYPE;
        response.data.push(categories);
        //response.data.push({        
        //    "CATEGORY_ID" : dsData.SODTYPE + "" + dsData.CAT_ID,
        //    "NAME" : dsData.NAME,
        //    "PARENTID" :  (dsData.SODTYPE - 1) + "" + dsData.PARENT,
        //    "CATEGORY_LEVEL" : dsData.SODTYPE
        //});



        dsData.NEXT;
    }
    //response.rows = rows;
    return response;
}


// With variations 
// function getItemsStock(obj) {
//     // debugger
//     // return;
//     // Initialize response array
//     var response = initializeResponse(true);

//     // Query Filters
//     dsSqlWhere = " where A.COMPANY = " + X.SYS.COMPANY + " AND A.SODTYPE = 51 AND A.ISACTIVE = 1 ";
//     // dsSqlWhere +=  "AND A.CCCCLESHOPSYNC = 1 ";
//     // AND A.CODE = 'Π0010' AND A.cccclimgcode = 'BIEN-1600386-001'
//     if (fieldHasValue(obj.code))
//         dsSqlWhere += "and A.CODE = '" + obj.code + "' ";
//     if (fieldHasValue(obj.itemid))
//         dsSqlWhere += "and A.MTRL = " + obj.itemid + " ";
//     if (fieldHasValue(obj.upddate)) {
//         // dsSqlWhere += "and A.UPDDATE >= '" + obj.upddate + "' ";
//         // dsSqlWhere += "and A.UPDDATE >= DATEADD(hour,-2," + formatDateTime(obj.upddate) + ") ";
//         dsSqlWhere += " AND (DATEADD(hour,-2," + formatDateTime(obj.upddate) + ") = '1900/01/01 00:00:00' OR A.UPDDATE >= DATEADD(hour,-2," + formatDateTime(obj.upddate) + ") OR A.MTRL IN (SELECT DISTINCT M.MTRL FROM FINDOC F INNER JOIN MTRLINES M ON F.FINDOC=M.FINDOC WHERE F.UPDDATE>= DATEADD(hour,-2," + formatDateTime(obj.upddate) + ") AND M.MTRL=A.MTRL AND f.TFPRMS NOT IN(100,102,106,151,152,155,181,202,203,500,501,401,402,403,404) AND isnull(f.APPRV,0) = 1)) "
//     }
//     // Query Order
//     dsSqlOrder = " order by A.CODE, A.MTRL ";

//     /*Main Query of master table*/

//     dsSql = "SELECT  A.MTRL AS ITEMID, A.CODE AS SKU, " +
//         " A.ISACTIVE " +
//         " FROM MTRL A    " +
//         " INNER JOIN MTREXTRA C ON C.MTRL = A.MTRL AND C.SODTYPE = A.SODTYPE AND C.COMPANY = A.COMPANY " +
//         " LEFT JOIN MTRMANFCTR M ON M.MTRMANFCTR = A.MTRMANFCTR AND M.COMPANY = A.COMPANY " +
//         " LEFT JOIN VAT V ON V.VAT = A.VAT " +
//         " LEFT JOIN MTRUNIT U ON U.MTRUNIT = A.MTRUNIT1 AND U.COMPANY = A.COMPANY " +
//         dsSqlWhere;

//     dsSql = dsSql + dsSqlOrder;//+ " offset 3272 rows "
//     //return dsSql;
//     dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY, X.SYS.COMPANY, X.SYS.COMPANY);

//     response.totalcount = dsData.RECORDCOUNT;
//     currentPCode = '';
//     dsData.FIRST;
//     while (!dsData.EOF()) {
//         response.data.push({
//             "ITEMID": dsData.ITEMID,
//             "CODE": dsData.SKU,
//             // "LIANIKI": dsData.LIANIKI,
//             // "DISCOUNT": dsData.EKPTOSILIANIKIS,
//             // "PRICE": dsData.PRICE,
//             "VARIATIONS": []
//         });
//         dsData.NEXT;
//     }


//     /*Variations*/
//     dsVariationsSql = "SELECT C.MTRL, C.CDIM1, C.CDIMLINES1, C.CDIM2, C.CDIMLINES2, C.CDIM3, C.CDIMLINES3, SUM(ISNULL(C.OPNIMPQTY1,0)+ISNULL(C.IMPQTY1,0)-ISNULL(C.EXPQTY1,0)) AS QTY1 " +
//         ", (SELECT name FROM CDIMLINES WHERE CDIM =  C.CDIM1 AND CDIMLINES =  C.CDIMLINES1 ) as nameColor " +
//         " , (SELECT name FROM CDIMLINES WHERE CDIM =  C.CDIM2 AND CDIMLINES =  C.CDIMLINES2 ) as nameSize " +
//         " , (SELECT CODE FROM MTRSUBSTITUTE WHERE MTRDIM1 = C.CDIMLINES1 AND MTRDIM2 = C.CDIMLINES2  AND MTRL = C.MTRL ) as barcode " +
//         " FROM CDIMFINDATA C " +
//         " LEFT OUTER JOIN MTRL M ON C.MTRL=M.MTRL" +
//         " WHERE C.COMPANY=:1 AND C.FISCPRD=2023 AND M.CODE= '" + dsData.SKU + "' " +
//         " GROUP BY c.MTRL, C.CDIM1, C.CDIMLINES1, C.CDIM2, C.CDIMLINES2, C.CDIM3, C.CDIMLINES3 ";

//     dsVariations = X.GETSQLDATASET(dsVariationsSql, X.SYS.COMPANY);
//     dsVariations.FIRST;
//     while (!dsVariations.EOF()) {
//         vDataIndex = response.data.map(function (o) { return o.ITEMID; }).indexOf(dsVariations.MTRL);

//         if (vDataIndex == -1) {
//             dsVariations.NEXT;
//             continue;
//         }

//         response.data[vDataIndex].VARIATIONS.push({
//             "BARCODE": dsVariations.barcode,
//             "CODE": dsVariations.nameColor.replace(/,/g, '.') + " - " + dsVariations.nameSize.replace(/,/g, '.'),
//             "STOCK": dsVariations.QTY1,
//         });

//         dsVariations.NEXT;
//     }


//     return response;
// }



function getItemsStock(obj) {
    // debugger
    // return;
    // Initialize response array
    var response = initializeResponse(true);

    // Query Filters
    dsSqlWhere = " where A.COMPANY = " + X.SYS.COMPANY + " AND A.SODTYPE = 51 AND A.ISACTIVE = 1 ";
    // dsSqlWhere += " AND A.CCCCLESHOPSYNC = 1 ";
    if (fieldHasValue(obj.code))
        dsSqlWhere += "and A.CODE = '" + obj.code + "' ";
    if (fieldHasValue(obj.itemid))
        dsSqlWhere += "and A.MTRL = " + obj.itemid + " ";
    if (fieldHasValue(obj.upddate)) {
        // dsSqlWhere += "and A.UPDDATE >= '" + obj.upddate + "' ";
        // dsSqlWhere += "and A.UPDDATE >= DATEADD(hour,-2," + formatDateTime(obj.upddate) + ") ";
        dsSqlWhere += " AND (DATEADD(hour,-2," + formatDateTime(obj.upddate) + ") = '1900/01/01 00:00:00' OR A.UPDDATE >= DATEADD(hour,-2," + formatDateTime(obj.upddate) + ") OR A.MTRL IN (SELECT DISTINCT M.MTRL FROM FINDOC F INNER JOIN MTRLINES M ON F.FINDOC=M.FINDOC WHERE F.UPDDATE>= DATEADD(hour,-2," + formatDateTime(obj.upddate) + ") AND M.MTRL=A.MTRL AND f.TFPRMS NOT IN(100,102,106,151,152,155,181,202,203,500,501,401,402,403,404) AND isnull(f.APPRV,0) = 1)) "
    }
    // Query Order
    dsSqlOrder = " order by A.CODE, A.MTRL ";

    /*Main Query of master table*/
    dsSql = "SELECT  A.MTRL AS ITEMID, A.CODE AS SKU, " +
        " A.ISACTIVE, " +
        " ISNULL(A.PRICEW, 0) AS PRICE, ISNULL(A.PRICER, 0) AS LIANIKI, ISNULL(A.PRICER01, 0) AS EKPTOSILIANIKIS, " +
        "Isnull((SELECT (-1) * Isnull((SELECT Sum(Isnull(Z1.qty1, 0)-Isnull(Z1.qty1cov, 0)-Isnull(Z1.qty1canc, 0)) FROM " +
        "   mtrlines Z1, restmode Z2 WHERE Z1.mtrl = A.mtrl " +
        "   AND Z1.pending = 1 AND Z1.whouse IN (" + whouses + ") AND Z2.company =  " + X.SYS.COMPANY + " AND " +
        "   Z1.restmode =  " +
        "   Z2.restmode AND Z2.restcateg = 2), 0)), 0) " +
        "   + Isnull((SELECT Sum(A1.impqty1-A1.expqty1) FROM mtrbalsheet A1 WHERE " +
        "   A1.company= " + X.SYS.COMPANY + " AND A1.mtrl=A.mtrl AND A1.fiscprd=Year(Getdate()) AND " +
        "   A1.period < " +
        "   Month( " +
        "   Getdate()) AND A1.whouse IN (" + whouses + ") ), 0) " +
        "   + Isnull((SELECT Sum(A2.qty1*(B2.flg01-B2.flg04)) FROM mtrtrn A2, tprms " +
        "   B2 WHERE " +
        "   A2.company= " + X.SYS.COMPANY + " AND A2.sodtype = 51 AND A2.mtrl =A.mtrl AND A2.trndate >= " +
        "   Dateadd( " +
        "   month, Datediff(month, 0, Getdate()), 0) AND A2.trndate <=Getdate() AND " +
        "   A2.whouse IN (" + whouses + ") AND A2.company = B2.company AND A2.sodtype = " +
        "   B2.sodtype AND " +
        "   A2.tprms " +
        "   = B2.tprms), 0)                 AS STOCK" +

        " FROM MTRL A    " +
        " INNER JOIN MTREXTRA C ON C.MTRL = A.MTRL AND C.SODTYPE = A.SODTYPE AND C.COMPANY = A.COMPANY " +
        " LEFT JOIN MTRMANFCTR M ON M.MTRMANFCTR = A.MTRMANFCTR AND M.COMPANY = A.COMPANY " +
        " LEFT JOIN VAT V ON V.VAT = A.VAT " +
        " LEFT JOIN MTRUNIT U ON U.MTRUNIT = A.MTRUNIT1 AND U.COMPANY = A.COMPANY " +
        dsSqlWhere;



    dsSql = dsSql + dsSqlOrder;//+ " offset 3272 rows "
    // return dsSql;
    dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY, X.SYS.COMPANY, X.SYS.COMPANY);

    response.totalcount = dsData.RECORDCOUNT;
    currentPCode = '';
    dsData.FIRST;
    while (!dsData.EOF()) {
        response.data.push({
            "ITEMID": dsData.ITEMID,
            "CODE": dsData.SKU,
            "PRICE": dsData.PRICE,
            "STOCK": dsData.STOCK,
        });
        dsData.NEXT;
    }

    return response;
}

function getAttributes() {
    // Initialize response array
    var response = initializeResponse(true);

    dsSql = "SELECT CCCCLCHARTYPE AS ATTRIBUTEID,NAME AS DESCRIPTION,ISACTIVE, ESHOPID FROM CCCCLCHARTYPE WHERE COMPANY=" + X.SYS.COMPANY;

    //	SELECT
    //	A.MTRL,
    //	A.CHARTYPE,
    //	CT.NAME,
    //	CT.ESHOPID,
    //	ISNULL( CAST(A.CHAR1VAL AS VARCHAR), ISNULL( CAST(CP.CCCCLCHARVAL AS VARCHAR),0)) as char_val_code,
    //	ISNULL( CAST(C1.NAME AS VARCHAR), ISNULL( CAST(CP.NAME AS VARCHAR),ISNULL(A.CHAR3VAL,''))) as char_val_name
    //	FROM (SELECT  
    //			A.MTRL, 
    //			A.CCCCLCHARVALS AS CHAR1VAL,
    //			A.CCCCLCHARVALM AS CHAR2VAL,
    //			A.CCCCLCHARVALT AS CHAR3VAL,
    //			A.CCCCLCHARTYPE AS CHARTYPE
    //			from CCCCLITEMCHARCTYPE A
    //			) A 
    //LEFT JOIN CCCCLCHARVAL C1 ON A.CHAR1VAL = C1.CCCCLCHARVAL
    //left join CCCCLCHARVAL CP on ',' + CHAR2VAL + ',' LIKE '%,' + CAST(CP.CCCCLCHARVAL AS VARCHAR)+ ',%'
    //LEFT JOIN CCCCLCHARTYPE CT ON A.CHARTYPE = CT.CCCCLCHARTYPE
    //ORDER BY A.MTRL

    dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY, X.SYS.COMPANY);

    response.totalcount = dsData.RECORDCOUNT;

    dsData.FIRST;
    while (!dsData.EOF()) {
        response.data.push({
            "ATTRIBUTEID": dsData.ATTRIBUTEID,
            "DESCRIPTION": dsData.DESCRIPTION,
            "ISACTIVE": dsData.ISACTIVE,
            // "ESHOPID": dsData.ESHOPID
        });
        dsData.NEXT;
    }

    return response;
}

function getAttributesValues(obj) {
    // Initialize response array
    //debugger
    //return;
    var response = initializeResponse(true);

    dsSql = "	select distinct q.c1 as typeid, q.c2 as typename, q.c3 as valuename, q.c4 as magentotype from ( " +
        "	select a.CCCCLCHARTYPE as c1, a.name as c2 ,b.name as c3, 0 as c4 from CCCCLCHARTYPE A " +
        "	inner join CCCCLCHARVAL B on a.CCCCLCHARTYPE = b.CCCCLCHARTYPE " +
        "	union all " +
        "	select a.CCCCLCHARTYPE as c1, a.name as c2, c.cccclcharvalt  as c3, 1 as c4 from CCCCLCHARTYPE A " +
        "	inner join CCCCLITEMCHARCTYPE C on a.CCCCLCHARTYPE = c.CCCCLCHARTYPE and cccclcharvalt is not null " +
        "	)q order by q.c1 asc ";

    dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY);

    response.totalcount = dsData.RECORDCOUNT;

    dsData.FIRST;
    while (!dsData.EOF()) {
        currenttype = dsData.typeid;
        typeid = dsData.typeid;
        typename = dsData.typename;
        magentotype = dsData.magentotype;
        values = [];

        while ((!dsData.EOF()) && (currenttype == dsData.typeid)) {
            currenttype = dsData.typeid
            values.push(dsData.valuename);
            if (dsData.magentotype == 0)
                magentotype = 0;
            dsData.NEXT;
        }

        response.data.push({
            "typeid": typeid,
            "typename": typename,
            "values": values,
            "magentotype": magentotype
        });
    }

    return response;
}


function getBrands(obj) {
    // Initialize response array
    var response = initializeResponse(true);

    // Query Filters
    dsSqlWhere = " where COMPANY = " + X.SYS.COMPANY + " AND SODTYPE = 51 ";
    if (fieldHasValue(obj.code)) dsSqlWhere += "and code = '" + obj.code + "' ";
    if (fieldHasValue(obj.name)) dsSqlWhere += "and name like '%" + obj.name + "%' ";
    if (fieldHasValue(obj.isactive)) dsSqlWhere += "and isactive = '" + obj.isactive + "' ";
    // Query Order
    dsSqlOrder = " order by name ";
    dsSql = " SELECT code, name, isactive FROM MTRMARK ";

    dsSql = dsSql + dsSqlWhere + dsSqlOrder;
    //return dsSql;
    dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY);
    response.totalcount = dsData.RECORDCOUNT;

    // dsData.FIRST;
    // rows = [];

    response.totalcount = dsData.RECORDCOUNT;
    response.data = JSON.parse(dsData.JSON);
    return response;
}

function getClientDocs(obj) {
    // Initialize response array
    var response = initializeResponse(true);

    if ((!obj.code) || (obj.code == null)) responseError("No client code");
    var client_res = getCustomers(obj);
    if (client_res.totalcount == 1) {
        var client_id = client_res.data[0].customer_id
    } else {
        return responseError("No client or More than 1 found");
    }
    let current_year = new Date().getFullYear();
    if (obj.datefrom) var datefrom = obj.datefrom; else var datefrom = (current_year + '/01/01');
    if (obj.dateto) var dateto = obj.dateto; else var dateto = (current_year + '/12/31');
    if ((obj.series) && (fieldHasValue(obj.series))) var series = obj.series; else var series = "7001, 7011, 7021, 7023, 7041, 7042, 7043, 7045, 7061, 7062, 7063, 7064, 7066, 7067, 7068, 7070, 7071, 7072, 7073, 7076, 7082, 7141, 7143, 7144, 7201, 7203, 7205, 7207, 7209, 7211, 7267, 8041, 9927, 9941, 9945, 9961, 9962, 9963, 9964, 9966, 9967, 9971, 9972, 9973, 9982";



    // dsSql = "SELECT A.COMPANY,A.FINDOC,B.FINDOC AS X_MFINDOC,A.SOSOURCE,A.SOREDIR,A.TRNDATE,A.SERIES,A.FPRMS,A.FINCODE,A.SODTYPE,A.TRDR,C.CODE AS X_CODE,C.NAME AS X_TNAME,C.ISPROSP AS X_ISPROSP,C.SOCURRENCY AS X_SOCURRENCY,C.CMPMODE AS X_CMPMODE,A.ISPRINT,A.APPRV,A.FULLYTRANSF,A.SALESMAN,F.COMPANY AS X_004253C0A,F.SODTYPE AS X_0E7635D08,F.PRSN AS X_0BB785630,F.NAME2 AS X_06D92D9AE,F.TPRSN AS X_0E3E16557,ISNULL(A.VATAMNT,0) AS VATAMNT,ISNULL(A.EXPN,0) AS EXPN,ISNULL(A.NETAMNT,0) AS NETAMNT,ISNULL(A.SUMAMNT,0) AS SUMAMNT,ISNULL((SELECT ISNULL(A.SUMAMNT,0)*(TPRMS.FLG01-TPRMS.FLG02)  " +
    //     "FROM TPRMS, TRDTRN  " +
    //     "WHERE TPRMS.COMPANY = TRDTRN.COMPANY  " +
    //     "  AND TPRMS.SODTYPE = TRDTRN.SODTYPE " +
    //     "  AND TPRMS.TPRMS   = TRDTRN.TPRMS  " +
    //     "	AND TRDTRN.TRDR 	 = A.TRDR " +
    //     "	AND TRDTRN.SODTYPE = A.SODTYPE " +
    //     "	AND TRDTRN.COMPANY = A.COMPANY " +
    //     "	AND TRDTRN.TRNDATE = A.TRNDATE " +
    //     "  AND TRDTRN.FINDOC  = A.FINDOC),0) AS SSUMAMNT,ISNULL((SELECT ISNULL(A.NETAMNT,0)*(TPRMS.FLG01-TPRMS.FLG02)  " +
    //     "FROM TPRMS, TRDTRN  " +
    //     "WHERE TPRMS.COMPANY = TRDTRN.COMPANY  " +
    //     "  AND TPRMS.SODTYPE = TRDTRN.SODTYPE " +
    //     "  AND TPRMS.TPRMS   = TRDTRN.TPRMS  " +
    //     "	AND TRDTRN.TRDR 	 = A.TRDR " +
    //     "	AND TRDTRN.SODTYPE = A.SODTYPE " +
    //     "	AND TRDTRN.COMPANY = A.COMPANY " +
    //     "	AND TRDTRN.TRNDATE = A.TRNDATE " +
    //     "  AND TRDTRN.FINDOC  = A.FINDOC),0) AS SNETAMNT,ISNULL((SELECT ISNULL(A.VATAMNT,0)*(TPRMS.FLG01-TPRMS.FLG02)  " +
    //     "FROM TPRMS, TRDTRN  " +
    //     "WHERE TPRMS.COMPANY = TRDTRN.COMPANY  " +
    //     "  AND TPRMS.SODTYPE = TRDTRN.SODTYPE " +
    //     " AND TPRMS.TPRMS   = TRDTRN.TPRMS  " +
    //     "	AND TRDTRN.TRDR 	 = A.TRDR " +
    //     "	AND TRDTRN.SODTYPE = A.SODTYPE " +
    //     "	AND TRDTRN.COMPANY = A.COMPANY " +
    //     "	AND TRDTRN.TRNDATE = A.TRNDATE " +
    //     "  AND TRDTRN.FINDOC  = A.FINDOC),0) AS SVATAMNT,ISNULL((SELECT ISNULL(A.EXPN,0)*(TPRMS.FLG01-TPRMS.FLG02)  " +
    //     "FROM TPRMS, TRDTRN  " +
    //     "WHERE TPRMS.COMPANY = TRDTRN.COMPANY  " +
    //     " AND TPRMS.SODTYPE = TRDTRN.SODTYPE " +
    //     " AND TPRMS.TPRMS   = TRDTRN.TPRMS " +
    //     "	AND TRDTRN.TRDR 	 = A.TRDR " +
    //     "	AND TRDTRN.SODTYPE = A.SODTYPE " +
    //     "	AND TRDTRN.COMPANY = A.COMPANY " +
    //     "	AND TRDTRN.TRNDATE = A.TRNDATE " +
    //     "  AND TRDTRN.FINDOC  = A.FINDOC),0) AS SEXPN,ISNULL((SELECT SUM(CASE WHEN FP.FINPAYTERMS IS NULL THEN AF.SUMTAMNT - ISNULL(EF.SUMTAMNT,0) ELSE FP.OPNTAMNT END)  " +
    //     "FROM FINDOC AF   " +
    //     "  LEFT OUTER JOIN  FINPAYTERMS FP ON AF.FINDOC = FP.FINDOC  " +
    //     " LEFT OUTER JOIN FINDOC EF ON EF.FINDOC=AF.FINDOCPAY  " +
    //     "WHERE AF.FINDOC=A.FINDOC " +
    //     "    AND AF.ISCANCEL=0 " +
    //     "    AND AF.ORIGIN<>6 " +
    //     "),0) AS DUEPAY FROM ((((FINDOC A LEFT OUTER JOIN MTRDOC B ON A.FINDOC=B.FINDOC) LEFT OUTER JOIN TRDR C ON A.TRDR=C.TRDR) LEFT OUTER JOIN TRDEXTRA D ON A.TRDR=D.TRDR) LEFT OUTER JOIN PRSN E ON A.SALESMAN=E.PRSN) LEFT OUTER JOIN PRSN F ON A.SALESMAN=F.PRSN WHERE A.COMPANY=1 AND A.COMPANY=1 AND A.SOSOURCE=1351 AND A.SOREDIR=0  " +
    //     " AND A.TRNDATE>='" + datefrom + "' AND A.TRNDATE<='" + dateto + "' AND A.FPRMS IN (7001,7011,7021,7023,7041,7042,7043,7045,7061,7062,7063,7064,7066,7067,7068,7070,7071,7072,7073,7076,7082,7141,7143,7144,7201,7203,7205,7207,7209,7211,7267,8041,9927,9941,9945,9961,9962,9963,9964,9966,9967,9971,9972,9973,9982) AND A.SODTYPE=13 AND A.TRDR=" + client_id;


    // Query Filters
    dsSqlWhere = "WHERE A.COMPANY = :1  AND A.SOSOURCE = 1351  AND A.SOREDIR = 0 AND A.SODTYPE = 13  " +
        "AND A.TRNDATE >= '" + datefrom + "' " +
        "AND A.TRNDATE <= '" + dateto + "'  " +
        "AND A.FPRMS IN (" + series + ") " +
        "AND A.TRDR = " + client_id;


    dsSql = "SELECT A.FINDOC as id, A.TRNDATE as date, A.SERIES as series, A.FINCODE as doc, C.CODE AS client_code, C.NAME AS client_name, " +
        "ISNULL( " +
        " ( " +
        "    SELECT  " +
        "      SUM( " +
        "        CASE WHEN FP.FINPAYTERMS IS NULL THEN AF.SUMTAMNT - ISNULL(EF.SUMTAMNT, 0) ELSE FP.OPNTAMNT END " +
        "      )  " +
        "    FROM  " +
        "      FINDOC AF  " +
        "      LEFT OUTER JOIN FINPAYTERMS FP ON AF.FINDOC = FP.FINDOC " +
        "      LEFT OUTER JOIN FINDOC EF ON EF.FINDOC = AF.FINDOCPAY  " +
        "    WHERE  " +
        "     AF.FINDOC = A.FINDOC " +
        "     AND AF.ISCANCEL = 0 " +
        "     AND AF.ORIGIN <> 6 " +
        "  ),  " +
        "  0 " +
        ") AS total " +
        "FROM  " +
        "( " +
        "  ( " +
        "   ( " +
        "      ( " +
        "       FINDOC A  " +
        "       LEFT OUTER JOIN MTRDOC B ON A.FINDOC = B.FINDOC " +
        "     ) " +
        "     LEFT OUTER JOIN TRDR C ON A.TRDR = C.TRDR " +
        "   ) " +
        "    LEFT OUTER JOIN TRDEXTRA D ON A.TRDR = D.TRDR " +
        "  )  " +
        "  LEFT OUTER JOIN PRSN E ON A.SALESMAN = E.PRSN " +
        ")  " +
        "LEFT OUTER JOIN PRSN F ON A.SALESMAN = F.PRSN  ";

    // Query Order
    dsSqlOrder = " ORDER BY A.TRNDATE DESC,A.FINDOC ";

    dsSql = dsSql + dsSqlWhere + dsSqlOrder;
    //return dsSql;
    dsData = X.GETSQLDATASET(dsSql, X.SYS.COMPANY);
    response.totalcount = dsData.RECORDCOUNT;

    // dsData.FIRST;
    // rows = [];

    response.totalcount = dsData.RECORDCOUNT;
    response.data = JSON.parse(dsData.JSON);
    return response;
}

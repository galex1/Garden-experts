//// ConnectLineB2BConnector.S1Lib
/// ------------------------------------------------
// LAST UPDATE -> 2023-05-24 14:34 - galex
/// ------------------------------------------------
//lib.include("CLLogging.Logger");
lib.include("ConnectLineEshopCommon.common");
lib.include("ConnectLineB2BConnector.getMasterData");
lib.include("ConnectLineB2BConnector.getDocs");
lib.include("ConnectLineB2BConnector.setMasterData");
lib.include("ConnectLineB2BConnector.setDocs");

function ApiServices(obj) {
    //var logConfig = { module: "CLEshopConnector", minSeverity: 1 };	
    //debugger
    //return;
    requestObj = convertKeysToLowerCase(obj);
    //LogTrace(obj.service,JSON.stringify(obj));

    if (!checkRequest(requestObj)) {
        //LogError(requestObj.service, "Authentication failed!", logConfig);
        //logConfig.message="Authentication failed!";
        return responseError("Authentication failed!");
    }

    try {
        var responseObj = null;
        /*					getMasterData				*/
        if (requestObj.service == 'getBrands')
            responseObj = getBrands(requestObj);
        else if (requestObj.service == 'getCategories')
            responseObj = getCategories(requestObj);
        else if (requestObj.service == 'getVariations')
            responseObj = getVariations(requestObj);
        else if (requestObj.service == 'getAttributes')
            responseObj = getAttributes(requestObj);
        else if (requestObj.service == 'getVariationOptions')
            responseObj = getVariationOptions(requestObj);
        else if (requestObj.service == 'getItems')
            responseObj = getItems(requestObj);
        else if (requestObj.service == 'getItemsTest')
            responseObj = getItemsTest(requestObj);
        else if (requestObj.service == 'getItemsStock')
            responseObj = getItemsStock(requestObj);
        else if (requestObj.service == 'getItemVariations')
            responseObj = getItemVariations(requestObj);
        else if (requestObj.service == 'getItemAttributes')
            responseObj = getItemAttributes(requestObj);
        else if (requestObj.service == 'getItemsImage')
            responseObj = getItemsImage(requestObj);
        else if (requestObj.service == 'getCustomers')
            responseObj = getCustomers(requestObj);
        else if (requestObj.service == 'getCustomerTransactions')
            responseObj = getCustomerTransactions(requestObj);
        else if (requestObj.service == 'getClientDocs')
            responseObj = getClientDocs(requestObj);
        /*					getDocs				*/
        else if (requestObj.service == 'getOrderExists')
            responseObj = getOrderExists(requestObj);
        else if (requestObj.service == 'getOrdersStatus')
            responseObj = getOrdersStatus(requestObj);
        else if (requestObj.service == 'getOrderOnPdf')
            responseObj = getOrderOnPdf(requestObj);
        /*					setMasterData				*/
        else if (requestObj.service == 'setCustomer')
            responseObj = setCustomer(requestObj);
        /*					setDocs				*/
        else if (requestObj.service == 'setOrder')
            responseObj = setOrder(requestObj);
        else if (requestObj.service == 'calculate')
            responseObj = calculateOrder(requestObj);
        else if (requestObj.service == 'setItem')
            responseObj = setItemX(requestObj);
        else
            responseObj = responseError("Undefined job!");

        //LogTrace(requestObj.service, JSON.stringify(responseObj), logConfig);
        return responseObj;
    }
    catch (ex) {
        //LogError(obj.service, ex.message, logConfig);
        return responseError("Failed to process service!");
    }
}
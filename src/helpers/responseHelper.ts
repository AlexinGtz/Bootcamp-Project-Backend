const responseHelper = (statusCode, message, data?) => {
    const body = {
        message,
    }

    if (data) {
        body['data'] = data;
    }
    
    return {
        statusCode: statusCode,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(body)
    }
}

export default responseHelper;
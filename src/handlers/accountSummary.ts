// POST
import { CustomDynamoDB } from "../dynamodb/database";
import responseHelper from "../helpers/responseHelper"
import { validateToken } from "../helpers/validations";

const usersDB = new CustomDynamoDB('local-bootcamp-bank-api-users', 'email');

export const handler = async (event: any) => {
    // Validar Token
    const tokenData = await validateToken(event.headers.Authorization);
    if (!tokenData) {
        return responseHelper(403, 'Failed Authenticating');
    }
    
    const user = await usersDB.getItem(tokenData.email);

    if (!user) { 
        return responseHelper(404, 'User Not Found');
    }

    return responseHelper(200, 'Success', {
        transactions: user.transactions,
        balance: user.balance
    })
}
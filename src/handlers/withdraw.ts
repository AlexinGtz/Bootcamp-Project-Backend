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
    
    const body = JSON.parse(event.body);

    const {
        email,
        quantity
    } = body;

    if (email !== tokenData.email) {
        return responseHelper(403, 'User mail not in token');
    }

    const user = await usersDB.getItem(email);

    if (!user) {
        return responseHelper(404, 'User Not Found');
    }

    const newBalance = user.balance -= quantity;

    try {
        await usersDB.updateItem(tokenData.email, {
            balance: newBalance
        });
    } catch (e) {
        return responseHelper(500, 'Failed to update item');
    }

    return responseHelper(200, 'Success', {
        newBalance
    });
}
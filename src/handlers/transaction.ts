// POST
import { CustomDynamoDB } from "../dynamodb/database";
import responseHelper from "../helpers/responseHelper"
import { validateToken } from "../helpers/validations";
import { TRANSACTION_TYPES } from '../helpers/constants';

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
        quantity,
        transactionType,
        contact
    } = body;

    if (email !== tokenData.email) {
        return responseHelper(403, 'User mail not in token');
    }
   
    if (!transactionType || transactionType.trim() === '') {
        return responseHelper(400, 'No transaction type provided');
    }

    if (transactionType === TRANSACTION_TYPES.TRANSFER && !contact) {
        return responseHelper(400, 'No contact provided for this transfer');
    }

    const txnTypes = Object.values(TRANSACTION_TYPES);

    if(!txnTypes.includes(transactionType)) {
        return responseHelper(400, 'Unknown transaction type');
    }

    const user = await usersDB.getItem(email);

    if (!user) {
        return responseHelper(404, 'User Not Found');
    }

    let newBalance;

    const today = new Date().toISOString();

    const transactionData = {
        date: today,
        amount: quantity,
        transactionType: transactionType,
        transferType: transactionType === TRANSACTION_TYPES.TRANSFER ? 'OUTGOING' : null,
        contact: transactionType === TRANSACTION_TYPES.TRANSFER ? contact : null
    }

    switch(transactionType) {
        case TRANSACTION_TYPES.DEPOSIT:
            newBalance = user.balance += quantity;
            break;
        case TRANSACTION_TYPES.WITHDRAW:
            newBalance = user.balance -= quantity;
            break;
        case TRANSACTION_TYPES.TRANSFER:
            newBalance = user.balance -= quantity;

            if (newBalance < 0) {
                return responseHelper(400, 'Cannot transfer/withdraw more than your balance');
            }

            const userContact = await usersDB.getItem(contact);

            if (!userContact) {
                return responseHelper(404, 'Contact Not Found');
            }

            const constactTransactionData = {
                date: today,
                amount: quantity,
                transactionType: transactionType,
                transferType: 'INCOMING',
                contact: user.email
            }

            const contactNewBalance = userContact.balance += quantity;

            try {
                await usersDB.updateItem(userContact.email, {
                    balance: contactNewBalance,
                    transactions: [
                        ...userContact.transactions,
                        constactTransactionData
                    ]
                });
            } catch (e) {
                return responseHelper(500, 'Failed to update item');
            }
            break;
    }

    if (newBalance < 0) {
        return responseHelper(400, 'Cannot transfer/withdraw more than your balance');
    }

    try {
        await usersDB.updateItem(tokenData.email, {
            balance: newBalance,
            transactions: [
                ...user.transactions,
                transactionData
            ]
        });
    } catch (e) {
        return responseHelper(500, 'Failed to update item');
    }

    return responseHelper(200, 'Success', {
        newBalance
    });
}
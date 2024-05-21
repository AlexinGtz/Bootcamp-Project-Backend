// POST
import * as jwt from 'jsonwebtoken';
import { CustomDynamoDB } from "../dynamodb/database";
import responseHelper from "../helpers/responseHelper"
import { validatePassword } from "../helpers/validations";
import { DAY_IN_S } from "../helpers/constants"

const usersDB = new CustomDynamoDB('local-bootcamp-bank-api-users', 'email');

export const handler = async (event: any) => {
    const body = JSON.parse(event.body);

    const {
        email,
        password
    } = body;

    if (!email || email.trim() === '') {
        return responseHelper(400, 'Email or password not provided');
    }

    const user = await usersDB.getItem(email);

    if (!user) {
        return responseHelper(404, 'User Not Found');
    }

    const passwordsMatch = validatePassword(user.password, password);

    if (!passwordsMatch) {
        return responseHelper(400, 'Passwords don\'t match');
    }

    console.log('SECRET', process.env.TOKEN_SECRET);

    const token = jwt.sign(
        {
            email,
            firstName: user.firstName,
            lastName: user.lastName
        },
        process.env.TOKEN_SECRET,
        {
            expiresIn: '24h'
        }
    );


    return responseHelper(200, 'Success', {
        userType: user.userType,
        email: user.email,
        token: token,
        expiresIn: DAY_IN_S
    });
}
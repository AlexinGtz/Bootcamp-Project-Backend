// POST
import * as tokenGen from 'jsonwebtoken';
import { CustomDynamoDB } from "../dynamodb/database";
import responseHelper from "../helpers/responseHelper";
import { validateEmail, validatePassword } from "../helpers/validations";

const userDB = new CustomDynamoDB('local-bootcamp-classroom-api-users', 'email')

  
export const handler = async(event: any) => {
    const body = JSON.parse(event.body);

    const {
        userEmail, 
        userPassword
    } = body;
    
    if(!userEmail || userEmail.trim()==='') {
            return responseHelper(400, 'Email not provided')
    }

    const emailVerified = validateEmail(userEmail)

    if(!emailVerified) {
        return responseHelper(404, 'Email format not valid')     
    }

    const user = await userDB.getItem(userEmail);

    if(!user) {
        return responseHelper(400, 'User not found')
    }
    
    const passwordMatch = validatePassword(user.password, userPassword)

    if(!passwordMatch) {
        return responseHelper(400, 'Passwords do not match')
    }
    

    const token = tokenGen.sign(
        {
            userType: user.userType,
            userEmail
        },
        process.env.TOKEN_SECRET,
        {
            expiresIn: '24h'
        }
    );

    return responseHelper(200, 'Success', {
        accessToken: token,
        userType: user.userType,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
    })
}
//Post
import { CustomDynamoDB } from "../dynamodb/database";
import { HTTP_CODES, USER_TYPES } from "../helpers/constants";
import responseHelper from "../helpers/responseHelper";
import { validateEmail, validateToken } from "../helpers/validations";

const usersDB = new CustomDynamoDB('local-bootcamp-classroom-api-users', 'email');

export const handler = async(event: any) => {
    //Validate Token
    const tokenData = await validateToken(event.headers.Authorization);
    if (!tokenData) {
        return responseHelper(HTTP_CODES.FORBIDDEN, "Authentication Failed"); 
    }

    if (tokenData.userType !== USER_TYPES.TEACHER) {
        return responseHelper(HTTP_CODES.UNAUTHORIZED, "You are not authorized to perform this action.");
    }

    
    const body = JSON.parse(event.body);
    
    const {
        firstName,
        lastName,
        email,
        age
        } = body

    const user = await usersDB.getItem(email);

    if(user){
        return responseHelper(HTTP_CODES.FORBIDDEN, "Email already registered on the system.")
    }

    if (!email || email.trim() === ''){
        return responseHelper(HTTP_CODES.BAD_REQUEST, "Student email not provided.")
    }
    if (!firstName || firstName.trim() === ''){
        return responseHelper(HTTP_CODES.BAD_REQUEST, "Student First name not provided.")
    }
    if (!lastName || lastName.trim() === ''){
        return responseHelper(HTTP_CODES.BAD_REQUEST, "Student Last name not provided.")
    }
    if (!age || typeof(age) !== 'number'){
        return responseHelper(HTTP_CODES.BAD_REQUEST, "Student age not provided or valid.")
    }
    
    const validEmail = validateEmail(email)
    if(!validEmail) {
        return responseHelper(404, 'Email provided not valid.')     
    }
    
    const newPassword = Math.random().toString(36).slice(-8)  

    try{
        await usersDB.putItem({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            password: newPassword,
            age,
            subjects: [],
            userType: USER_TYPES.STUDENT
        })
    } catch (e){
        return responseHelper(500, "Something went wrong adding the student.")
    }

    return responseHelper(200, "Student added succesfully.")
}



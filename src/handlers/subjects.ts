//Get
import { CustomDynamoDB } from "../dynamodb/database";
import { HTTP_CODES, USER_TYPES } from "../helpers/constants";
import responseHelper from "../helpers/responseHelper";
import { validateToken } from "../helpers/validations";

const usersDB = new CustomDynamoDB('local-bootcamp-classroom-api-users', 'email');
const subjectsDB = new CustomDynamoDB('local-bootcamp-classroom-api-subjects', 'email');
const homeworkSubmissionDB = new CustomDynamoDB('local-bootcamp-classroom-api-homeworkSubmissions', 'email');

export const handler = async(event: any) => {
    //Validate Token
    const tokenData = await validateToken(event.headers.Authorization);
    if (!tokenData) {
        return responseHelper(HTTP_CODES.FORBIDDEN, "Authentication Failed"); 
    }

    if (tokenData.userType !== USER_TYPES.STUDENT) {
        return responseHelper(HTTP_CODES.UNAUTHORIZED, "You are not authorized to perform this action.");
    }
    console.log(tokenData, "token");
    
    const user = await usersDB.getItem(tokenData.userEmail);
    const subjectPromises = user.subjects.map((subjectId) => {
        return subjectsDB.getItem(subjectId)
    })
    const homeworkSubmissionPromises = user.subjects.map((subjectId) => {
        return homeworkSubmissionDB.query(subjectId, user.email, "=", "subjectId-Index","studentEmail")
        })
    const subjectsArray = await Promise.all(subjectPromises);
    const homeworkSubmissionArray = await Promise.all(homeworkSubmissionPromises);
    


    if( !user ){
        return responseHelper(HTTP_CODES.FORBIDDEN, "No data found.")
    }

    return responseHelper(HTTP_CODES.SUCCESS, "Success.", {
        id: user.id,
        teacherEmail: user.teacherEmail,
        name: user.name,
        description: user.description,
        grade: userGrade.grade
    })
}
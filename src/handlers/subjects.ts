//Get
import { CustomDynamoDB } from "../dynamodb/database";
import { calculateAvgGrade } from "../helpers/calculations";
import { HTTP_CODES, USER_TYPES } from "../helpers/constants";
import responseHelper from "../helpers/responseHelper";
import { validateToken } from "../helpers/validations";

const usersDB = new CustomDynamoDB('local-bootcamp-classroom-api-users', 'email');
const subjectsDB = new CustomDynamoDB('local-bootcamp-classroom-api-subjects', 'id');
const homeworkSubmissionDB = new CustomDynamoDB('local-bootcamp-classroom-api-homeworkSubmissions', 'id');

export const handler = async(event: any) => {
    //Validate Token
    const tokenData = await validateToken(event.headers.Authorization);
    if (!tokenData) {
        return responseHelper(HTTP_CODES.FORBIDDEN, "Authentication Failed"); 
    }
    //Validate is Student
    if (tokenData.userType !== USER_TYPES.STUDENT) {
        return responseHelper(HTTP_CODES.UNAUTHORIZED, "You are not authorized to perform this action.");
    }
    //Get users, subjects and homeworks submited from DB
    const user = await usersDB.getItem(tokenData.userEmail);
    const subjectPromises = user.subjects.map((subjectId) => {
        return subjectsDB.getItem(subjectId)
    })
    const homeworkSubmissionPromises = user.subjects.map((subjectId) => {
        return homeworkSubmissionDB.query(subjectId, null, null , "subjectId-Index")
        })
    const subjectsArray = await Promise.all(subjectPromises);
    const homeworkSubmissionArray = (await Promise.all(homeworkSubmissionPromises)).flat();

    if( !user ){
        return responseHelper(HTTP_CODES.FORBIDDEN, "No data found.")
    }
    const subjectInfoResponse = subjectsArray.map((subject) => {
        const filteredSubmissions = homeworkSubmissionArray.filter((hmwksubmission) => {
            return subject.id === hmwksubmission.subjectId && hmwksubmission.studentEmail === user.email
        })
        return {
            id: subject.id,
            teacherEmail: subject.teacherEmail,
            name: subject.name,
            description: subject.description,
            grade: calculateAvgGrade(filteredSubmissions)
        }
    })

    return responseHelper(HTTP_CODES.SUCCESS, "Success.", subjectInfoResponse)
}

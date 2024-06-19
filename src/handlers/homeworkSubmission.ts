// GET
import { CustomDynamoDB } from "../dynamodb/database";
import responseHelper from "../helpers/responseHelper";
import { validateToken } from "../helpers/validations";

const homeworkSubmissionDB = new CustomDynamoDB('local-bootcamp-classroom-api-homeworkSubmissions', 'id')
const userDB = new CustomDynamoDB('local-bootcamp-classroom-api-users', 'email')
const subjectDB = new CustomDynamoDB('local-bootcamp-classroom-api-subjects', 'id')


export const handler = async(event: any) => {
    const tokenData = await validateToken(event.headers.Authorization)

    if(!tokenData){
        return responseHelper(403, 'Fail Authenticating');
    }
 
    if(tokenData.userType !== "TEACHER"){
        return responseHelper(401, 'The user type is not a TEACHER');
    }

    if(!event.pathParameters || event.pathParameters.subjectId.trim() === '') {
        return responseHelper(400, 'Subject ID is required')
    }
    
    const subjectId = event.pathParameters.subjectId;

    const [subject, user] = await Promise.all([
        subjectDB.getItem(subjectId),
        userDB.getItem(tokenData.userEmail),
       ])

    if(!subject) {
        return responseHelper(400, 'Subject not found')
    }
    
    if(!user.subjects.includes(subject.id)) {
        return responseHelper(400, 'The subject does not belong to the teacher')
    }

    const homeworkSubmissions = await homeworkSubmissionDB.query(subjectId, null, null, "subjectId-Index")

    const mappedHomeworkSubmissions = homeworkSubmissions.map((item: any) => {
        return {
            id: item.id,
            homeworkId: item.homeworkId,
            subjectId: item.subjectId,
            studentEmail: item.studentEmail,
            grade: item.grade,
            submissionText: item.submissionText,
            submissionDate: item.submissionDate
        }
    })

    return responseHelper(200, 'Success', mappedHomeworkSubmissions)
}
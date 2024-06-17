// GET
import { CustomDynamoDB } from "../dynamodb/database";
import responseHelper from "../helpers/responseHelper";
import { validateToken } from "../helpers/validations";

const homeworkDB = new CustomDynamoDB('local-bootcamp-classroom-api-homeworks', 'id')
const homeworkSubmissionDB = new CustomDynamoDB('local-bootcamp-classroom-api-homeworkSubmissions', 'id')
const userDB = new CustomDynamoDB('local-bootcamp-classroom-api-users', 'email')

export const handler = async(event: any) => {
    const tokenData = await validateToken(event.headers.Authorization)

    if(!tokenData){
        return responseHelper(403, 'Fail Authenticating');
    }
 
    if(tokenData.userType !== "TEACHER"){
        return responseHelper(401, 'The user type is not a TEACHER');
    }

    if(!event.pathParameters || event.pathParameters.homeworkId.trim() === '') {
        return responseHelper(400, 'Homework ID is required')
    }
    
    const homeworkId = event.pathParameters.homeworkId;

    const [homework, user, homeworkSubmission] = await Promise.all([
        homeworkDB.getItem(homeworkId),
        userDB.getItem(tokenData.userEmail),
        homeworkSubmissionDB.query(homeworkId, null, null, "homeworkId-Index")
    ])

    if(!homework) {
        return responseHelper(400, 'Homework not found')
    }

    if(!user.subjects.includes(homework.subjectId)) {
        return responseHelper(400, 'The homework does not belong to the teacher')
    }

    const studentSubmissions = await Promise.all(homeworkSubmission.map(async (item: any) => {
        const user = await userDB.getItem(item.studentEmail)
        return {
            studentName: `${user.firstName} ${user.lastName}`,
            submissionText: item.submissionText
        }
    }))

    const homeworkDetails = {
        name: homework.name,
        description: homework.description,
        submissions: studentSubmissions,
        dueDate: homework.dueDate 
    }
    
    return responseHelper(200, 'Success', homeworkDetails)
}
// GET
import { CustomDynamoDB } from "../dynamodb/database";
import responseHelper from "../helpers/responseHelper";
import { validateToken } from "../helpers/validations";

const homeworkDB = new CustomDynamoDB('local-bootcamp-classroom-api-homeworks', 'id')
const homeworkSubmissionDB = new CustomDynamoDB('local-bootcamp-classroom-api-homeworkSubmissions', 'id')

  
export const handler = async(event: any) => {
    const tokenData = await validateToken(event.headers.Authorization)

    if(!tokenData){
        return responseHelper(403, 'Fail Authenticating');

    }

    if(!event.pathParameters || event.pathParameters.homeworkId.trim() === '') {
        return responseHelper(400, 'Homework ID is required')
    }

    const homeworkId = event.pathParameters.homeworkId;

    const homework = await homeworkDB.getItem(homeworkId);

    if(!homework) {
        return responseHelper(400, 'Homework not found')
    }
    
    const homeworkSubmission = await homeworkSubmissionDB.query(homeworkId, tokenData.userEmail, "=", "homeworkId-Index", "studentEmail")

    const pendingSubmission = (!homeworkSubmission || homeworkSubmission.length === 0) ? true : false

    return responseHelper(200, 'Success', {
        homeorkId: homework.id,
        subjectId: homework.subjectId,
        name: homework.name,
        description: homework.description,
        dueDate: homework.dueDate,
        grade: pendingSubmission ? false : homeworkSubmission[0].grade,
        pendingSubmission: pendingSubmission
    })
}
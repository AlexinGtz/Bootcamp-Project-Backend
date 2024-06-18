// GET
import { CustomDynamoDB } from "../dynamodb/database";
import responseHelper from "../helpers/responseHelper";
import { validateToken } from "../helpers/validations";

const subjectsDB = new CustomDynamoDB('local-bootcamp-classroom-api-subjects', 'id')
const homeworksDB = new CustomDynamoDB('local-bootcamp-classroom-api-homeworks', 'id')

  
export const handler = async(event: any) => {
    const tokenData = await validateToken(event.headers.Authorization)

    if(!tokenData){
        return responseHelper(403, 'Fail Authenticating');
    }
 
    if(!event.queryStringParameters || event.queryStringParameters?.subjectId.trim() === '') {
        return responseHelper(400, 'Subject ID is required')
    }
    
    const subject = await subjectsDB.getItem(event.queryStringParameters.subjectId);

    if(!subject || subject.length === 0) {
        return responseHelper(400, 'Subject not found')
    }
    
    const homeworks = await homeworksDB.query(subject.id, null, null, "subjectId-Index")

    const subjectDetails = {
        name: subject.name,
        description: subject.description,
        students: subject.students,
        homeworks: homeworks.map((item: any) => {
            return {
                name: item.name,
                dueDate: item.dueDate,
                description: item.description,
            }
        })
    }
    
    return responseHelper(200, 'Success', subjectDetails)
}
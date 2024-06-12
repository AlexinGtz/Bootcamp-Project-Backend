// GET
import { CustomDynamoDB } from "../dynamodb/database";
import responseHelper from "../helpers/responseHelper";
import { validateToken } from "../helpers/validations";

const subjectsDB = new CustomDynamoDB('local-bootcamp-classroom-api-subjects', 'id')

export const handler = async(event: any) => {
    const tokenData = await validateToken(event.headers.Authorization)

    if(!tokenData){
        return responseHelper(403, 'Fail Authenticating');
    }

    if(!event.pathParameters || event.pathParameters.teacherEmail.trim() === '' || tokenData.userType !== "TEACHER"){
        return responseHelper(400, 'Teacher email is required')
    }

    if(tokenData.userEmail !== event.pathParameters.teacherEmail){
        return responseHelper(403, 'Teacher email not in token')
    }

    const subjects = await subjectsDB.query(tokenData.userEmail, null, null, "teacherEmail-Index")

    if(!subjects || subjects.length === 0){
        return responseHelper(400, 'No subjects found')
    }
    
    const mappedSubjects = subjects.map((item: any) => {
        return {
            subjectId: item.id,
            name: item.name,
            description: item.description,
            students: item.students
        }
    })
    
    return responseHelper(200, 'Success', mappedSubjects)
}
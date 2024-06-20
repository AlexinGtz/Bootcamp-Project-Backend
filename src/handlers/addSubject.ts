// POST
import { CustomDynamoDB } from "../dynamodb/database";
import responseHelper from "../helpers/responseHelper";
import { validateToken } from "../helpers/validations";
import { v4 as uuidv4 } from 'uuid';

const userDB = new CustomDynamoDB('local-bootcamp-classroom-api-users', 'email')
const subjectDB = new CustomDynamoDB('local-bootcamp-classroom-api-subjects', 'id')

export const handler = async(event: any) => {
    const tokenData = await validateToken(event.headers.Authorization)

    if(!tokenData){
        return responseHelper(403, 'Fail Authenticating');
    }
 
    if(tokenData.userType !== "TEACHER"){
        return responseHelper(401, 'The user type is not a TEACHER')
    }

    const body = JSON.parse(event.body);

    const {
        subjectName, 
        subjectDescription
    } = body;
    
    if(!subjectName || subjectName.toString().trim() === '') {
            return responseHelper(400, 'Subject name not provided')
    }

    if(!subjectDescription || subjectDescription.toString().trim() === '') {
        return responseHelper(400, 'Subject description not provided')
    }

    const [user, teacherSubjects] = await Promise.all([
        userDB.getItem(tokenData.userEmail),
        subjectDB.query(tokenData.userEmail, null, null, "teacherEmail-Index")
    ])

    if(!user) {
        return responseHelper(400, 'User not found')
    }
    
    if(teacherSubjects.find((subject: any) => subject.name === subjectName)) {
        return responseHelper(400, 'Already exists a subject with the same name for this teacher')
    }

    const subjectId = uuidv4()

    try {
        await subjectDB.putItem({
            id: subjectId,
            teacherEmail: tokenData.userEmail,
            name: subjectName.toString(),
            description: subjectDescription.toString(),
            students:[]
        });
    } catch(error) {
        return responseHelper(500, `Failed to add the subject - ${error.message}`)
    }

    try {
        await userDB.updateItem(tokenData.userEmail, {
            subjects: [
                ...user.subjects,
                subjectId
            ]
        });
    } catch(error) {
        return responseHelper(500, `Failed to update the user - ${error.message}`)
    }

    return responseHelper(200, 'Success')
}
// POST
import { CustomDynamoDB } from "../dynamodb/database";
import responseHelper from "../helpers/responseHelper";
import { validateToken } from "../helpers/validations";
import { v4 as uuidv4 } from 'uuid';

const userDB = new CustomDynamoDB('local-bootcamp-classroom-api-users', 'email')
const subjectDB = new CustomDynamoDB('local-bootcamp-classroom-api-subjects', 'id')
const subjectHomeworkDB = new CustomDynamoDB('local-bootcamp-classroom-api-homeworks', 'id')


export const handler = async(event: any) => {
    const tokenData = await validateToken(event.headers.Authorization)

    if(!tokenData) {
        return responseHelper(403, 'Fail Authenticating')
    }
 
    if(tokenData.userType !== "TEACHER") {
        return responseHelper(401, 'The user type is not a TEACHER')
    }

    const body = JSON.parse(event.body);

    const {
        name, 
        description,
        dueDate,
        subjectId
    } = body;
    
    if(!name || name.trim() === '') {
        return responseHelper(400, 'Homework name not provided')
    }

    if(!description || description.trim() === '') {
        return responseHelper(400, 'Homework description not provided')
    }

    if(!dueDate || dueDate.trim() === '') {
        return responseHelper(400, 'Homework due date not provided')
    }
    
    const validDueDate = new Date(dueDate)

    if(validDueDate.toString() === "Invalid Date") {
        return responseHelper(400, 'Homework due date is not a valid date')
    }

    if(!subjectId || subjectId.trim() === '') {
        return responseHelper(400, 'Subject ID not provided')
    }
    
    const [user, subject, subjectHomeworks] = await Promise.all([
        userDB.getItem(tokenData.userEmail),
        subjectDB.getItem(subjectId),
        subjectHomeworkDB.query(subjectId, null, null, "subjectId-Index"),
    ])

    if(!user) {
        return responseHelper(400, 'User not found')
    }
    
    if(!subject) {
        return responseHelper(400, 'Subject not found')
    }

    if(!user.subjects.includes(subjectId)) {
        return responseHelper(400, 'The subject does not belong to the teacher')
    }

    if(subjectHomeworks.find((homework: any) => homework.name === name.trim())) {
        return responseHelper(400, 'Already exists a homework with the same name for this subject')
    }

    try {
        await subjectHomeworkDB.putItem({
            id: uuidv4(),
            subjectId: subjectId,
            name: name.trim(),
            dueDate: validDueDate,
            description: description
        });
    } catch(error) {
        return responseHelper(500, `Failed to add the homework - ${error.message}`)
    }

    return responseHelper(200, 'Success')
}
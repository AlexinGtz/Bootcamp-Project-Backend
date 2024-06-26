// POST
import { CustomDynamoDB } from "../dynamodb/database";
import responseHelper from "../helpers/responseHelper";
import { validateToken } from "../helpers/validations";
import { v4 as uuidv4 } from 'uuid';

const userDB = new CustomDynamoDB('local-bootcamp-classroom-api-users', 'email')
const homeworkDB = new CustomDynamoDB('local-bootcamp-classroom-api-homeworks', 'id')
const homeworkSubmissionDB = new CustomDynamoDB('local-bootcamp-classroom-api-homeworkSubmissions', 'id')

export const handler = async(event: any) => {
    const tokenData = await validateToken(event.headers.Authorization)

    if(!tokenData){
        return responseHelper(403, 'Fail Authenticating');
    }
 
    if(tokenData.userType !== "STUDENT"){
        return responseHelper(401, 'The user type is not a STUDENT')
    }

    const body = JSON.parse(event.body);

    const {
        studentId, 
        homeworkId,
        submission,
    } = body;
    
    if(!studentId || studentId.trim() === '') {
            return responseHelper(400, 'Student ID not provided')
    }
    
    if(tokenData.userEmail !== studentId){
        return responseHelper(403, 'Student email does not match token')
    }

    if(!homeworkId || homeworkId.trim() === '') {
        return responseHelper(400, 'Homework ID not provided')
    }

    if(!submission || submission.trim() === '') {
        return responseHelper(400, 'Submission not provided')
    }

    const [user, homework, homeworkSubmission] = await Promise.all([
        userDB.getItem(studentId), 
        homeworkDB.getItem(homeworkId),
        homeworkSubmissionDB.query(homeworkId, tokenData.userEmail, "=", "homeworkId-Index", "studentEmail") 
    ])

    if(!user) {
        return responseHelper(400, 'User not found')
    }
    
    if(!homework) {
        return responseHelper(400, 'Homework not found')
    }
    
    if(homeworkSubmission.length !== 0) {
        return responseHelper(400, 'Already exists a homework submission for this student')
    }

    const submissionDate = new Date()
    const dueDate = new Date(homework.dueDate)

    if (dueDate < submissionDate) {
        return responseHelper(400, 'The submission date has passed')
    }

    try {
        await homeworkSubmissionDB.putItem({
            id: uuidv4(),
            homeworkId: homeworkId,
            studentEmail: studentId,
            subjectId: homework.subjectId,
            grade: null,
            submissionText: submission,
            submissionDate: submissionDate.toISOString()
        });
    } catch(error) {
        return responseHelper(500, `Failed to submit the homework - ${error.message}`)
    }

    return responseHelper(200, 'Success')
}
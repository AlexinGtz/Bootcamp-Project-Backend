// GET
import { CustomDynamoDB } from "../dynamodb/database";
import responseHelper from "../helpers/responseHelper";
import { validateToken } from "../helpers/validations";
import { calculateAvgGrade } from "../helpers/calculations";

const subjectDB = new CustomDynamoDB("local-bootcamp-classroom-api-subjects","id");
const homeworkDB = new CustomDynamoDB("local-bootcamp-classroom-api-homeworks", "id");
const homeworkSubmissionDB = new CustomDynamoDB("local-bootcamp-classroom-api-homeworkSubmissions","id");

export const handler = async (event: any) => {
    const tokenData = await validateToken(event.headers.Authorization);

    if (!tokenData) {
        return responseHelper(403, "Fail Authenticating");
    }

    if (tokenData.userType !== "STUDENT") {
        return responseHelper(401, "The user type is not a STUDENT");
    }

    if (!event.pathParameters || event.pathParameters.subjectId.trim() === "") {
        return responseHelper(400, "Subject ID is required");
    }

    const subjectId = event.pathParameters.subjectId;

    const subject = await subjectDB.getItem(subjectId);

    if (!subject) {
        return responseHelper(400, "Subject not found");
    }

    const homeworks = await homeworkDB.query(subjectId, null, null, "subjectId-Index");

    if (homeworks.length === 0) {
        return responseHelper(400, "There are not any homeworks for this subject");
    }

    const mappedHomeworks = await Promise.all(
        homeworks.map(async (item: any) => {
            const homeworkSubmission = await homeworkSubmissionDB.query(item.id, tokenData.userEmail, "=","homeworkId-Index", "studentEmail");
            
            const pendingSubmission = !homeworkSubmission || homeworkSubmission.length === 0;

            return {
                name: item.name,
                grade: pendingSubmission ? null : homeworkSubmission[0].grade,
                description: item.description,
                pending: pendingSubmission
            };
        })
    );

    const userGrade = calculateAvgGrade(mappedHomeworks);

    const subjectHomeworks = {
        subjectName: subject.name,
        userEmail: tokenData.userEmail,
        subjectDescription: subject.description,
        userGrade: isNaN(userGrade) ? 0 : userGrade,
        homeworks: mappedHomeworks
    };

    return responseHelper(200, "Success", subjectHomeworks);
};

import { CustomDynamoDB } from "../dynamodb/database";

const userDB =  new CustomDynamoDB('local-')

export const handler = async (event: any) => {
    try {

        const body = JSON.parse(event.body);
        const { subjectId, userId } = body;

        // Query homeworks for the subject
        const homeworks = await queryHomeworks(subjectId);

        // Query submissions for the homeworks by user
        const submissions = await querySubmissions(homeworks, userId);

        // Calculate user grade
        const userGrade = calculateUserGrade(submissions);

        // Return the result
        return {
            statusCode: 200,
            body: JSON.stringify({ userGrade }),
        };
    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
}  ;

// Function to query homeworks for the given subjectId
const queryHomeworks = async (subjectId: string) => {
    const params = {
        TableName: 'homeworks',
        IndexName: 'subjectId-index',
        KeyConditionExpression: 'subjectId = :subjectId',
        ExpressionAttributeValues: {
            ':subjectId': subjectId,
        },
    };

    const result = await dynamoDb.query(params).promise();
    return result.Items || [];
};

// Function to query submissions for the given homeworks by userId
const querySubmissions = async (homeworks: any[], userId: string) => {
    const submissions = [];
    for (const homework of homeworks) {
        const params = {
            TableName: 'submissions',
            KeyConditionExpression: 'homeworkId = :homeworkId AND userId = :userId',
            ExpressionAttributeValues: {
                ':homeworkId': homework.homeworkId,
                ':userId': userId,
            },
        };

        const result = await dynamoDb.query(params).promise();
        submissions.push(...(result.Items || []));
    }
    return submissions;
};

// Function to calculate the user's grade from their submissions
const calculateUserGrade = (submissions: any[]) => {
    if (submissions.length === 0) return 0;

    const totalGrade = submissions.reduce((acc, submission) => acc + submission.grade, 0);
    return totalGrade / submissions.length;
};

console.log('', );

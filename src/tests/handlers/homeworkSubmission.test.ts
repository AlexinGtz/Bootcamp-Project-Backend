//GET
import { handler } from "../../handlers/homeworkSubmission"
import { CustomDynamoDB } from "../../dynamodb/database";
import responseHelper from "../../helpers/responseHelper";
import { validateToken } from "../../helpers/validations";
import * as userMock from "../mocks/users.json"
import * as subjectMock from "../mocks/subjects.json"
import * as homeworkSubmissionMock from "../mocks/homeworkSubmissions.json"


jest.mock('../../dynamodb/database', () => {
    return ({
        CustomDynamoDB: jest.fn(() => {
            return {
                getItem: jest.fn((itemId) => {
                    const mockItem = (itemId === userMock[2].email) ? userMock.find((user) => user.email === itemId) : subjectMock.find((subject) => subject.id === itemId) 
                    return Promise.resolve(mockItem)
                }),
                query: jest.fn((subjectId) => {
                    return Promise.resolve(
                       homeworkSubmissionMock.filter((submission) => submission.subjectId === subjectId)  
                    )                            
                })
            }
        })
    }) 
})

jest.mock('../../helpers/validations',() => {
    return({
        validateToken: jest.fn((token) => {
            let userTypeMock: string;
            let userEmailMock: string;
            
            switch (token) {
                case "studentToken":
                    userTypeMock = "STUDENT"
                    break;
                case "validTeacher":
                    userTypeMock = userMock[2].userType
                    userEmailMock = userMock[2].email
                    break;
                case "Throw error":
                    userTypeMock = userMock[4].userType
                    userEmailMock = userMock[4].email
                    break;
                default:
                    userTypeMock = "TEACHER"
                    userEmailMock = "not.valid@email.com"    
            }
                    
            return (token ? {
                userType: userTypeMock,
                userEmail: userEmailMock
            } : null)                                      
        })
    })
})

describe("Homework Submission handler", () => {
    describe("Fail test", () => {
        it("Should fail when user token is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: null
                }
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Fail Authenticating");
            expect(response.statusCode).toEqual(403);      
        })

        it("Should fail when user type is not a TEACHER", async () => {
            const response = await handler({
                headers: {
                    Authorization: "studentToken"
                }
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("The user type is not a TEACHER");
            expect(response.statusCode).toEqual(401);      
        })

        it("Should fail when the subject ID is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: "teacherToken"
                },
                pathParameters: {
                    subjectId: " "
                }
            })
        
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Subject ID is required");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the subject ID is not found", async () => {
            const response = await handler({
                headers: {
                    Authorization: "teacherToken"
                },
                pathParameters: {
                    subjectId: "S500"
                }
            })
        
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Subject not found");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the subject does not belong to the teacher", async () => {
            const response = await handler({
                headers: {
                    Authorization: "validTeacher"
                },
                pathParameters: {
                    subjectId: subjectMock[1].id
                }
            })
        
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("The subject does not belong to the teacher");
            expect(response.statusCode).toEqual(400);      
        }) 
    })

    describe("Success test", () => {    
        it("Should succeed when the homework submissions are retrieved", async () => {
            const response = await handler({
                headers: {
                    Authorization: "validTeacher"
                },
                pathParameters: {
                    subjectId: subjectMock[0].id
                }
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Success");
            expect(response.statusCode).toEqual(200);       
        }) 
    })
})
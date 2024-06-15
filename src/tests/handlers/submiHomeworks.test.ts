// GET
import { handler } from "../../handlers/submitHomework"
import { CustomDynamoDB } from "../../dynamodb/database";
import responseHelper from "../../helpers/responseHelper";
import { validateToken } from "../../helpers/validations";
import * as userMock from "../mocks/users.json"
import * as subjectMock from "../mocks/subjects.json"
import * as homeworkSubmissionMock from "../mocks/homeworkSubmissions.json"


jest.mock('../../dynamodb/database', () => {
    return ({
        CustomDynamoDB: jest.fn(()=> {
            return {
                getItem: jest.fn((studentId)=> {
                    return Promise.resolve(
                        userMock.find((user) => user.email === studentId)
                    )                             
                }),
                query: jest.fn((homeworkId,studentId)=> {
                    return Promise.resolve(
                        homeworkSubmissionMock.filter((submission) => submission.homeworkId === homeworkId && submission.studentEmail === studentId)
                    )                            
                })
            }
        })
    }) 
})

jest.mock('../../helpers/validations',() => {
    return({
        validateToken: jest.fn((token) => {
            let mockUserEmail: string;
            
            if(token === "same@token.email") {
                mockUserEmail = token
            } else if (token === "foundStudent") {
                    mockUserEmail = userMock[0].email
            } else {
                    mockUserEmail = "not@found.user"
            }
                    
            return (token ? {
                userType: "anyUserType",
                userEmail: mockUserEmail
            } : null)                  
        })
    })
})

describe("submitHomework handler", () => {
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

        it("Should fail when the Student ID is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: "someGivenToken"
                },
                body: JSON.stringify({
                    studentId: " "
                })
            })
        
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Student ID not provided");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when token user email and student email are different", async () => {
            const response = await handler({
                headers: {
                    Authorization: "different@token.email"
                },
                body: JSON.stringify({
                    studentId: "same@token.email"
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Student email not in token");
            expect(response.statusCode).toEqual(403);      
        })

        it("Should fail when the Homework ID is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: "foundStudent"
                },
                body: JSON.stringify({
                    studentId: userMock[1].email,
                    homeworkId: " "
                })
            })
        
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Homework ID not provided");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the Submission is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: "aValidToken"
                },
                body: JSON.stringify({
                    studentId: userMock[1].email,
                    homeworkId: "1", //mock
                    submission: " "
                })
            })
        
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Submission not provided");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when user is not found", async () => {
            const response = await handler({
                headers: {
                    Authorization: "aValidToken"
                },
                body: JSON.stringify({
                    studentId: "not@user.test",
                    homeworkId: "1" ,
                    submission: "some"
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("User not found");
            expect(response.statusCode).toEqual(400);      
        })
    }) 
    
    describe("Success test", () => {    
        it.skip("Should succeed when the teacher has subjects", async () => {
            const response = await handler({
                headers: {
                    Authorization: "aValidToken"
                },
                pathParameters: {
                    teacherEmail: userMock[2].email
                }
            })
            
            const body = JSON.parse(response.body) 
            expect(body.data.length).toBeGreaterThanOrEqual(0)      
            expect(body.message).toEqual("Success");
            expect(response.statusCode).toEqual(200);       
        }) 
    })
})
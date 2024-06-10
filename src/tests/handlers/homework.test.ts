import { handler } from "../../handlers/homework"
import { validateToken } from "../../helpers/validations";
import { CustomDynamoDB } from "../../dynamodb/database";
import * as userMock from "../mocks/users.json"
import * as homeworkMock from "../mocks/homeworks.json"
import * as homeworkSubmissionMock from "../mocks/homeworkSubmissions.json"

jest.mock('../../dynamodb/database', () => {
    return ({
        CustomDynamoDB: jest.fn(()=> {
            return {
                getItem: jest.fn((homeworkId)=> {
                    return Promise.resolve(
                        homeworkMock.find((homework) => homework.id === homeworkId)
                    )                             
                }),
                query: jest.fn((homeworkId,userEmail)=> {
                    return Promise.resolve(
                        homeworkSubmissionMock.filter((submission) => submission.homeworkId === homeworkId && submission.studentEmail === userEmail)
                    )                             
                })
            }
        })
    }) 
})

jest.mock('../../helpers/validations',() => {
    return({
        validateToken: jest.fn((token) => {
            return (token ? {
                userType: userMock[0].userType,
                userEmail: userMock[0].email
            } : null)                  
        })
    })
})

describe("Homework handler", () => {
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

        it("Should fail when the Homework ID is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: "someGivenToken"
                },
                pathParameters: null ?? {
                    homeworkId: " "
                }
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Homework ID is required");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the Homework ID is not found", async () => {
            const response = await handler({
                headers: {
                    Authorization: "someGivenToken"
                },
                pathParameters: {
                    homeworkId: "4"
                }
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Homework not found");
            expect(response.statusCode).toEqual(400);      
        })
    }) 
    
    describe("Success test", () => {    
        it("Should succeed when the student have submissions", async () => {
            const response = await handler({
                headers: {
                    Authorization: "someGivenToken"
                },
                pathParameters: {
                    homeworkId: "1"
                }
            })
            
            const body = JSON.parse(response.body)
            expect(body.data.grade).toEqual(homeworkSubmissionMock[0].grade);         
            expect(body.data.pendingSubmission).toEqual(false);
            expect(body.message).toEqual("Success");
            expect(response.statusCode).toEqual(200);       
        }) 

        it("Should succeed when pending submissions can be calculcated", async () => {
            const response = await handler({
                headers: {
                    Authorization: "someGivenToken"
                },
                pathParameters: {
                    homeworkId: "3"
                }
            })
            
            const body = JSON.parse(response.body)  
            expect(body.data.grade).toEqual(false);         
            expect(body.data.pendingSubmission).toEqual(true); 
            expect(body.message).toEqual("Success");
            expect(response.statusCode).toEqual(200);        
        })
    }) 
})

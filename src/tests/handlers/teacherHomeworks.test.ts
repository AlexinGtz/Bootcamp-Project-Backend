import { handler } from "../../handlers/teacherHomework"
import { validateToken } from "../../helpers/validations";
import { CustomDynamoDB } from "../../dynamodb/database";
import * as userMock from "../mocks/users.json"
import * as homeworkMock from "../mocks/homeworks.json"
import * as homeworkSubmissionMock from "../mocks/homeworkSubmissions.json"

jest.mock('../../dynamodb/database', () => {
    return ({
        CustomDynamoDB: jest.fn(()=> {
            return {
                getItem: jest.fn((itemId)=> {
                    if (!itemId.includes("@")) {
                        return Promise.resolve(
                            homeworkMock.find((homework) => homework.id === itemId)
                    )}
                    else {
                        return Promise.resolve(
                            userMock.find((user) => user.email === itemId)
                    )}                   
                }),
                query: jest.fn((homeworkId)=> {
                    return Promise.resolve(
                        homeworkSubmissionMock.filter((submission) => submission.homeworkId === homeworkId)
                    )                             
                })
            }
        })
    }) 
})

jest.mock('../../helpers/validations',() => {
    return({
        validateToken: jest.fn((token) => {
            let mockUserType = token === "teacherToken" ? "TEACHER" : "STUDENT"
            return (token ? {
                userType: mockUserType,
                userEmail: userMock[2].email
            } : null)                  
        })
    })
})

describe("Teacher Homework handler", () => {
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

        it("Should fail when the Homework ID is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: "teacherToken"
                },
                pathParameters: {
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
                    Authorization: "teacherToken"
                },
                pathParameters: {
                    homeworkId: "Not a valid homeworkId"
                }
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Homework not found");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the homework does not belong to the teacher", async () => {
            const response = await handler({
                headers: {
                    Authorization: "teacherToken"
                },
                pathParameters: {
                    homeworkId: homeworkMock[3].id
                }
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("The homework does not belong to the teacher");
            expect(response.statusCode).toEqual(400);      
        })
    }) 
    
    describe("Success test", () => {    
        it("Should succeed when homework details are retrieved", async () => {
            const response = await handler({
                headers: {
                    Authorization: "teacherToken"
                },
                pathParameters: {
                    homeworkId: homeworkMock[0].id
                }
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Success");
            expect(response.statusCode).toEqual(200);       
        }) 
    }) 
})

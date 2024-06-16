// POST
import { handler } from "../../handlers/submitHomework"
import { CustomDynamoDB } from "../../dynamodb/database";
import responseHelper from "../../helpers/responseHelper";
import { validateToken } from "../../helpers/validations";
import * as userMock from "../mocks/users.json"
import * as homeworkMock from "../mocks/homeworks.json"
import * as homeworkSubmissionMock from "../mocks/homeworkSubmissions.json"


jest.mock('../../dynamodb/database', () => {
    return ({
        CustomDynamoDB: jest.fn(() => {
            return {
                getItem: jest.fn((Id) => {
                    const mockItem = (Id === userMock[0].email) ? userMock.find((user) => user.email === Id) : homeworkMock.find((homework) => homework.id === Id) 
                    return Promise.resolve(mockItem)
                }),
                query: jest.fn((homeworkId,studentId) => {
                    return Promise.resolve(
                       homeworkSubmissionMock.filter((submission) => submission.homeworkId === homeworkId && submission.studentEmail === studentId)  
                    )                            
                }),
                putItem: jest.fn((object) => {
                    if (object.submissionText === "Throw error") {
                        return Promise.reject(new Error('Cannot establish DB connection'))
                     }
                    else {
                        return Promise.resolve({}) 
                    }          
                })
            }
        })
    }) 
})

jest.mock('../../helpers/validations',() => {
    return({
        validateToken: jest.fn((token) => {
            let mockUserEmail: string;
            let mockUserType = token === "teacherToken" ? "TEACHER" : "STUDENT"
            if(token === "sameTokenEmail") {
                mockUserEmail = token
            } else if (token === "foundStudent") {
                    mockUserEmail = userMock[0].email
            } else {
                    mockUserEmail = "not@found.user"
            }
                    
            return (token ? {
                userType: mockUserType,
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

        it("Should fail when user type is not a STUDENT", async () => {
            const response = await handler({
                headers: {
                    Authorization: "teacherToken"
                }
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("The user type is not a STUDENT");
            expect(response.statusCode).toEqual(401);      
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
                    Authorization: "sameTokenEmail"
                },
                body: JSON.stringify({
                    studentId: "same@token.email"
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Student email does not match token");
            expect(response.statusCode).toEqual(403);      
        })

        it("Should fail when the homework ID is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: "foundStudent"
                },
                body: JSON.stringify({
                    studentId: userMock[0].email,
                    homeworkId: " "
                })
            })
        
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Homework ID not provided");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the submission is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: "foundStudent"
                },
                body: JSON.stringify({
                    studentId: userMock[0].email,
                    homeworkId: homeworkMock[0].id, 
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
                    Authorization: "sameTokenEmail"
                },
                body: JSON.stringify({
                    studentId: "sameTokenEmail",
                    homeworkId: homeworkMock[0].id ,
                    submission: "Some submission text"
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("User not found");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the homework is not found", async () => {
            const response = await handler({
                headers: {
                    Authorization: "foundStudent"
                },
                body: JSON.stringify({
                    studentId: userMock[0].email,
                    homeworkId: "Not a valid homework", 
                    submission: "Some submission text"
                })
            })
        
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Homework not found");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the homework has been submitted previously by the student", async () => {
            const response = await handler({
                headers: {
                    Authorization: "foundStudent"
                },
                body: JSON.stringify({
                    studentId: userMock[0].email,
                    homeworkId: homeworkMock[1].id, 
                    submission: "Some submission text"
                })
            })
        
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Already exists a homework submission for this student");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the submission date has passed", async () => {
            const response = await handler({
                headers: {
                    Authorization: "foundStudent"
                },
                body: JSON.stringify({
                    studentId: userMock[0].email,
                    homeworkId: homeworkMock[2].id, 
                    submission: "Some submission text"
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("The submission date has passed");
            expect(response.statusCode).toEqual(400);       
        }) 

        it("Should fail when the submission cannot be processed", async () => {
            const response = await handler({
                headers: {
                    Authorization: "foundStudent"
                },
                body: JSON.stringify({
                    studentId: userMock[0].email, 
                    homeworkId: homeworkMock[3].id,
                    submission: "Throw error"
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Failed to submit the homework - Cannot establish DB connection");
            expect(response.statusCode).toEqual(500);       
        }) 
    })

    describe("Success test", () => {    
        it("Should succeed when the homework is submitted", async () => {
            const response = await handler({
                headers: {
                    Authorization: "foundStudent"
                },
                body: JSON.stringify({
                    studentId: userMock[0].email,
                    homeworkId: homeworkMock[3].id, 
                    submission: "Some submission text"
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Success");
            expect(response.statusCode).toEqual(200);       
        }) 
    })
})
import { handler } from "../../handlers/addSubject"
import { validateToken } from "../../helpers/validations";
import { CustomDynamoDB } from "../../dynamodb/database";
import * as userMock from "../mocks/users.json"
import * as subjectMock from "../mocks/subjects.json"


jest.mock('../../dynamodb/database', () => {
    return ({
        CustomDynamoDB: jest.fn(() => {
            return {
                getItem: jest.fn((userEmail) => {
                    return Promise.resolve(
                       userMock.find((user) => user.email === userEmail)
                    )       
                }),
                query: jest.fn((teacherEmail) => {
                    return Promise.resolve(
                        subjectMock.filter((subject) => subject.teacherEmail === teacherEmail)
                    )                             
                }),
                putItem: jest.fn((object) => {
                    if (object.description === "Throw error") {
                        return Promise.reject(new Error('Cannot establish DB connection'))
                     }
                    else {
                        return Promise.resolve({}) 
                   }          
                }),
                updateItem: jest.fn((object) => {
                    if (object === userMock[4].email) {
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

describe("Add Subject handler", () => {
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
        
        it("Should fail when the subject name is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: "validTeacher"
                },
                body: JSON.stringify({
                    subjectName: " "
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Subject name not provided");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the subject name is not of type string", async () => {
            const response = await handler({
                headers: {
                    Authorization: "validTeacher"
                },
                body: JSON.stringify({
                    subjectName: 123
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Subject name is not of type string");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the subject description is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: "validTeacher"
                },
                body: JSON.stringify({
                    subjectName: "Physics",
                    subjectDescription: " "
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Subject description not provided");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the subject description is not type of string", async () => {
            const response = await handler({
                headers: {
                    Authorization: "validTeacher"
                },
                body: JSON.stringify({
                    subjectName: "Physics",
                    subjectDescription: 123
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Subject description is not of type string");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the user is not found", async () => {
            const response = await handler({
                headers: {
                    Authorization: "Not a valid Teacher"
                },
                body: JSON.stringify({
                    subjectName: "Physics",
                    subjectDescription: "The natural science of matter"
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("User not found");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the subject name has been added previously by the teacher", async () => {
            const response = await handler({
                headers: {
                    Authorization: "validTeacher"
                },
                body: JSON.stringify({
                    subjectName: subjectMock[0].name,
                    subjectDescription: subjectMock[0].description
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Already exists a subject with the same name for this teacher");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the subject insertion cannot be processed", async () => {
            const response = await handler({
                headers: {
                    Authorization: "validTeacher"
                },
                body: JSON.stringify({
                    subjectName: "Physics",
                    subjectDescription: "Throw error"
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Failed to add the subject - Cannot establish DB connection");
            expect(response.statusCode).toEqual(500);       
        })

        it("Should fail when the user update cannot be processed", async () => {
            const response = await handler({
                headers: {
                    Authorization: "Throw error"
                },
                body: JSON.stringify({
                    subjectName: "Physics",
                    subjectDescription: "The natural science of matter"
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Failed to update the user - Cannot establish DB connection");
            expect(response.statusCode).toEqual(500);       
        }) 
    }) 
    
    describe("Success test", () => {    
        it("Should succeed when the subject is added", async () => {
            const response = await handler({
                headers: {
                    Authorization: "validTeacher"
                },
                body: JSON.stringify({
                    subjectName: "Physics",
                    subjectDescription: "The natural science of matter"
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Success");
            expect(response.statusCode).toEqual(200);       
        }) 
    }) 
})

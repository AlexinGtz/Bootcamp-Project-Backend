import { handler } from "../../handlers/addHomework"
import { validateToken } from "../../helpers/validations";
import { CustomDynamoDB } from "../../dynamodb/database";
import * as userMock from "../mocks/users.json"
import * as subjectMock from "../mocks/subjects.json"
import * as homeworkMock from "../mocks/homeworks.json"


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
                        homeworkMock.filter((homework) => homework.subjectId === subjectId)
                    )                             
                }),
                putItem: jest.fn((object) => {
                    if (object.description === "Throw error") {
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
                case "tokenTeacher":
                    userTypeMock = userMock[2].userType
                    userEmailMock = userMock[2].email
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

describe("Add Homework handler", () => {
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
        
        it("Should fail when the homework name is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: "teacherToken"
                },
                body: JSON.stringify({
                    name: " "
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Homework name not provided");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the homework name is not of type string", async () => {
            const response = await handler({
                headers: {
                    Authorization: "teacherToken"
                },
                body: JSON.stringify({
                    name: 123
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Homework name is not of type string");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the homework description is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: "teacherToken"
                },
                body: JSON.stringify({
                    name: "Activity 101",
                    description: " "
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Homework description not provided");
            expect(response.statusCode).toEqual(400);      
        })
        
        it("Should fail when the homework description is not of type string", async () => {
            const response = await handler({
                headers: {
                    Authorization: "teacherToken"
                },
                body: JSON.stringify({
                    name: "Activity 101",
                    description: 123
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Homework description is not of type string");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the homework due date is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: "teacherToken"
                },
                body: JSON.stringify({
                    name: "Activity 101",
                    description: "Do something",
                    dueDate: " "
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Homework due date not provided");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the homework due date is not a valid date", async () => {
            const response = await handler({
                headers: {
                    Authorization: "teacherToken"
                },
                body: JSON.stringify({
                    name: "Activity 101",
                    description: "Do something",
                    dueDate: "Not a valid date"
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Homework due date is not a valid date");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the homework due date is a date in the past", async () => {
            const response = await handler({
                headers: {
                    Authorization: "teacherToken"
                },
                body: JSON.stringify({
                    name: "Activity 101",
                    description: "Do something",
                    dueDate: "01/01/2024"
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Homework due date is a date in the past");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the subject ID is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: "teacherToken"
                },
                body: JSON.stringify({
                    name: "Activity 101",
                    description: "Do something",
                    dueDate: "12-12-2024",
                    subjectId: " "
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Subject ID not provided");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the subject ID is not of type string", async () => {
            const response = await handler({
                headers: {
                    Authorization: "teacherToken"
                },
                body: JSON.stringify({
                    name: "Activity 101",
                    description: "Do something",
                    dueDate: "12-12-2024",
                    subjectId: 123
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Subject ID is not of type string");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the user is not found", async () => {
            const response = await handler({
                headers: {
                    Authorization: "Not a valid teacher Token"
                },
                body: JSON.stringify({
                    name: "Activity 101",
                    description: "Do something",
                    dueDate: "12-12-2024",
                    subjectId: subjectMock[0].id
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("User not found");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the subject is not found", async () => {
            const response = await handler({
                headers: {
                    Authorization: "tokenTeacher"
                },
                body: JSON.stringify({
                    name: "Activity 101",
                    description: "Do something",
                    dueDate: "12-12-2024",
                    subjectId: "S500"
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Subject not found");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the subject does not belong to the teacher", async () => {
            const response = await handler({
                headers: {
                    Authorization: "tokenTeacher"
                },
                body: JSON.stringify({
                    name: "Activity 101",
                    description: "Do something",
                    dueDate: "12-12-2024",
                    subjectId: subjectMock[1].id
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("The subject does not belong to the teacher");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the homework name has been added previously for the subject", async () => {
            const response = await handler({
                headers: {
                    Authorization: "tokenTeacher"
                },
                body: JSON.stringify({
                    name: homeworkMock[0].name,
                    description: "Do something",
                    dueDate: "12-12-2024",
                    subjectId: subjectMock[0].id
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Already exists a homework with the same name for this subject");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the homework insertion cannot be processed", async () => {
            const response = await handler({
                headers: {
                    Authorization: "tokenTeacher"
                },
                body: JSON.stringify({
                    name: "Activity 1 - Unit 11",
                    description: "Throw error",
                    dueDate: "12-12-2024",
                    subjectId: subjectMock[0].id
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Failed to add the homework - Cannot establish DB connection");
            expect(response.statusCode).toEqual(500);       
        })   
    }) 
    
    describe("Success test", () => {    
        it("Should succeed when the homework is added", async () => {
            const response = await handler({
                headers: {
                    Authorization: "tokenTeacher"
                },
                body: JSON.stringify({
                    name: "Activity 1 - Unit 5",
                    description: "Do something",
                    dueDate: "12-12-2024",
                    subjectId: subjectMock[0].id
                })
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Success");
            expect(response.statusCode).toEqual(200);       
        }) 
    }) 
})

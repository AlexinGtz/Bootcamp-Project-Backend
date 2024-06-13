import { handler } from "../../handlers/subject"
import { validateToken } from "../../helpers/validations";
import { CustomDynamoDB } from "../../dynamodb/database";
import * as userMock from "../mocks/users.json"
import * as homeworkMock from "../mocks/homeworks.json"
import * as subjectsMock from "../mocks/subjects.json"

jest.mock('../../dynamodb/database', () => {
    return ({
        CustomDynamoDB: jest.fn(()=> {
            return {
                getItem: jest.fn((subjectId)=> {
                    return Promise.resolve(
                        subjectsMock.find((subject) => subject.id === subjectId)
                    )                             
                }),
                query: jest.fn((subjectId)=> {
                    return Promise.resolve(
                        homeworkMock.filter((homework) => homework.subjectId === subjectId)
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

describe("Subject handler", () => {
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

        it("Should fail when the subject ID is not given (null)", async () => {
            const response = await handler({
                headers: {
                    Authorization: "someGivenToken"
                },
                queryStringParameters: null
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Subject ID is required");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the subject ID is not given (trim)", async () => {
            const response = await handler({
                headers: {
                    Authorization: "someGivenToken"
                },
                queryStringParameters: {
                    subjectId: "  "
                }
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Subject ID is required");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when the subject ID is not found", async () => {
            const response = await handler({
                headers: {
                    Authorization: "someGivenToken"
                },
                queryStringParameters: {
                    subjectId: "S6"
                }
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Subject not found");
            expect(response.statusCode).toEqual(400);      
        })
    }) 
    
    describe("Success test", () => {    
        it("Should succeed when the subject details are retrieved", async () => {
            const response = await handler({
                headers: {
                    Authorization: "someGivenToken"
                },
                queryStringParameters: {
                    subjectId: subjectsMock[1].id
                }
                
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Success");
            expect(response.statusCode).toEqual(200);       
        }) 
    }) 
})

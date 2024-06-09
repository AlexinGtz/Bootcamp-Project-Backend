// GET
import { handler } from "../../../handlers/subjects/teacher"
import { CustomDynamoDB } from "../../../dynamodb/database";
import responseHelper from "../../../helpers/responseHelper";
import { validateToken } from "../../../helpers/validations";
import * as userMock from "../../mocks/users.json"
import * as subjectMock from "../../mocks/subjects.json"

jest.mock('../../../dynamodb/database', () => {
    return ({
        CustomDynamoDB: jest.fn(()=> {
            return {
                query: jest.fn((teacherEmail)=> {
                    return Promise.resolve(
                        subjectMock.filter((subject) => subject.teacherEmail === teacherEmail)
                    )                             
                })
            }
        })
    }) 
})

jest.mock('../../../helpers/validations',() => {
    return({
        validateToken: jest.fn((token) => {
            return (token ? {
                userType: userMock[2].userType,
                userEmail: userMock[2].email
            } : null)                  
        })
    })
})

describe("Teacher handler", () => {
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

        it("Should fail when the teacher email is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: "someGivenToken"
                },
                pathParameters: null ?? {
                    teacherEmail: " "
                }
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Teacher email is required");
            expect(response.statusCode).toEqual(400);      
        })

        it("Should fail when subjects are not found", async () => {
            const response = await handler({
                headers: {
                    Authorization: "someGivenToken"
                },
                pathParameters: {
                    teacherEmail: userMock[4].email
                }
            })
            
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("No subjects found");
            expect(response.statusCode).toEqual(400);      
        })
    }) 
    
    describe("Success test", () => {    
        it("Should succeed when the teacher has subjects", async () => {
            const response = await handler({
                headers: {
                    Authorization: "someGivenToken"
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

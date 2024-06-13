// GET
import { handler } from "../../handlers/teacherSubjects"
import { CustomDynamoDB } from "../../dynamodb/database";
import responseHelper from "../../helpers/responseHelper";
import { validateToken } from "../../helpers/validations";
import * as userMock from "../mocks/users.json"
import * as subjectMock from "../mocks/subjects.json"

jest.mock('../../dynamodb/database', () => {
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

jest.mock('../../helpers/validations',() => {
    return({
        validateToken: jest.fn((token) => {
            let userMockIndex: number;
            if(token === "studentToken") {
                userMockIndex = 0
            } else if (token === "teacherTokenWithSubjects") {
                    userMockIndex = 2
            } else {
                    userMockIndex = 4
            }
                    
            return (token ? {
                userType: userMock[userMockIndex].userType,
                userEmail: userMock[userMockIndex].email
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

        it("Should fail when the user type is not a TEACHER", async () => {
            const response = await handler({
                headers: {
                    Authorization: "studentToken"
                }
            })
            
            const body = JSON.parse(response.body) 
            expect(body.data).toEqual(undefined);     
            expect(body.message).toEqual("User type is not a TEACHER");
            expect(response.statusCode).toEqual(400);       
        }) 

        it("Should fail when the teacher has not subjects", async () => {
            const response = await handler({
                headers: {
                    Authorization: "aGivenToken"
                }
            })
            
            const body = JSON.parse(response.body) 
            expect(body.data).toEqual(undefined);     
            expect(body.message).toEqual("No subjects found");
            expect(response.statusCode).toEqual(400);       
        })
    }) 
    
    describe("Success test", () => {    
        it("Should succeed when the teacher and its subjects are retrieved", async () => {
            const response = await handler({
                headers: {
                    Authorization: "teacherTokenWithSubjects"
                }
            })
            
            const body = JSON.parse(response.body) 
            expect(body.message).toEqual("Success");
            expect(response.statusCode).toEqual(200);       
        }) 
    })
})
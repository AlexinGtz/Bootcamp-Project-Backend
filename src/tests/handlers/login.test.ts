import { handler } from "../../handlers/login"
import { validateEmail } from "../../helpers/validations";
import { CustomDynamoDB } from "../../dynamodb/database";
import * as userMock from "../mocks/users.json"
import * as tokenGen from "jsonwebtoken";

jest.mock('../../dynamodb/database', () => {
    return ({
        CustomDynamoDB: jest.fn(()=> {
            return {
                getItem: jest.fn((userEmail)=> {
                    return Promise.resolve(
                        userMock.find((user) => user.email === userEmail)
                    )                             
                })
            }
        })
    }) 
})

jest.mock('jsonwebtoken',() => {
    return({
        sign: jest.fn().mockReturnValue("someTokenGenerated")
    })
})
       
describe("Login handler", () => {
  
    describe("Fail test", () => {
    
        it("Should fail when there's not user email provided (empty body)", async () => {
       
            const response = await handler({
                body: JSON.stringify({})
            });
        
        const body = JSON.parse(response.body)
        expect(body.message).toEqual("Email not provided");
        expect(response.statusCode).toEqual(400);
        })
  

        it("Should fail when there's not user email provided (trimmed email)", async () => {
       
            const response = await handler({
            body: JSON.stringify({
                userEmail: "    "
            })
         });

         const body = JSON.parse(response.body)
         expect(body.message).toEqual("Email not provided")
         expect(response.statusCode).toEqual(400);
        })


        it("Should fail when user email is not verified", async () => {
       
            const response = await handler({
                body: JSON.stringify({
                    userEmail: "not.valid.email"
                })
            });
        
        const body = JSON.parse(response.body)
        expect(body.message).toEqual("Email not verified");
        expect(response.statusCode).toEqual(404);     
        })
        
        it("Should fail when user is not found", async () => {
            
            const response = await handler({
                body: JSON.stringify({
                    userEmail: "fail@email.com"
                })
            });
        
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("User not found");
            expect(response.statusCode).toEqual(400);     
        }) 

        it("Should fail when user database password and user provided password are different", async () => {
            
            const response = await handler({
                body: JSON.stringify({
                    userEmail: userMock[0].email,
                    userPassword: "anInvalidPassword"
                })
            });
        
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Passwords do not match");
            expect(response.statusCode).toEqual(400);     
        }) 
     })
    
    describe("Success test", () => {
        it("Should succeed when the token is generated", async () => {    
            const response = await handler({
                body: JSON.stringify({
                    userEmail: userMock[0].email,
                    userPassword: userMock[0].password
                })
            });

            const body = JSON.parse(response.body)
            expect(body.data.accessToken).toEqual("someTokenGenerated");     
        }) 
        
        it("Should succeed when the userType is a STUDENT", async () => {    
            const response = await handler({
                body: JSON.stringify({
                    userEmail: userMock[0].email,
                    userPassword: userMock[0].password
                })
            });
       
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Success");
            expect(response.statusCode).toEqual(200);     
            expect(body.data.userType).toEqual("STUDENT");     
        }) 

        it("Should succeed when the userType is a TEACHER", async () => {    
            const response = await handler({
                body: JSON.stringify({
                    userEmail: userMock[1].email,
                    userPassword: userMock[1].password
                })
            });
        
            const body = JSON.parse(response.body)
            expect(body.message).toEqual("Success");
            expect(response.statusCode).toEqual(200);  
            expect(body.data.userType).toEqual("TEACHER");     
        }) 
    })
}) 
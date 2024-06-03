import { handler } from "../../handlers/login"
import { validateEmail, validatePassword } from "../../helpers/validations";
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

jest.mock('../../helpers/validations',() => {
    return({
        validatePassword: jest.fn((userDBPassword, userProvidedPasword) => {
            return ((userMock.find((user) => user.password === userDBPassword).password === userProvidedPasword))                             
        }),
        validateEmail: jest.fn((userProvidedEmail) => {
            return (/^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/.test(userProvidedEmail))                             
        })
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


        it("Should fail when user email format is not valid", async () => {
       
            const response = await handler({
                body: JSON.stringify({
                    userEmail: "not.valid.email"
                })
            });
        
        const body = JSON.parse(response.body)
        expect(body.message).toEqual("Email format not valid");
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


describe("Validations", () => {
  
    describe("User password validate function", () => {
    
        describe("Fail test", () => {
            it("Should fail when user database password and user provided password are different", () => {
                const response = validatePassword(userMock[0].password,"aDifferentRandomPassword")
                expect(response).toEqual(false);
            })
        })

        describe("Success test", () => {
            it("Should succeed when user database password and user provided password are the same", () => { 
                const response = validatePassword(userMock[0].password,userMock[0].password)
                expect(response).toEqual(true);
            })
        })
    })

    describe("User email validate function", () => {
    
        describe("Fail test", () => {
            it("Should fail when user email is not verified", () => {
                const response = validateEmail("not.valid.email")
                expect(response).toEqual(false);
            })
        })

        describe("Success test", () => {
            it("Should fail when user email is verified", () => { 
                const response = validateEmail("a.valid@email.com")
                expect(response).toEqual(true);
            })
        })
    })
})
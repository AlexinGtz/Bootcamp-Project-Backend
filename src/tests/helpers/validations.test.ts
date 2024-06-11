import { validateEmail, validatePassword, validateToken } from "../../helpers/validations"
import * as userMock from "../mocks/users.json"
import * as tokenGen from "jsonwebtoken";

jest.mock('jsonwebtoken',() => {
    return({
        verify: jest.fn((token, secret) => {
            return ((token && secret) ? {
                userType: userMock[0].userType,
                userEmail: userMock[0].email
            } : null)
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
            it("Should fail when user email format is not valid", () => {
                const response = validateEmail("not.valid.email")
                expect(response).toEqual(false);
            })
        })

        describe("Success test", () => {
            it("Should succeed when user email is verified", () => { 
                const response = validateEmail("a.valid@email.com")
                expect(response).toEqual(true);
            })
        })
    })

    describe("Verify token function", () => {
    
        describe("Fail test", () => {
            it("Should fail when the token can't be decoded", async () => {
                let response = await tokenGen.verify()
                expect(response).toEqual(null);
            })
        })

        describe("Success test", () => { 
            it("Should succeed when token can be decoded", async () => {
                const response = await tokenGen.verify("token", "secret")
                expect(response).toEqual({                    
                    userType: userMock[0].userType,
                    userEmail: userMock[0].email
                })
            })
        })
    })
})
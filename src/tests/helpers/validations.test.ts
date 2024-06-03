import { validateEmail, validatePassword } from "../../helpers/validations"
import * as userMock from "../mocks/users.json"

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
            it("Should fail when user email is verified", () => { 
                const response = validateEmail("a.valid@email.com")
                expect(response).toEqual(true);
            })
        })
    })
})
import { handler } from "../../handlers/subjectHomework";
import { validateToken } from "../../helpers/validations";
import { CustomDynamoDB } from "../../dynamodb/database";
import * as userMock from "../mocks/users.json";
import * as subjectMock from "../mocks/subjects.json";
import * as homeworkMock from "../mocks/homeworks.json";

import * as homeworkSubmissionMock from "../mocks/homeworkSubmissions.json";

jest.mock("../../dynamodb/database", () => {
    return {
        CustomDynamoDB: jest.fn(() => {
            return {
                getItem: jest.fn((subjectId) => {
                    return Promise.resolve(
                        subjectMock.find((subject) => subject.id === subjectId)
                    );
                }),
                query: jest.fn((itemId, userEmail) => {
                    if (itemId === subjectMock[1].id) {
                        return Promise.resolve(
                            homeworkMock.filter((homework) => homework.subjectId === itemId)
                        );
                    } else {
                        return Promise.resolve(
                            homeworkSubmissionMock.filter((homeworkSubmission) => homeworkSubmission.homeworkId === itemId && homeworkSubmission.studentEmail == userEmail)
                        );
                    }
                })
            };
        })
    };
});

jest.mock("../../helpers/validations", () => {
    return {
        validateToken: jest.fn((token) => {
            let mockUserEmail: string;
            let mockUserType = token === "teacherToken" ? "TEACHER" : "STUDENT";
            if (token === "sameTokenEmail") {
                mockUserEmail = token;
            } else if (token === "foundStudent") {
                mockUserEmail = userMock[0].email;
            } else if (token === "anotherFoundStudent") {
                mockUserEmail = userMock[1].email;
            } else {
                mockUserEmail = "not@found.user";
            }

            return token
                ? {
                      userType: mockUserType,
                      userEmail: mockUserEmail
                  }
                : null;
        })
    };
});

describe("Subject Homework handler", () => {
    describe("Fail test", () => {
        it("Should fail when user token is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: null
                }
            });

            const body = JSON.parse(response.body);
            expect(body.message).toEqual("Fail Authenticating");
            expect(response.statusCode).toEqual(403);
        });

        it("Should fail when user type is not a STUDENT", async () => {
            const response = await handler({
                headers: {
                    Authorization: "teacherToken"
                }
            });

            const body = JSON.parse(response.body);
            expect(body.message).toEqual("The user type is not a STUDENT");
            expect(response.statusCode).toEqual(401);
        });

        it("Should fail when the subject ID is not given", async () => {
            const response = await handler({
                headers: {
                    Authorization: "someGivenToken"
                },
                pathParameters: null ?? {
                    subjectId: " "
                }
            });

            const body = JSON.parse(response.body);
            expect(body.message).toEqual("Subject ID is required");
            expect(response.statusCode).toEqual(400);
        });

        it("Should fail when the Subject ID is not found", async () => {
            const response = await handler({
                headers: {
                    Authorization: "someGivenToken"
                },
                pathParameters: {
                    subjectId: "S40"
                }
            });

            const body = JSON.parse(response.body);
            expect(body.message).toEqual("Subject not found");
            expect(response.statusCode).toEqual(400);
        });

        it("Should fail when there are not any homeworks for the subject", async () => {
            const response = await handler({
                headers: {
                    Authorization: "someGivenToken"
                },
                pathParameters: {
                    subjectId: subjectMock[4].id
                }
            });

            const body = JSON.parse(response.body);
            expect(body.message).toEqual(
                "There are not any homeworks for this subject"
            );
            expect(response.statusCode).toEqual(400);
        });
    });

    describe("Success test", () => {
        it("Should succeed when the user grade can be calculated even there are not any submissions by the student", async () => {
            const response = await handler({
                headers: {
                    Authorization: "anotherFoundStudent"
                },
                pathParameters: {
                    subjectId: subjectMock[1].id
                }
            });

            const body = JSON.parse(response.body);
            expect(body.data.userGrade).toEqual(0);
            expect(body.message).toEqual("Success");
            expect(response.statusCode).toEqual(200);
        });

        it("Should succeed when the subject homework details can be retrieved", async () => {
            const response = await handler({
                headers: {
                    Authorization: "foundStudent"
                },
                pathParameters: {
                    subjectId: subjectMock[1].id
                }
            });

            const body = JSON.parse(response.body);
            expect(body.data.homeworks).not.toBeNull();
            expect(body.message).toEqual("Success");
            expect(response.statusCode).toEqual(200);
        });
    });
});
import * as jwt from 'jsonwebtoken';

export const validatePassword = (userDBPassword: string, userProvidedPasword: string) => {
    return userDBPassword === userProvidedPasword;
}

export const validateToken = async (token: string) => {
    if(!token) {
        return null;
    }

    // Bearer {token}
    const splittedToken = token.split(' ')[1];

    let decodedToken;
    try {
        decodedToken = await jwt.verify(splittedToken, process.env.TOKEN_SECRET)
    } catch(e) {
        return null;
    }

    if (!decodedToken){
        return null
    }
    
    return {
        email: decodedToken.email,
        firstName: decodedToken.firstName,
        lastName: decodedToken.lastName
    }
}

/**
 * Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImouYWxleDE0MTBAaG90bWFpbC5jb20iLCJmaXJzdE5hbWUiOiJBbGV4IiwibGFzdE5hbWUiOiJHdXRpZXJyZXoiLCJpYXQiOjE3MTU5MTM4MjQsImV4cCI6MTcxNjAwMDIyNH0._bFiWJkihwD0uh3wDLCrZabOzAohvkxV8swAM21g0bA
 */
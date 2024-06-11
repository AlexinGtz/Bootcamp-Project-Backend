import * as tokenGen from 'jsonwebtoken';

export const validatePassword = (userDBPassword: string, userProvidedPasword: string) => {
    return userDBPassword === userProvidedPasword;
}

export const validateEmail = (userProvidedEmail: string) => {
    return /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/.test(userProvidedEmail);
}

export const validateToken = async (token: string) => {
    if(!token){
        return null
    }

    const dividedToken = token.split(' ')[1];

    let decodedToken;

    try {
        decodedToken = await tokenGen.verify(dividedToken, process.env.TOKEN_SECRET)
    } catch (e) {
        return null;
    }

    if(!decodedToken){
        return null;
    }

    return {
        userType: decodedToken.userType,
        userEmail: decodedToken.userEmail
    }
}
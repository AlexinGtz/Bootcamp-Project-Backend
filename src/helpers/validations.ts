import * as jwt from 'jsonwebtoken';

export const validatePassword = (userDBPassword: string, userProvidedPasword: string) => {
    return userDBPassword === userProvidedPasword;
}

export const validateEmail = (userProvidedEmail: string) => {
    return /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/.test(userProvidedEmail);
}

export const validateToken = async (token: string) => {
    console.log('token', token)
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
        userEmail: decodedToken.userEmail,
        userType: decodedToken.userType
    }
}
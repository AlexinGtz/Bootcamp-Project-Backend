export const validatePassword = (userDBPassword: string, userProvidedPasword: string) => {
    return userDBPassword === userProvidedPasword;
}

export const validateEmail = (userProvidedEmail: string) => {
    return /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/.test(userProvidedEmail);
}

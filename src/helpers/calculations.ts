export const calculateAvgGrade = (submissions) => {
    if (!submissions || submissions.length === 0) {
        return null
    }
    const gradeArray: Array<any> = submissions.map((hmwkSubmitted) => {
        return hmwkSubmitted.grade
        })
    let sumOfGrades = 0;
    
    for (let grade of gradeArray){ 
        sumOfGrades += grade
        }
    const totalAvg = sumOfGrades/gradeArray.length
    return totalAvg
}
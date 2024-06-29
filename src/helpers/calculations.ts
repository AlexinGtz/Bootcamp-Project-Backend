export const calculateAvgGrade = (submissions) => {
    if (!submissions || submissions.length === 0) {
        return null
    }
    const gradeArray: Array<any> = submissions.map((hmwkSubmitted) => {
        return hmwkSubmitted.grade
        })
    
    let nullGradeCount = 0;
    let sumOfGrades = 0;
    
    for (let grade of gradeArray){
        if(grade === null){
            nullGradeCount += 1
        } else {
            sumOfGrades += grade
        }
        }
    const totalAvg = sumOfGrades/(gradeArray.length-nullGradeCount)
    return totalAvg
}
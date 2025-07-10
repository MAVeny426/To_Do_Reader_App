export const smartAssign = (usersTasks) => {
    const sorted = object.entries(userTasks).sort((a,b) => a[1] - b[1]);
    return sorted[0][0];
}
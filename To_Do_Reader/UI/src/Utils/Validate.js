export const validateTask = (title,existingTitles) => {
    if (!title.trim()) return "Title is required.";
    if (["Todo","In Progress","Done"].includes(title)) return "Title cannot column names.";
    if (existingTitles.includes(title)) return "Title must be unique.";
    return null;
}
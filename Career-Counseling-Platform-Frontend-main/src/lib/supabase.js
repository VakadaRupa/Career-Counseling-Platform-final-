// This file provides mock implementations using LocalStorage 
// so the UI works immediately without setting up new tables.
// Replace with actual Supabase edge calls in production.

const delay = (ms) => new Promise(r => setTimeout(r, ms));

export const getQuestions = async () => {
  await delay(200);
  const q = localStorage.getItem('cp_questions');
  return q ? JSON.parse(q) : [];
};

export const addQuestion = async (text, category, allowedModes) => {
  await delay(200);
  const q = { id: Math.random().toString(), text, category, allowedModes, created_at: new Date() };
  const current = await getQuestions();
  localStorage.setItem('cp_questions', JSON.stringify([...current, q]));
  await logSystemAction('Added question: ' + text);
  return q;
};

export const updateQuestion = async (id, text, category, allowedModes) => {
  await delay(200);
  let current = await getQuestions();
  const index = current.findIndex(q => q.id === id);
  if (index > -1) {
    current[index] = { ...current[index], text, category, allowedModes };
    localStorage.setItem('cp_questions', JSON.stringify(current));
    await logSystemAction('Updated question: ' + id);
    return current[index];
  }
  return null;
};

export const deleteQuestion = async (id) => {
  await delay(200);
  let current = await getQuestions();
  localStorage.setItem('cp_questions', JSON.stringify(current.filter(q => q.id !== id)));
  await logSystemAction('Deleted question: ' + id);
  return true;
};

export const getAllSubmissions = async () => {
  await delay(200);
  const s = localStorage.getItem('cp_submissions');
  return s ? JSON.parse(s) : [];
};

export const getEvaluationHistory = async (userId) => {
  const all = await getAllSubmissions();
  return all.filter(s => s.user_id === userId);
};

export const saveEvaluation = async (question, result, inputMode, userId, userEmail) => {
  await delay(200);
  const sub = {
    id: Math.random().toString(),
    question,
    result,
    score: result.score,
    input_mode: inputMode,
    user_id: userId || 'anonymous',
    user_email: userEmail || 'anonymous',
    created_at: new Date()
  };
  const current = await getAllSubmissions();
  localStorage.setItem('cp_submissions', JSON.stringify([sub, ...current]));
  return sub;
};

export const updateSubmission = async (id, updates) => {
  await delay(200);
  let current = await getAllSubmissions();
  const idx = current.findIndex(s => s.id === id);
  if (idx > -1) {
    current[idx] = { ...current[idx], ...updates };
    localStorage.setItem('cp_submissions', JSON.stringify(current));
    await logSystemAction('Updated submission: ' + id);
    return current[idx];
  }
  return null;
};

export const deleteSubmission = async (id) => {
  await delay(200);
  let current = await getAllSubmissions();
  localStorage.setItem('cp_submissions', JSON.stringify(current.filter(s => s.id !== id)));
  await logSystemAction('Deleted submission: ' + id);
  return true;
};

export const clearAllSubmissions = async () => {
  await delay(200);
  localStorage.removeItem('cp_submissions');
  await logSystemAction('Cleared all submissions');
  return true;
};

export const getSystemLogs = async () => {
  await delay(100);
  const l = localStorage.getItem('cp_logs');
  return l ? JSON.parse(l) : [];
};

const logSystemAction = async (action) => {
  const log = { id: Math.random().toString(), action, created_at: new Date() };
  const current = await getSystemLogs();
  localStorage.setItem('cp_logs', JSON.stringify([log, ...current].slice(0, 50)));
};

export const getUserList = async () => {
  await delay(200);
  const u = localStorage.getItem('cp_users');
  return u ? JSON.parse(u) : [
    { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
    { id: '2', name: 'Test Student', email: 'student@example.com', role: 'user' }
  ];
};

export const addUser = async (name, email, role) => {
  await delay(200);
  const newUser = { id: Math.random().toString(36).substring(2), name, email, role, created_at: new Date() };
  const current = await getUserList();
  localStorage.setItem('cp_users', JSON.stringify([...current, newUser]));
  await logSystemAction(`Added ${role}: ${email}`);
  return newUser;
};

export const deleteUser = async (id) => {
  await delay(200);
  const current = await getUserList();
  localStorage.setItem('cp_users', JSON.stringify(current.filter(u => u.id !== id)));
  await logSystemAction(`Deleted user: ${id}`);
  return true;
};

export const updateUserRole = async (userId, newRole) => {
  await delay(200);
  const current = await getUserList();
  const idx = current.findIndex(u => u.id === userId);
  if (idx > -1) {
    current[idx].role = newRole;
    localStorage.setItem('cp_users', JSON.stringify(current));
    await logSystemAction(`Updated user ${userId} role to ${newRole}`);
    return true;
  }
  return false;
};

export const signInWithGoogle = async () => {
  console.log("Mock sign in");
  // Implement real auth later
};

export const signOut = async () => {
  console.log("Mock sign out");
};

export const onAuthStateChange = (callback) => {
  const dummyUser = { id: '1', email: 'vrupa123@gmail.com', role: 'admin' };
  setTimeout(() => callback(dummyUser), 100);
  return () => {};
};

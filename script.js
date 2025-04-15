const supabase = window.supabase.createClient(
    'https://uzocpbaimgaakvnhwktp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6b2NwYmFpbWdhYWt2bmh3a3RwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDAyMzI3NCwiZXhwIjoyMDU5NTk5Mjc0fQ.mgvYnhGq9VHRp4y8g0wQ3bw28opYjIoD0v6gHB8WriU'
);

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const authError = document.getElementById('auth-error');
    const authLoading = document.getElementById('auth-loading');
    const loginBtn = document.getElementById('login-btn');

    if (!email || !password) {
        authError.textContent = "Please enter both email and password";
        authError.classList.remove('hidden');
        return;
    }

    authError.classList.add('hidden');
    authLoading.classList.remove('hidden');
    loginBtn.disabled = true;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    authLoading.classList.add('hidden');
    loginBtn.disabled = false;
    if (error) {
        authError.classList.remove('hidden');
        authError.textContent = error.message || "Invalid credentials";
    } else {
        authError.classList.add('hidden');
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        loadUserData();
    }
}

async function requestOtp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const authError = document.getElementById('auth-error');
    const authLoading = document.getElementById('auth-loading');
    const signupBtn = document.getElementById('signup-btn');
    const resendBtn = document.getElementById('resend-otp-btn');

    if (!email || !password) {
        authError.textContent = "Please enter both email and password";
        authError.classList.remove('hidden');
        return;
    }

    authError.classList.add('hidden');
    authLoading.classList.remove('hidden');
    signupBtn.disabled = true;
    if (resendBtn) resendBtn.disabled = true;

    try {
        sessionStorage.setItem('signupEmail', email);
        sessionStorage.setItem('signupPassword', password);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true
            }
        });
        if (error) throw error;

        authError.textContent = "OTP sent! Please check your email (including spam) for the code.";
        authError.classList.remove('text-red-500');
        authError.classList.add('text-green-500');
        authError.classList.remove('hidden');

        document.getElementById('auth-form').classList.add('hidden');
        document.getElementById('otp-form').classList.remove('hidden');
        document.getElementById('otp-input').focus();
    } catch (error) {
        console.error('OTP request error:', error.message);
        authError.textContent = error.message.includes('rate limit') 
            ? 'Too many requests. Please wait 60 seconds and try again.'
            : error.message || 'Failed to send OTP';
        authError.classList.remove('text-green-500');
        authError.classList.add('text-red-500');
    } finally {
        authLoading.classList.add('hidden');
        signupBtn.disabled = false;
        if (resendBtn) {
            resendBtn.disabled = true;
            setTimeout(() => resendBtn.disabled = false, 30000);
        }
    }
}

async function verifyOtp() {
    const email = sessionStorage.getItem('signupEmail');
    const otp = document.getElementById('otp-input').value.trim();
    const otpError = document.getElementById('otp-error');
    const verifyBtn = document.getElementById('verify-otp-btn');

    if (!otp || otp.length !== 6) {
        otpError.textContent = "Please enter a valid 6-digit OTP";
        otpError.classList.remove('hidden');
        return;
    }

    otpError.classList.add('hidden');
    verifyBtn.disabled = true;

    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'signup'
        });
        if (error) throw error;

        const password = sessionStorage.getItem('signupPassword');
        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        });
        if (updateError) throw updateError;

        otpError.textContent = "Registration successful!";
        otpError.classList.remove('text-red-500');
        otpError.classList.add('text-green-500');
        otpError.classList.remove('hidden');

        sessionStorage.removeItem('signupEmail');
        sessionStorage.removeItem('signupPassword');

        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        loadUserData();
    } catch (error) {
        console.error('OTP verification error:', error.message);
        otpError.textContent = error.message || "Invalid or expired OTP";
        otpError.classList.remove('text-green-500');
        otpError.classList.add('text-red-500');
        otpError.classList.remove('hidden');
    } finally {
        verifyBtn.disabled = false;
    }
}

function showForgotPassword() {
    document.getElementById('auth-form').classList.add('hidden');
    document.getElementById('otp-form').classList.add('hidden');
    document.getElementById('forgot-password-form').classList.remove('hidden');
    document.getElementById('reset-password-form').classList.add('hidden');
    document.getElementById('auth-error').classList.add('hidden');
    document.getElementById('reset-error').classList.add('hidden');
    document.getElementById('reset-message').classList.add('hidden');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('reset-email').focus();
}

async function forgotPassword() {
    const email = document.getElementById('reset-email').value.trim();
    const resetError = document.getElementById('reset-error');
    const resetMessage = document.getElementById('reset-message');
    const resetBtn = document.getElementById('reset-btn');

    if (!email) {
        resetError.textContent = "Please enter your email";
        resetError.classList.remove('hidden');
        return;
    }

    resetError.classList.add('hidden');
    resetMessage.classList.add('hidden');
    resetBtn.disabled = true;

    try {
        sessionStorage.setItem('resetEmail', email);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });
        if (error) throw error;

        resetMessage.textContent = "Reset code sent! Check your email (including spam) and enter the code.";
        resetMessage.classList.remove('hidden');

        document.getElementById('forgot-password-form').classList.add('hidden');
        document.getElementById('reset-password-form').classList.remove('hidden');
        document.getElementById('reset-token').focus();
    } catch (error) {
        console.error('Password reset error:', error.message);
        resetError.textContent = error.message || "Failed to send reset code";
        resetError.classList.remove('hidden');
    } finally {
        resetBtn.disabled = false;
    }
}

async function resetPassword() {
    const email = sessionStorage.getItem('resetEmail');
    const token = document.getElementById('reset-token').value.trim();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const updateError = document.getElementById('update-error');
    const updateMessage = document.getElementById('update-message');
    const updateBtn = document.getElementById('update-password-btn');

    if (!token || !newPassword || !confirmPassword) {
        updateError.textContent = "Please enter the code and both passwords";
        updateError.classList.remove('hidden');
        return;
    }

    if (newPassword !== confirmPassword) {
        updateError.textContent = "Passwords do not match";
        updateError.classList.remove('hidden');
        return;
    }

    if (newPassword.length < 6) {
        updateError.textContent = "Password must be at least 6 characters";
        updateError.classList.remove('hidden');
        return;
    }

    updateError.classList.add('hidden');
    updateMessage.classList.add('hidden');
    updateBtn.disabled = true;

    try {
        const { error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'recovery'
        });
        if (verifyError) throw verifyError;

        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (updateError) throw updateError;

        updateMessage.textContent = "Password updated successfully! Please log in.";
        updateMessage.classList.remove('hidden');

        sessionStorage.removeItem('resetEmail');

        setTimeout(() => {
            backToLogin();
            document.getElementById('reset-token').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        }, 2000);
    } catch (error) {
        console.error('Password reset error:', error.message);
        updateError.textContent = error.message || "Failed to reset password";
        updateError.classList.remove('hidden');
    } finally {
        updateBtn.disabled = false;
    }
}

function backToLogin() {
    document.getElementById('auth-form').classList.remove('hidden');
    document.getElementById('otp-form').classList.add('hidden');
    document.getElementById('forgot-password-form').classList.add('hidden');
    document.getElementById('reset-password-form').classList.add('hidden');
    document.getElementById('auth-error').classList.add('hidden');
    document.getElementById('otp-error').classList.add('hidden');
    document.getElementById('reset-error').classList.add('hidden');
    document.getElementById('reset-message').classList.add('hidden');
    document.getElementById('update-error').classList.add('hidden');
    document.getElementById('update-message').classList.add('hidden');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('otp-input').value = '';
    document.getElementById('reset-email').value = '';
    document.getElementById('reset-token').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
}

async function logout() {
    await supabase.auth.signOut();
    sessionStorage.removeItem('signupEmail');
    sessionStorage.removeItem('signupPassword');
    sessionStorage.removeItem('resetEmail');
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('auth-form').classList.remove('hidden');
    document.getElementById('otp-form').classList.add('hidden');
    document.getElementById('forgot-password-form').classList.add('hidden');
    document.getElementById('reset-password-form').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
}

supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        loadUserData();
    } else {
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('auth-form').classList.remove('hidden');
        document.getElementById('otp-form').classList.add('hidden');
        document.getElementById('forgot-password-form').classList.add('hidden');
        document.getElementById('reset-password-form').classList.add('hidden');
        document.getElementById('dashboard').classList.add('hidden');
    }
});

async function loadUserData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: notesData } = await supabase.from('notes').select('*').eq('user_id', user.id);
        const { data: tasksData } = await supabase.from('tasks').select('*').eq('user_id', user.id);
        const { data: expensesData } = await supabase.from('expenses').select('*').eq('user_id', user.id);

        notes = notesData || [];
        tasks = tasksData || [];
        expenses = expensesData || [];

        renderNotes();
        renderTasks();
        renderExpenses();
    }
}

let notes = [];
async function addNote() {
    const input = document.getElementById('note-input');
    const addBtn = document.getElementById('add-note-btn');
    const text = input.value.trim();

    if (!text) {
        alert('Please enter a note');
        return;
    }

    addBtn.disabled = true;
    const { data: { user } } = await supabase.auth.getUser();
    const note = { user_id: user.id, text, created_at: new Date().toISOString() };
    const { data, error } = await supabase.from('notes').insert(note).select().single();
    addBtn.disabled = false;

    if (!error) {
        notes.push(data);
        input.value = '';
        document.getElementById('note-char-count').textContent = '0/500';
        renderNotes();
    } else {
        alert('Failed to add note: ' + error.message);
    }
}

async function editNote(index) {
    const newNote = prompt('Edit note:', notes[index].text);
    if (newNote !== null && newNote.trim()) {
        const { error } = await supabase
            .from('notes')
            .update({ text: newNote.trim() })
            .eq('id', notes[index].id);
        if (!error) {
            notes[index].text = newNote.trim();
            renderNotes();
        } else {
            alert('Failed to edit note: ' + error.message);
        }
    }
}

async function deleteNote(index) {
    if (confirm('Delete this note?')) {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', notes[index].id);
        if (!error) {
            notes.splice(index, 1);
            renderNotes();
        } else {
            alert('Failed to delete note: ' + error.message);
        }
    }
}

async function clearAllNotes() {
    if (notes.length === 0) {
        alert('No notes to clear');
        return;
    }
    if (confirm('Are you sure you want to delete all notes? This cannot be undone.')) {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('user_id', user.id);
        if (!error) {
            notes = [];
            renderNotes();
        } else {
            alert('Failed to clear notes: ' + error.message);
        }
    }
}

function renderNotes(searchTerm = '') {
    const list = document.getElementById('notes-list');
    const filteredNotes = searchTerm
        ? notes.filter(note => note.text.toLowerCase().includes(searchTerm.toLowerCase()))
        : notes;
    
    list.innerHTML = filteredNotes.map((note, index) => `
        <li class="flex flex-col p-2 bg-gray-50 rounded-md">
            <div class="flex justify-between items-center">
                <span class="break-all">${note.text}</span>
                <div>
                    <button onclick="editNote(${index})" class="text-blue-500 mr-2"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteNote(${index})" class="text-red-500"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <span class="text-gray-500 text-sm">${new Date(note.created_at).toLocaleString()}</span>
        </li>
    `).join('');
}

let tasks = [];
async function addTask() {
    const input = document.getElementById('task-input');
    const category = document.getElementById('task-category').value;
    const dueDate = document.getElementById('task-due-date').value;
    const addBtn = document.getElementById('add-task-btn');
    const text = input.value.trim();

    if (!text) {
        alert('Please enter a task');
        return;
    }

    addBtn.disabled = true;
    const { data: { user } } = await supabase.auth.getUser();
    const task = { 
        user_id: user.id, 
        text, 
        done: false, 
        category, 
        due_date: dueDate || null,
        created_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('tasks').insert(task).select().single();
    addBtn.disabled = false;

    if (!error) {
        tasks.push(data);
        input.value = '';
        document.getElementById('task-due-date').value = '';
        renderTasks();
    } else {
        alert('Failed to add task: ' + error.message);
    }
}

async function toggleTask(index) {
    tasks[index].done = !tasks[index].done;
    const { error } = await supabase
        .from('tasks')
        .update({ done: tasks[index].done })
        .eq('id', tasks[index].id);
    if (!error) {
        renderTasks();
    } else {
        alert('Failed to update task: ' + error.message);
    }
}

async function deleteTask(index) {
    if (confirm('Delete this task?')) {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', tasks[index].id);
        if (!error) {
            tasks.splice(index, 1);
            renderTasks();
        } else {
            alert('Failed to delete task: ' + error.message);
        }
    }
}

async function clearCompletedTasks() {
    const completedTasks = tasks.filter(task => task.done);
    if (completedTasks.length === 0) {
        alert('No completed tasks to clear');
        return;
    }
    if (confirm('Are you sure you want to delete all completed tasks?')) {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('done', true)
            .eq('user_id', tasks[0].user_id);
        if (!error) {
            tasks = tasks.filter(task => !task.done);
            renderTasks();
        } else {
            alert('Failed to clear tasks: ' + error.message);
        }
    }
}

function sortTasks(criteria) {
    if (criteria === 'status') {
        tasks.sort((a, b) => a.done - b.done);
    } else if (criteria === 'dueDate') {
        tasks.sort((a, b) => {
            const dateA = a.due_date ? new Date(a.due_date) : new Date(9999, 11, 31);
            const dateB = b.due_date ? new Date(b.due_date) : new Date(9999, 11, 31);
            return dateA - dateB;
        });
    }
    renderTasks();
}

function renderTasks() {
    const list = document.getElementById('tasks-list');
    const today = new Date().setHours(0, 0, 0, 0);
    list.innerHTML = tasks.map((task, index) => {
        const dueDate = task.due_date ? new Date(task.due_date) : null;
        const isOverdue = dueDate && dueDate.setHours(0, 0, 0, 0) < today && !task.done;
        return `
        <li class="flex flex-col p-2 bg-gray-50 rounded-md ${isOverdue ? 'border-l-4 border-red-500' : ''}">
            <div class="flex items-center">
                <input type="checkbox" ${task.done ? 'checked' : ''} onclick="toggleTask(${index})" class="mr-2">
                <span class="${task.done ? 'line-through text-gray-500' : ''} flex-1">${task.text}</span>
                <button onclick="deleteTask(${index})" class="text-red-500"><i class="fas fa-trash"></i></button>
            </div>
            <div class="text-gray-500 text-sm">
                <span>Category: ${task.category}</span>
                ${task.due_date ? `<span> | Due: ${new Date(task.due_date).toLocaleDateString()}</span>` : ''}
            </div>
        </li>
    `}).join('');
}

let expenses = [];
async function addExpense() {
    const name = document.getElementById('expense-name').value.trim();
    const category = document.getElementById('expense-category').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value;
    const addBtn = document.getElementById('add-expense-btn');

    if (!name || !date || isNaN(amount) || amount <= 0) {
        alert('Please fill all fields with valid data');
        return;
    }

    addBtn.disabled = true;
    const { data: { user } } = await supabase.auth.getUser();
    const expense = { user_id: user.id, name, category, amount, date };
    const { data, error } = await supabase.from('expenses').insert(expense).select().single();
    addBtn.disabled = false;

    if (!error) {
        expenses.push(data);
        document.getElementById('expense-name').value = '';
        document.getElementById('expense-amount').value = '';
        document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
        renderExpenses();
    } else {
        alert('Failed to add expense: ' + error.message);
    }
}

async function deleteExpense(index) {
    if (confirm('Delete this expense?')) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', expenses[index].id);
        if (!error) {
            expenses.splice(index, 1);
            renderExpenses();
        } else {
            alert('Failed to delete expense: ' + error.message);
        }
    }
}

function exportExpenses() {
    if (expenses.length === 0) {
        alert('No expenses to export');
        return;
    }
    const csv = [
        'Name,Category,Amount,Date',
        ...expenses.map(exp => `${exp.name},${exp.category},${exp.amount.toFixed(2)},${exp.date}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function renderExpenses(filterCategory = '') {
    const list = document.getElementById('expenses-list');
    const totalSpan = document.getElementById('expense-total');
    const summaryList = document.getElementById('expense-summary');

    const filteredExpenses = filterCategory 
        ? expenses.filter(exp => exp.category === filterCategory) 
        : expenses;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const summary = expenses.reduce((acc, exp) => {
        const expDate = new Date(exp.date);
        if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        }
        return acc;
    }, {});

    summaryList.innerHTML = Object.entries(summary).map(([cat, total]) => `
        <li>${cat}: $${total.toFixed(2)}</li>
    `).join('') || '<li>No expenses this month</li>';

    list.innerHTML = filteredExpenses.map((exp, index) => `
        <li class="flex flex-col p-2 bg-gray-50 rounded-md">
            <div class="flex justify-between items-center">
                <span>${exp.name} (${exp.category})</span>
                <div>
                    <span class="mr-4">$${exp.amount.toFixed(2)}</span>
                    <button onclick="deleteExpense(${index})" class="text-red-500"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <span class="text-gray-500 text-sm">${new Date(exp.date).toLocaleDateString()}</span>
        </li>
    `).join('');

    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2);
    totalSpan.textContent = total;
}

window.onload = function () {
    displayQuote();

    const noteInput = document.getElementById('note-input');
    if (noteInput) {
        noteInput.addEventListener('input', () => {
            const count = noteInput.value.length;
            document.getElementById('note-char-count').textContent = `${count}/500`;
        });
    }

    const noteSearch = document.getElementById('note-search');
    if (noteSearch) {
        noteSearch.addEventListener('input', () => {
            renderNotes(noteSearch.value);
        });
    }

    const expenseFilter = document.getElementById('expense-filter');
    if (expenseFilter) {
        expenseFilter.addEventListener('change', () => {
            renderExpenses(expenseFilter.value);
        });
    }

    const expenseDate = document.getElementById('expense-date');
    if (expenseDate) {
        expenseDate.value = new Date().toISOString().split('T')[0];
    }

    const otpInput = document.getElementById('otp-input');
    if (otpInput) {
        otpInput.addEventListener('input', () => {
            otpInput.value = otpInput.value.replace(/[^0-9]/g, '').slice(0, 6);
        });
    }
};

const quotes = [
    { text: "The best way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Don’t let yesterday take up too much of today.", author: "Will Rogers" },
    { text: "It’s not whether you get knocked down, it’s whether you get up.", author: "Vince Lombardi" },
    { text: "Success is not in what you have, but who you are.", author: "Bo Bennett" },
    { text: "If you’re going through hell, keep going.", author: "Winston Churchill" },
    { text: "Your time is limited, so don’t waste it living someone else’s life.", author: "Steve Jobs" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
];

function displayQuote() {
    const today = new Date().getDay();
    const quote = quotes[today % quotes.length];
    document.getElementById('quote-text').textContent = `"${quote.text}"`;
    document.getElementById('quote-author').textContent = `— ${quote.author}`;
}

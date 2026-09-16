const storageKey = 'student-guide-bot-tasks';
let tasks = JSON.parse(localStorage.getItem(storageKey) || '[]');

const taskForm = document.querySelector('#task-form');
const taskName = document.querySelector('#task-name');
const taskDueDate = document.querySelector('#task-due-date');
const taskList = document.querySelector('#task-list');
const messages = document.querySelector('#messages');
const chatForm = document.querySelector('#chat-form');
const chatInput = document.querySelector('#chat-input');

function saveTasks() { localStorage.setItem(storageKey, JSON.stringify(tasks)); }
function escapeHtml(text) { const node = document.createElement('span'); node.textContent = text; return node.innerHTML; }
function formatDate(date) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`)); }

function renderTasks() {
  if (!tasks.length) { taskList.innerHTML = '<li class="empty">No study tasks yet. Add your first task.</li>'; return; }
  taskList.innerHTML = tasks.map((task) => `<li class="task ${task.completed ? 'done' : ''}">
    <input type="checkbox" data-complete="${task.id}" ${task.completed ? 'checked' : ''} aria-label="Mark ${escapeHtml(task.name)} complete">
    <span class="task-title">${escapeHtml(task.name)}</span>
    <button class="delete" type="button" data-delete="${task.id}" aria-label="Delete ${escapeHtml(task.name)}">Delete</button>
    ${task.dueDate ? `<span class="task-date">Due ${formatDate(task.dueDate)}</span>` : ''}
  </li>`).join('');
}

function addMessage(text, role) {
  const message = document.createElement('div');
  message.className = `message ${role}`;
  message.textContent = text;
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
}

function pendingTasks() { return tasks.filter((task) => !task.completed); }
function reply(input) {
  const message = input.toLowerCase().trim();
  const pending = pendingTasks();
  const withDueDates = pending.filter((task) => task.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const addMatch = input.match(/^add(?:\s+study)?\s+(.+)/i);
  if (addMatch) {
    const name = addMatch[1].trim();
    tasks.push({ id: crypto.randomUUID(), name, dueDate: '', completed: false }); saveTasks(); renderTasks();
    return `I added “${name}”. Add a due date from the task list if you have one.`;
  }
  if (/due|deadline/.test(message)) {
    return withDueDates.length ? `Your upcoming tasks:\n${withDueDates.map((task) => `• ${task.name}, due ${formatDate(task.dueDate)}`).join('\n')}` : 'You have no upcoming due dates. Add one to a study task when you know it.';
  }
  if (/plan|today|day/.test(message)) {
    if (!pending.length) return 'You have no pending tasks. Add one study task to start a plan.';
    const selected = [...withDueDates, ...pending.filter((task) => !task.dueDate)].slice(0, 3);
    return `A focused plan for today:\n${selected.map((task, index) => `${index + 1}. ${task.name}${task.dueDate ? ` (due ${formatDate(task.dueDate)})` : ''}`).join('\n')}\n\nStart with task 1, then return here when you finish it.`;
  }
  if (/help|hello|hi\b/.test(message)) return 'I can help you make a simple study plan. Add a task on the left, or ask “plan my day” or “what is due?”';
  return 'I can help with your study tasks. Try “plan my day”, “what is due?”, or “add study review biology notes”.';
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = taskName.value.trim();
  if (!name) return;
  tasks.push({ id: crypto.randomUUID(), name, dueDate: taskDueDate.value, completed: false });
  saveTasks(); renderTasks(); taskForm.reset(); taskName.focus();
  addMessage(`Added study task: ${name}`, 'bot');
});

taskList.addEventListener('change', (event) => {
  const id = event.target.dataset.complete;
  if (!id) return;
  const task = tasks.find((item) => item.id === id); task.completed = event.target.checked; saveTasks(); renderTasks();
});
taskList.addEventListener('click', (event) => {
  const id = event.target.dataset.delete;
  if (!id) return;
  tasks = tasks.filter((task) => task.id !== id); saveTasks(); renderTasks();
});
chatForm.addEventListener('submit', (event) => {
  event.preventDefault(); const input = chatInput.value.trim(); if (!input) return;
  addMessage(input, 'user'); chatInput.value = ''; window.setTimeout(() => addMessage(reply(input), 'bot'), 250);
});
document.querySelector('#clear-button').addEventListener('click', () => {
  if (confirm('Delete all study tasks stored in this browser?')) { tasks = []; saveTasks(); renderTasks(); addMessage('Your local study tasks were cleared.', 'bot'); }
});
renderTasks();
addMessage('Hello. I am Student Guide Bot. Add a study task, then ask me to plan your day.', 'bot');

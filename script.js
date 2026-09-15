const YEAR = 2026;
const STORAGE_KEY = "leafy-2026-todos";
const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const weekdayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

const state = {
  month: Math.min(new Date().getMonth(), 11),
  selected: `${YEAR}-${String(Math.min(new Date().getMonth() + 1, 12)).padStart(2, "0")}-01`,
  todos: loadTodos(),
};

const els = {
  calendarGrid: document.querySelector("#calendarGrid"),
  monthTitle: document.querySelector("#monthTitle"),
  monthCounter: document.querySelector("#monthCounter"),
  selectedDayLabel: document.querySelector("#selectedDayLabel"),
  selectedDateTitle: document.querySelector("#selectedDateTitle"),
  todoForm: document.querySelector("#todoForm"),
  todoInput: document.querySelector("#todoInput"),
  todoList: document.querySelector("#todoList"),
  todoCount: document.querySelector("#todoCount"),
  emptyState: document.querySelector("#emptyState"),
  progressValue: document.querySelector("#progressValue"),
  progressBar: document.querySelector("#progressBar"),
  yearMonths: document.querySelector("#yearMonths"),
  todayBadge: document.querySelector("#todayBadge"),
};

function loadTodos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function dateKey(month, day) {
  return `${YEAR}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function renderCalendar() {
  els.monthTitle.textContent = monthNames[state.month];
  els.monthCounter.textContent = `${String(state.month + 1).padStart(2, "0")} / 12`;
  els.calendarGrid.innerHTML = "";

  const firstDay = new Date(YEAR, state.month, 1).getDay();
  const daysInMonth = new Date(YEAR, state.month + 1, 0).getDate();
  const prevMonthDays = new Date(YEAR, state.month, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  for (let index = 0; index < totalCells; index += 1) {
    const day = index - firstDay + 1;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-cell";
    button.setAttribute("role", "gridcell");

    if (day < 1 || day > daysInMonth) {
      button.classList.add("outside");
      button.disabled = true;
      button.innerHTML = `<span class="day-number">${day < 1 ? prevMonthDays + day : day - daysInMonth}</span>`;
    } else {
      const key = dateKey(state.month, day);
      const items = state.todos[key] || [];
      button.dataset.date = key;
      button.setAttribute("aria-label", `${YEAR}년 ${state.month + 1}월 ${day}일, 할 일 ${items.length}개`);
      if (key === state.selected) button.classList.add("selected");
      if (key === getTodayKey()) button.classList.add("today");
      const dotCount = Math.min(items.length, 3);
      button.innerHTML = `
        <span class="day-number">${day}</span>
        ${items.length ? `<span class="todo-dots">${"<i></i>".repeat(dotCount)}</span><span class="day-count">${items.length}</span>` : ""}
      `;
      button.addEventListener("click", () => selectDate(key));
    }
    els.calendarGrid.appendChild(button);
  }

  [...els.yearMonths.children].forEach((button, index) => button.classList.toggle("active", index === state.month));
  renderProgress();
}

function renderTodos() {
  const items = state.todos[state.selected] || [];
  const selectedDate = new Date(`${state.selected}T12:00:00`);
  els.selectedDayLabel.textContent = weekdayNames[selectedDate.getDay()];
  els.selectedDateTitle.textContent = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`;
  els.todoCount.textContent = `할 일 ${items.length}개`;
  els.todoList.innerHTML = "";
  els.emptyState.classList.toggle("hidden", items.length > 0);

  items.forEach((todo) => {
    const li = document.createElement("li");
    li.className = `todo-item${todo.done ? " completed" : ""}`;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-check";
    checkbox.checked = todo.done;
    checkbox.setAttribute("aria-label", `${todo.text} 완료 표시`);
    checkbox.addEventListener("change", () => toggleTodo(todo.id));
    const label = document.createElement("label");
    label.textContent = todo.text;
    label.addEventListener("click", () => { checkbox.checked = !checkbox.checked; toggleTodo(todo.id); });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-todo";
    remove.setAttribute("aria-label", `${todo.text} 삭제`);
    remove.textContent = "×";
    remove.addEventListener("click", () => deleteTodo(todo.id));
    li.append(checkbox, label, remove);
    els.todoList.appendChild(li);
  });
}

function selectDate(key) {
  state.selected = key;
  renderCalendar();
  renderTodos();
  els.todoInput.focus();
}

function addTodo(text) {
  const cleanText = text.trim();
  if (!cleanText) return;
  state.todos[state.selected] ||= [];
  state.todos[state.selected].push({ id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, text: cleanText, done: false });
  saveTodos();
  renderCalendar();
  renderTodos();
}

function toggleTodo(id) {
  const item = (state.todos[state.selected] || []).find((todo) => todo.id === id);
  if (!item) return;
  item.done = !item.done;
  saveTodos();
  renderTodos();
  renderProgress();
}

function deleteTodo(id) {
  state.todos[state.selected] = (state.todos[state.selected] || []).filter((todo) => todo.id !== id);
  if (!state.todos[state.selected].length) delete state.todos[state.selected];
  saveTodos();
  renderCalendar();
  renderTodos();
}

function renderProgress() {
  const prefix = `${YEAR}-${String(state.month + 1).padStart(2, "0")}`;
  const items = Object.entries(state.todos).filter(([key]) => key.startsWith(prefix)).flatMap(([, todos]) => todos);
  const done = items.filter((item) => item.done).length;
  const progress = items.length ? Math.round((done / items.length) * 100) : 0;
  els.progressValue.textContent = `${progress}%`;
  els.progressBar.style.width = `${progress}%`;
}

function changeMonth(nextMonth) {
  state.month = (nextMonth + 12) % 12;
  const selectedDay = state.selected.slice(-2);
  const maxDay = new Date(YEAR, state.month + 1, 0).getDate();
  state.selected = dateKey(state.month, Math.min(Number(selectedDay), maxDay));
  renderCalendar();
  renderTodos();
}

function getTodayKey() {
  const now = new Date();
  return now.getFullYear() === YEAR ? dateKey(now.getMonth(), now.getDate()) : "";
}

function goToday() {
  const todayKey = getTodayKey();
  if (todayKey) {
    state.month = new Date().getMonth();
    state.selected = todayKey;
  } else {
    state.month = 0;
    state.selected = dateKey(0, 1);
  }
  renderCalendar();
  renderTodos();
}

function createMonthNav() {
  monthNames.forEach((month, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.title = month;
    button.setAttribute("aria-label", `${month} 보기`);
    button.addEventListener("click", () => changeMonth(index));
    els.yearMonths.appendChild(button);
  });
}

function createLeaves() {
  const container = document.querySelector(".floating-leaves");
  const emojis = ["🍃", "🌿", "🍀", "🌱"];
  for (let i = 0; i < 18; i += 1) {
    const leaf = document.createElement("span");
    leaf.className = "floating-leaf";
    leaf.textContent = emojis[i % emojis.length];
    leaf.style.left = `${(i * 37) % 100}%`;
    leaf.style.fontSize = `${17 + (i % 5) * 7}px`;
    leaf.style.animationDuration = `${13 + (i % 7) * 2.4}s`;
    leaf.style.animationDelay = `${-i * 1.9}s`;
    container.appendChild(leaf);
  }
}

document.querySelector("#prevMonth").addEventListener("click", () => changeMonth(state.month - 1));
document.querySelector("#nextMonth").addEventListener("click", () => changeMonth(state.month + 1));
document.querySelector("#todayButton").addEventListener("click", goToday);
document.querySelector("#clearCompleted").addEventListener("click", () => {
  state.todos[state.selected] = (state.todos[state.selected] || []).filter((todo) => !todo.done);
  if (!state.todos[state.selected].length) delete state.todos[state.selected];
  saveTodos();
  renderCalendar();
  renderTodos();
});
els.todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTodo(els.todoInput.value);
  els.todoInput.value = "";
});
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" && event.altKey) changeMonth(state.month - 1);
  if (event.key === "ArrowRight" && event.altKey) changeMonth(state.month + 1);
});

const now = new Date();
els.todayBadge.textContent = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, "0")}. ${String(now.getDate()).padStart(2, "0")}`;
createMonthNav();
createLeaves();
renderCalendar();
renderTodos();

const API_BASE_URL = "";

let allTasks = [];
let currentFilter = "ALL";
let editingTaskId = null;
let notificationTimer = null;

function getToken() {
    return localStorage.getItem("pids_token");
}

function getAuthHeaders() {
    const token = getToken();

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

function checkAuthentication() {
    const token = getToken();

    if (!token) {
        window.location.href = "/login.html";
        return false;
    }

    return true;
}

document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuthentication()) {
        return;
    }

    setupEventListeners();
    await loadTasks();
    setupNotifications();
});

function setupEventListeners() {
    const form = document.getElementById("taskForm");

    if (form) {
        form.addEventListener("submit", handleTaskSubmit);
    }

    const cancelButton = document.getElementById("cancelEditButton");

    if (cancelButton) {
        cancelButton.addEventListener("click", cancelEdit);
    }

    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }
}

async function loadTasks() {
    const loading = document.getElementById("loading");

    try {
        if (loading) {
            loading.style.display = "block";
        }

        const response = await fetch(
            `${API_BASE_URL}/api/tasks`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (response.status === 401 || response.status === 403) {
            handleSessionExpired();
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
                errorText || "Unable to load tasks."
            );
        }

        const data = await response.json();

        allTasks = Array.isArray(data) ? data : [];

        updateStatistics();
        renderTasks();

    } catch (error) {
        console.error("Load tasks error:", error);

        showError(
            error.message || "Unable to load tasks."
        );
    } finally {
        if (loading) {
            loading.style.display = "none";
        }
    }
}

async function handleTaskSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    const titleElement = document.getElementById("title");
    const descriptionElement = document.getElementById("description");
    const priorityElement = document.getElementById("priority");
    const dueDateElement = document.getElementById("dueDate");

    const title = titleElement
        ? titleElement.value.trim()
        : "";

    const description = descriptionElement
        ? descriptionElement.value.trim()
        : "";

    const priority = priorityElement
        ? priorityElement.value
        : "MEDIUM";

    const dueDate = dueDateElement
        ? dueDateElement.value
        : "";

    if (!title) {
        alert("Please enter a task title.");
        return;
    }

    if (!priority) {
        alert("Please select a priority.");
        return;
    }

    const taskData = {
        title: title,
        description: description || null,
        priority: priority,
        dueDate: dueDate
            ? `${dueDate}T23:59:00`
            : null
    };

    try {
        let response;

        if (editingTaskId !== null) {
            response = await fetch(
                `${API_BASE_URL}/api/tasks/${editingTaskId}`,
                {
                    method: "PUT",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(taskData)
                }
            );
        } else {
            response = await fetch(
                `${API_BASE_URL}/api/tasks`,
                {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(taskData)
                }
            );
        }

        if (response.status === 401 || response.status === 403) {
            handleSessionExpired();
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
                errorText || "Unable to save task."
            );
        }

        const wasEditing = editingTaskId !== null;

        resetTaskForm();

        await loadTasks();

        alert(
            wasEditing
                ? "Task updated successfully!"
                : "Task added successfully!"
        );

    } catch (error) {
        console.error("Save task error:", error);

        alert(
            error.message || "Unable to save task."
        );
    }
}

function editTask(taskId) {
    const task = allTasks.find(
        item => String(item.id) === String(taskId)
    );

    if (!task) {
        alert("Task not found.");
        return;
    }

    editingTaskId = task.id;

    setInputValue(
        "title",
        task.title || ""
    );

    setInputValue(
        "description",
        task.description || ""
    );

    setInputValue(
        "priority",
        task.priority || "MEDIUM"
    );

    setInputValue(
        "dueDate",
        formatInputDate(task.dueDate)
    );

    const formTitle =
        document.getElementById("formTitle");

    if (formTitle) {
        formTitle.textContent = "Edit Task";
    }

    const saveButton =
        document.getElementById("saveTaskButton");

    if (saveButton) {
        saveButton.textContent = "Update Task";
    }

    const cancelButton =
        document.getElementById("cancelEditButton");

    if (cancelButton) {
        cancelButton.style.display = "inline-block";
    }

    const form =
        document.getElementById("taskForm");

    if (form) {
        form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

function resetTaskForm() {
    editingTaskId = null;

    const form =
        document.getElementById("taskForm");

    if (form) {
        form.reset();
    }

    const priority =
        document.getElementById("priority");

    if (priority) {
        priority.value = "MEDIUM";
    }

    const formTitle =
        document.getElementById("formTitle");

    if (formTitle) {
        formTitle.textContent = "Add Task";
    }

    const saveButton =
        document.getElementById("saveTaskButton");

    if (saveButton) {
        saveButton.textContent = "Add Task";
    }

    const cancelButton =
        document.getElementById("cancelEditButton");

    if (cancelButton) {
        cancelButton.style.display = "none";
    }
}

function cancelEdit() {
    resetTaskForm();
}

async function toggleTaskStatus(taskId) {
    const task = allTasks.find(
        item => String(item.id) === String(taskId)
    );

    if (!task) {
        alert("Task not found.");
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/tasks/${taskId}/toggle`,
            {
                method: "PUT",
                headers: getAuthHeaders()
            }
        );

        if (response.status === 401 || response.status === 403) {
            handleSessionExpired();
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
                errorText || "Unable to change task status."
            );
        }

        const updatedTask = await response.json();

        const index = allTasks.findIndex(
            item => String(item.id) === String(taskId)
        );

        if (index !== -1) {
            allTasks[index] = updatedTask;
        }

        updateStatistics();
        renderTasks();

    } catch (error) {
        console.error("Toggle task error:", error);

        alert(
            error.message || "Unable to change task status."
        );
    }
}

async function completeTask(taskId) {
    await toggleTaskStatus(taskId);
}

async function undoTask(taskId) {
    await toggleTaskStatus(taskId);
}

async function deleteTask(taskId) {
    const task = allTasks.find(
        item => String(item.id) === String(taskId)
    );

    if (!task) {
        alert("Task not found.");
        return;
    }

    const confirmed = confirm(
        `Delete "${task.title}"?`
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/tasks/${taskId}`,
            {
                method: "DELETE",
                headers: getAuthHeaders()
            }
        );

        if (response.status === 401 || response.status === 403) {
            handleSessionExpired();
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
                errorText || "Unable to delete task."
            );
        }

        allTasks = allTasks.filter(
            item => String(item.id) !== String(taskId)
        );

        updateStatistics();
        renderTasks();

    } catch (error) {
        console.error("Delete task error:", error);

        alert(
            error.message || "Unable to delete task."
        );
    }
}

function filterTasks(filter, button) {
    currentFilter = filter || "ALL";

    document
        .querySelectorAll(".filter-btn")
        .forEach(btn => {
            btn.classList.remove("active");
        });

    if (button) {
        button.classList.add("active");
    } else {
        const matchingButton =
            document.querySelector(
                `.filter-btn[data-filter="${currentFilter}"]`
            );

        if (matchingButton) {
            matchingButton.classList.add("active");
        }
    }

    renderTasks();
}

function getFilteredTasks() {
    return allTasks.filter(task => {
        const completed =
            task.completed === true;

        if (currentFilter === "PENDING") {
            return !completed;
        }

        if (currentFilter === "COMPLETED") {
            return completed;
        }

        if (currentFilter === "HIGH") {
            return String(task.priority || "")
                .toUpperCase() === "HIGH";
        }

        return true;
    });
}

function renderTasks() {
    const container =
        document.getElementById("tasksContainer");

    const emptyState =
        document.getElementById("emptyState");

    if (!container) {
        return;
    }

    const tasks = getFilteredTasks();

    container.innerHTML = "";

    if (tasks.length === 0) {
        if (emptyState) {
            emptyState.style.display = "block";
        }

        return;
    }

    if (emptyState) {
        emptyState.style.display = "none";
    }

    tasks.forEach(task => {
        container.appendChild(
            createTaskElement(task)
        );
    });
}

function createTaskElement(task) {
    const card =
        document.createElement("div");

    card.className = "task-card";

    if (task.completed) {
        card.classList.add("completed");
    }

    const priority =
        String(task.priority || "MEDIUM")
            .toUpperCase();

    const priorityClass =
        priority.toLowerCase();

    const dueDate =
        formatDisplayDate(task.dueDate);

    const isCompleted =
        task.completed === true;

    card.innerHTML = `
        <div class="task-main">
            <div class="task-icon">
                ✓
            </div>

            <div class="task-content">
                <div class="task-title-row">
                    <h3>
                        ${escapeHtml(
        task.title || "Untitled Task"
    )}
                    </h3>

                    <span class="priority-badge ${priorityClass}">
                        ${escapeHtml(priority)}
                    </span>
                </div>

                ${
        task.description
            ? `
                            <p class="task-description">
                                ${escapeHtml(
                task.description
            )}
                            </p>
                        `
            : ""
    }

                <div class="task-details">
                    <div class="task-detail">
                        <span class="detail-label">
                            Due Date
                        </span>

                        <strong>
                            ${escapeHtml(
        dueDate || "No due date"
    )}
                        </strong>
                    </div>

                    <div class="task-detail">
                        <span class="detail-label">
                            Status
                        </span>

                        <strong>
                            ${
        isCompleted
            ? "Completed"
            : "Pending"
    }
                        </strong>
                    </div>
                </div>
            </div>
        </div>

        <div class="task-actions">
            <button
                type="button"
                class="edit-button"
                style="cursor: pointer;"
                onclick="toggleTaskStatus(${task.id})">
                ${isCompleted ? "Undo" : "Complete"}
            </button>

            <button
                type="button"
                class="edit-button"
                style="cursor: pointer;"
                onclick="editTask(${task.id})">
                Edit
            </button>

            <button
                type="button"
                class="delete-button"
                style="cursor: pointer;"
                onclick="deleteTask(${task.id})">
                Delete
            </button>
        </div>
    `;

    return card;
}

function updateStatistics() {
    const total =
        allTasks.length;

    const completed =
        allTasks.filter(
            task => task.completed === true
        ).length;

    const pending =
        allTasks.filter(
            task => task.completed !== true
        ).length;

    const highPriority =
        allTasks.filter(
            task =>
                String(task.priority || "")
                    .toUpperCase() === "HIGH" &&
                task.completed !== true
        ).length;

    setElementText(
        "totalTasks",
        total
    );

    setElementText(
        "completedTasks",
        completed
    );

    setElementText(
        "pendingTasks",
        pending
    );

    setElementText(
        "highPriorityTasks",
        highPriority
    );
}

function formatInputDate(dateValue) {
    if (!dateValue) {
        return "";
    }

    return String(dateValue)
        .substring(0, 10);
}

function formatDisplayDate(dateValue) {
    if (!dateValue) {
        return "";
    }

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return String(dateValue);
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function setInputValue(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.value =
            value ?? "";
    }
}

function setElementText(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function escapeHtml(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showError(message) {
    const container =
        document.getElementById(
            "tasksContainer"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="empty-state">
            <h3>
                Unable to load tasks
            </h3>

            <p>
                ${escapeHtml(message)}
            </p>
        </div>
    `;

    const emptyState =
        document.getElementById("emptyState");

    if (emptyState) {
        emptyState.style.display = "none";
    }
}

function handleSessionExpired() {
    localStorage.removeItem("pids_token");

    if (notificationTimer) {
        clearInterval(notificationTimer);
        notificationTimer = null;
    }

    alert(
        "Your session has expired. Please sign in again."
    );

    window.location.href =
        "/login.html";
}

function logout() {
    localStorage.removeItem("pids_token");

    if (notificationTimer) {
        clearInterval(notificationTimer);
        notificationTimer = null;
    }

    window.location.href =
        "/login.html";
}

async function setupNotifications() {
    if (!("Notification" in window)) {
        startNotificationChecker();
        return;
    }

    if (Notification.permission === "default") {
        try {
            await Notification.requestPermission();
        } catch (error) {
            console.error(
                "Notification permission error:",
                error
            );
        }
    }

    startNotificationChecker();
}

function startNotificationChecker() {
    checkTaskNotifications();

    if (notificationTimer) {
        clearInterval(notificationTimer);
    }

    notificationTimer = setInterval(
        checkTaskNotifications,
        15000
    );
}

function checkTaskNotifications() {
    if (!Array.isArray(allTasks)) {
        return;
    }

    const now =
        new Date();

    allTasks.forEach(task => {
        if (
            !task ||
            task.completed === true ||
            !task.dueDate
        ) {
            return;
        }

        const dueTime =
            new Date(task.dueDate);

        if (Number.isNaN(dueTime.getTime())) {
            return;
        }

        const difference =
            dueTime.getTime() - now.getTime();

        if (
            difference <= 60000 &&
            difference >= -60000
        ) {
            const key =
                `pids_task_notification_${task.id}_${task.dueDate}`;

            if (
                localStorage.getItem(key) === "shown"
            ) {
                return;
            }

            showTaskNotification(task);

            localStorage.setItem(
                key,
                "shown"
            );
        }
    });
}

function showTaskNotification(task) {
    const title =
        "Task Reminder";

    const message =
        `"${task.title}" is due now.`;

    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {
        try {
            const notification =
                new Notification(
                    title,
                    {
                        body: message,
                        icon: "/favicon.ico",
                        tag: `task-${task.id}`
                    }
                );

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return;
        } catch (error) {
            console.error(
                "Browser notification error:",
                error
            );
        }
    }

    showInPageNotification(
        title,
        message
    );
}

function showInPageNotification(title, message) {
    let container =
        document.getElementById(
            "taskNotificationContainer"
        );

    if (!container) {
        container =
            document.createElement("div");

        container.id =
            "taskNotificationContainer";

        container.style.position =
            "fixed";

        container.style.top =
            "20px";

        container.style.right =
            "20px";

        container.style.zIndex =
            "99999";

        container.style.width =
            "320px";

        container.style.maxWidth =
            "calc(100vw - 40px)";

        document.body.appendChild(
            container
        );
    }

    const notification =
        document.createElement("div");

    notification.style.padding =
        "16px";

    notification.style.marginBottom =
        "10px";

    notification.style.borderRadius =
        "12px";

    notification.style.background =
        "#ffffff";

    notification.style.color =
        "#111827";

    notification.style.boxShadow =
        "0 10px 30px rgba(0,0,0,0.18)";

    notification.style.border =
        "1px solid #e5e7eb";

    notification.style.cursor =
        "pointer";

    notification.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px;">
            ${escapeHtml(title)}
        </div>
        <div style="font-size:14px;">
            ${escapeHtml(message)}
        </div>
    `;

    notification.addEventListener(
        "click",
        () => {
            notification.remove();
        }
    );

    container.appendChild(
        notification
    );

    setTimeout(() => {
        notification.remove();
    }, 10000);
}

window.filterTasks = filterTasks;
window.editTask = editTask;
window.completeTask = completeTask;
window.undoTask = undoTask;
window.toggleTaskStatus = toggleTaskStatus;
window.deleteTask = deleteTask;
window.cancelEdit = cancelEdit;
window.logout = logout;
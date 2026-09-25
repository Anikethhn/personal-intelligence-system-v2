/* =========================================================
   NORA - NOTIFICATIONS
   notifications.js
   ========================================================= */

const API_BASE_URL = "";

let allNotifications = [];
let currentFilter = "ALL";


/* =========================================================
   AUTHENTICATION
   ========================================================= */

function getNotificationToken() {
    return localStorage.getItem("pids_token");
}


function handleNotificationSessionExpired() {

    localStorage.removeItem("pids_token");

    window.location.href = "/login.html";
}


/* =========================================================
   AUTHENTICATED REQUEST
   ========================================================= */

async function notificationRequest(
    url,
    options = {}
) {

    const token = getNotificationToken();

    if (!token) {
        handleNotificationSessionExpired();
        return null;
    }

    const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    const response = await fetch(
        `${API_BASE_URL}${url}`,
        {
            ...options,
            headers
        }
    );

    if (response.status === 401) {
        handleNotificationSessionExpired();
        return null;
    }

    return response;
}


/* =========================================================
   LOAD NOTIFICATIONS
   ========================================================= */

async function loadNotifications() {

    const loadingMessage =
        document.getElementById("loadingMessage");

    const errorMessage =
        document.getElementById("errorMessage");

    if (loadingMessage) {
        loadingMessage.style.display = "block";
    }

    if (errorMessage) {
        errorMessage.style.display = "none";
        errorMessage.textContent = "";
    }

    try {

        const response =
            await notificationRequest(
                "/api/notifications"
            );

        if (!response) {
            return;
        }

        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                `Unable to load notifications. Status: ${response.status}`
            );
        }

        allNotifications =
            await response.json();

        updateSummary();

        applyCurrentFilter();

        updateSidebarCount();

    } catch (error) {

        console.error(
            "NORA notification error:",
            error
        );

        showError(
            error.message ||
            "Unable to load notifications."
        );

    } finally {

        if (loadingMessage) {
            loadingMessage.style.display = "none";
        }
    }
}


/* =========================================================
   SUMMARY
   ========================================================= */

function updateSummary() {

    const total =
        allNotifications.length;

    const unread =
        allNotifications.filter(
            notification =>
                !notification.read
        ).length;

    const highPriority =
        allNotifications.filter(
            notification =>
                notification.priority === "HIGH" ||
                notification.priority === "URGENT"
        ).length;

    setElementText(
        "totalNotifications",
        total
    );

    setElementText(
        "unreadNotifications",
        unread
    );

    setElementText(
        "highPriorityNotifications",
        highPriority
    );
}


/* =========================================================
   SIDEBAR COUNT
   ========================================================= */

function updateSidebarCount() {

    const badge =
        document.getElementById(
            "sidebarNotificationCount"
        );

    if (!badge) {
        return;
    }

    const unread =
        allNotifications.filter(
            notification =>
                !notification.read
        ).length;

    if (unread > 0) {

        badge.textContent =
            unread > 99
                ? "99+"
                : unread;

        badge.style.display =
            "inline-flex";

    } else {

        badge.style.display =
            "none";
    }
}


/* =========================================================
   FILTER
   ========================================================= */

function applyCurrentFilter() {

    let filtered =
        [...allNotifications];

    if (currentFilter === "UNREAD") {

        filtered =
            filtered.filter(
                notification =>
                    !notification.read
            );

    } else if (currentFilter === "READ") {

        filtered =
            filtered.filter(
                notification =>
                    notification.read
            );

    } else if (currentFilter === "HIGH") {

        filtered =
            filtered.filter(
                notification =>
                    notification.priority === "HIGH" ||
                    notification.priority === "URGENT"
            );
    }

    renderNotifications(filtered);
}


/* =========================================================
   RENDER NOTIFICATIONS
   ========================================================= */

function renderNotifications(
    notifications
) {

    const container =
        document.getElementById(
            "notificationsContainer"
        );

    const emptyState =
        document.getElementById(
            "emptyState"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (notifications.length === 0) {

        if (emptyState) {
            emptyState.style.display =
                "block";
        }

        return;
    }

    if (emptyState) {
        emptyState.style.display =
            "none";
    }

    notifications.forEach(
        notification => {

            container.appendChild(
                createNotificationCard(
                    notification
                )
            );
        }
    );
}


/* =========================================================
   CREATE NOTIFICATION CARD
   ========================================================= */

function createNotificationCard(
    notification
) {

    const card =
        document.createElement("article");

    card.className =
        "notification-card";

    if (!notification.read) {
        card.classList.add("unread");
    }


    /* ---------- Icon ---------- */

    const icon =
        document.createElement("div");

    icon.className =
        "notification-icon";

    icon.textContent =
        getNotificationIcon(
            notification.type
        );


    /* ---------- Main Content ---------- */

    const content =
        document.createElement("div");

    content.className =
        "notification-content";


    /* ---------- Header ---------- */

    const header =
        document.createElement("div");

    header.className =
        "notification-header";


    const title =
        document.createElement("h3");

    title.textContent =
        notification.title ||
        "Notification";


    const priority =
        document.createElement("span");

    priority.className =
        `notification-priority ${getPriorityClass(
            notification.priority
        )}`;

    priority.textContent =
        notification.priority ||
        "MEDIUM";


    header.appendChild(title);
    header.appendChild(priority);


    /* ---------- Message ---------- */

    const message =
        document.createElement("p");

    message.className =
        "notification-message";

    message.textContent =
        notification.message ||
        "";


    /* ---------- Metadata ---------- */

    const metadata =
        document.createElement("div");

    metadata.className =
        "notification-meta";


    const type =
        document.createElement("span");

    type.textContent =
        formatType(
            notification.type
        );


    const date =
        document.createElement("span");

    date.textContent =
        formatDate(
            notification.createdAt
        );


    metadata.appendChild(type);
    metadata.appendChild(date);


    if (notification.reminderTime) {

        const reminder =
            document.createElement("span");

        reminder.textContent =
            "Reminder: " +
            formatDate(
                notification.reminderTime
            );

        metadata.appendChild(
            reminder
        );
    }


    /* ---------- Actions ---------- */

    const actions =
        document.createElement("div");

    actions.className =
        "notification-actions";


    if (!notification.read) {

        const readButton =
            createActionButton(
                "Mark as Read",
                "read"
            );

        readButton.addEventListener(
            "click",
            () => {
                markNotificationAsRead(
                    notification.id
                );
            }
        );

        actions.appendChild(
            readButton
        );

    } else {

        const unreadButton =
            createActionButton(
                "Mark as Unread",
                "unread"
            );

        unreadButton.addEventListener(
            "click",
            () => {
                markNotificationAsUnread(
                    notification.id
                );
            }
        );

        actions.appendChild(
            unreadButton
        );
    }


    const deleteButton =
        createActionButton(
            "Delete",
            "delete"
        );

    deleteButton.addEventListener(
        "click",
        () => {
            deleteNotification(
                notification.id
            );
        }
    );

    actions.appendChild(
        deleteButton
    );


    /* ---------- Assemble ---------- */

    content.appendChild(header);
    content.appendChild(message);
    content.appendChild(metadata);
    content.appendChild(actions);

    card.appendChild(icon);
    card.appendChild(content);

    return card;
}


/* =========================================================
   ACTION BUTTON
   ========================================================= */

function createActionButton(
    text,
    type
) {

    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        `notification-action ${type}`;

    button.textContent =
        text;

    return button;
}


/* =========================================================
   MARK AS READ
   ========================================================= */

async function markNotificationAsRead(
    id
) {

    try {

        const response =
            await notificationRequest(
                `/api/notifications/${id}/read`,
                {
                    method: "PUT"
                }
            );

        if (!response) {
            return;
        }

        if (!response.ok) {

            throw new Error(
                "Unable to mark notification as read."
            );
        }

        await loadNotifications();

    } catch (error) {

        console.error(error);

        showError(
            error.message
        );
    }
}


/* =========================================================
   MARK AS UNREAD
   ========================================================= */

async function markNotificationAsUnread(
    id
) {

    try {

        const response =
            await notificationRequest(
                `/api/notifications/${id}/unread`,
                {
                    method: "PUT"
                }
            );

        if (!response) {
            return;
        }

        if (!response.ok) {

            throw new Error(
                "Unable to mark notification as unread."
            );
        }

        await loadNotifications();

    } catch (error) {

        console.error(error);

        showError(
            error.message
        );
    }
}


/* =========================================================
   MARK ALL AS READ
   ========================================================= */

async function markAllAsRead() {

    const unread =
        allNotifications.filter(
            notification =>
                !notification.read
        ).length;

    if (unread === 0) {
        return;
    }

    try {

        const response =
            await notificationRequest(
                "/api/notifications/read-all",
                {
                    method: "PUT"
                }
            );

        if (!response) {
            return;
        }

        if (!response.ok) {

            throw new Error(
                "Unable to mark all notifications as read."
            );
        }

        await loadNotifications();

    } catch (error) {

        console.error(error);

        showError(
            error.message
        );
    }
}


/* =========================================================
   DELETE NOTIFICATION
   ========================================================= */

async function deleteNotification(
    id
) {

    try {

        const response =
            await notificationRequest(
                `/api/notifications/${id}`,
                {
                    method: "DELETE"
                }
            );

        if (!response) {
            return;
        }

        if (!response.ok) {

            throw new Error(
                "Unable to delete notification."
            );
        }

        await loadNotifications();

    } catch (error) {

        console.error(error);

        showError(
            error.message
        );
    }
}


/* =========================================================
   ICONS
   ========================================================= */

function getNotificationIcon(type) {

    const icons = {

        TASK: "✓",

        EXPENSE: "₹",

        SUBSCRIPTION: "↻",

        DOCUMENT: "▣",

        DECISION: "◆",

        REMINDER: "⏰",

        SYSTEM: "✦"
    };

    return icons[type] || "✦";
}


/* =========================================================
   PRIORITY CLASS
   ========================================================= */

function getPriorityClass(priority) {

    switch (priority) {

        case "LOW":
            return "priority-low";

        case "MEDIUM":
            return "priority-medium";

        case "HIGH":
            return "priority-high";

        case "URGENT":
            return "priority-urgent";

        default:
            return "priority-medium";
    }
}


/* =========================================================
   FORMAT TYPE
   ========================================================= */

function formatType(type) {

    if (!type) {
        return "System";
    }

    return type
        .toLowerCase()
        .replace(
            /^[a-z]/,
            character =>
                character.toUpperCase()
        );
}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(value) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (Number.isNaN(
        date.getTime()
    )) {
        return value;
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   SAFE ELEMENT TEXT
   ========================================================= */

function setElementText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value;
    }
}


/* =========================================================
   ERROR
   ========================================================= */

function showError(message) {

    const errorMessage =
        document.getElementById(
            "errorMessage"
        );

    if (!errorMessage) {
        return;
    }

    errorMessage.textContent =
        message ||
        "Something went wrong.";

    errorMessage.style.display =
        "block";
}


/* =========================================================
   FILTER BUTTONS
   ========================================================= */

document
    .querySelectorAll(
        ".notification-filter"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".notification-filter"
                    )
                    .forEach(
                        filterButton => {
                            filterButton.classList
                                .remove("active");
                        }
                    );

                button.classList.add(
                    "active"
                );

                currentFilter =
                    button.dataset.filter ||
                    "ALL";

                applyCurrentFilter();
            }
        );
    });


/* =========================================================
   REFRESH
   ========================================================= */

const refreshButton =
    document.getElementById(
        "refreshNotifications"
    );

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        () => {
            loadNotifications();
        }
    );
}


/* =========================================================
   MARK ALL READ BUTTON
   ========================================================= */

const markAllReadButton =
    document.getElementById(
        "markAllReadButton"
    );

if (markAllReadButton) {

    markAllReadButton.addEventListener(
        "click",
        () => {
            markAllAsRead();
        }
    );
}


/* =========================================================
   LOGOUT
   ========================================================= */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "pids_token"
            );

            window.location.href =
                "/login.html";
        }
    );
}


/* =========================================================
   INITIAL LOAD
   ========================================================= */

void loadNotifications();
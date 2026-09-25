/* =========================================================
   NORA - NOTIFICATION BELL
   TEMPORARY DEBUG VERSION
   ========================================================= */

const NOTIFICATION_API = "/api/notifications";

let notificationDropdownOpen = false;


/* =========================================================
   TOKEN
   ========================================================= */

function getNotificationBellToken() {

    const token =
        localStorage.getItem("pids_token");

    console.log(
        "NORA notification token:",
        token ? "TOKEN FOUND" : "NO TOKEN FOUND"
    );

    return token;
}


/* =========================================================
   LOAD UNREAD COUNT
   ========================================================= */

async function loadNotificationBellCount() {

    const token =
        getNotificationBellToken();

    if (!token) {

        console.error(
            "NORA Authorization Error: pids_token is missing."
        );

        return;
    }

    try {

        console.log(
            "Calling:",
            `${NOTIFICATION_API}/count`
        );

        const response =
            await fetch(
                `${NOTIFICATION_API}/count`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        console.log(
            "Notification count HTTP status:",
            response.status
        );


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "NORA Authorization/Notification Error:",
                response.status,
                errorText
            );

            if (response.status === 401) {

                console.error(
                    "401 Unauthorized: JWT token is missing, expired, or invalid."
                );
            }

            if (response.status === 403) {

                console.error(
                    "403 Forbidden: Spring Security rejected this request."
                );
            }

            return;
        }


        const data =
            await response.json();


        console.log(
            "Notification count response:",
            data
        );


        updateNotificationBellCount(
            data.unreadCount || 0
        );

    } catch (error) {

        console.error(
            "Notification count request failed:",
            error
        );
    }
}


/* =========================================================
   UPDATE BELL COUNT
   ========================================================= */

function updateNotificationBellCount(count) {

    const badge =
        document.getElementById(
            "notificationBellCount"
        );

    const dropdownCount =
        document.getElementById(
            "notificationDropdownCount"
        );


    if (dropdownCount) {

        dropdownCount.textContent =
            count;
    }


    if (!badge) {

        console.warn(
            "notificationBellCount element not found."
        );

        return;
    }


    if (count > 0) {

        badge.textContent =
            count > 99
                ? "99+"
                : count;

        badge.style.display =
            "flex";

    } else {

        badge.style.display =
            "none";
    }
}


/* =========================================================
   LOAD PREVIEW
   ========================================================= */

async function loadNotificationPreview() {

    const container =
        document.getElementById(
            "notificationPreview"
        );


    if (!container) {

        console.error(
            "notificationPreview element not found."
        );

        return;
    }


    const token =
        getNotificationBellToken();


    if (!token) {

        console.error(
            "NORA Authorization Error: pids_token is missing."
        );

        container.innerHTML =
            `
            <div class="notification-preview-error">
                Authorization required. Please login again.
            </div>
            `;

        return;
    }


    container.innerHTML =
        `
        <div class="notification-preview-loading">
            Loading notifications...
        </div>
        `;


    try {

        console.log(
            "Calling:",
            `${NOTIFICATION_API}/unread`
        );


        const response =
            await fetch(
                `${NOTIFICATION_API}/unread`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        console.log(
            "Notification preview HTTP status:",
            response.status
        );


        if (!response.ok) {

            const errorText =
                await response.text();


            console.error(
                "NORA Authorization/Notification Error:",
                response.status,
                errorText
            );


            if (response.status === 401) {

                console.error(
                    "401 Unauthorized: JWT token is missing, expired, or invalid."
                );
            }


            if (response.status === 403) {

                console.error(
                    "403 Forbidden: Spring Security rejected this request."
                );
            }


            throw new Error(
                `Notification API returned HTTP ${response.status}`
            );
        }


        const notifications =
            await response.json();


        console.log(
            "Notification preview response:",
            notifications
        );


        if (
            !Array.isArray(notifications) ||
            notifications.length === 0
        ) {

            container.innerHTML =
                `
                <div class="notification-preview-empty">

                    <div>✓</div>

                    <p>
                        No new notifications
                    </p>

                </div>
                `;

            return;
        }


        container.innerHTML =
            "";


        notifications
            .slice(0, 5)
            .forEach(notification => {

                const item =
                    document.createElement("div");


                item.className =
                    "notification-preview-item";


                const icon =
                    document.createElement("div");


                icon.className =
                    "notification-preview-icon";


                icon.textContent =
                    getBellNotificationIcon(
                        notification.type
                    );


                const content =
                    document.createElement("div");


                content.className =
                    "notification-preview-content";


                const title =
                    document.createElement("strong");


                title.textContent =
                    notification.title ||
                    "Notification";


                const message =
                    document.createElement("p");


                message.textContent =
                    notification.message ||
                    "";


                content.appendChild(
                    title
                );

                content.appendChild(
                    message
                );


                item.appendChild(
                    icon
                );

                item.appendChild(
                    content
                );


                item.addEventListener(
                    "click",
                    () => {

                        markBellNotificationRead(
                            notification.id
                        );

                    }
                );


                container.appendChild(
                    item
                );

            });


    } catch (error) {

        console.error(
            "Notification preview error:",
            error
        );


        container.innerHTML =
            `
            <div class="notification-preview-error">
                Unable to load notifications.
            </div>
            `;
    }
}


/* =========================================================
   MARK PREVIEW NOTIFICATION AS READ
   ========================================================= */

async function markBellNotificationRead(id) {

    const token =
        getNotificationBellToken();


    if (!token) {

        console.error(
            "NORA Authorization Error: pids_token is missing."
        );

        return;
    }


    try {

        console.log(
            "Marking notification as read:",
            id
        );


        const response =
            await fetch(
                `${NOTIFICATION_API}/${id}/read`,
                {
                    method: "PUT",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        console.log(
            "Mark notification HTTP status:",
            response.status
        );


        if (!response.ok) {

            const errorText =
                await response.text();


            console.error(
                "Unable to mark notification as read:",
                response.status,
                errorText
            );

            return;
        }


        await loadNotificationBellCount();

        await loadNotificationPreview();


    } catch (error) {

        console.error(
            "Unable to mark notification as read:",
            error
        );
    }
}


/* =========================================================
   ICON
   ========================================================= */

function getBellNotificationIcon(type) {

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
   TOGGLE DROPDOWN
   ========================================================= */

function toggleNotificationDropdown() {

    const dropdown =
        document.getElementById(
            "notificationDropdown"
        );


    if (!dropdown) {

        console.error(
            "notificationDropdown element not found."
        );

        return;
    }


    notificationDropdownOpen =
        !notificationDropdownOpen;


    if (notificationDropdownOpen) {

        dropdown.style.display =
            "block";


        loadNotificationPreview();


    } else {

        dropdown.style.display =
            "none";
    }
}


/* =========================================================
   BELL CLICK
   ========================================================= */

const notificationBell =
    document.getElementById(
        "notificationBell"
    );


if (notificationBell) {

    notificationBell.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleNotificationDropdown();

        }
    );

} else {

    console.warn(
        "notificationBell element not found."
    );
}


/* =========================================================
   CLOSE WHEN CLICKING OUTSIDE
   ========================================================= */

document.addEventListener(
    "click",
    event => {

        const wrapper =
            document.querySelector(
                ".notification-header-wrapper"
            );


        if (
            notificationDropdownOpen &&
            wrapper &&
            !wrapper.contains(
                event.target
            )
        ) {

            const dropdown =
                document.getElementById(
                    "notificationDropdown"
                );


            if (dropdown) {

                dropdown.style.display =
                    "none";
            }


            notificationDropdownOpen =
                false;
        }
    }
);


/* =========================================================
   INITIAL LOAD
   ========================================================= */

void loadNotificationBellCount();


/* =========================================================
   REFRESH COUNT EVERY 30 SECONDS
   ========================================================= */

setInterval(
    loadNotificationBellCount,
    30000
);
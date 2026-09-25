

const API_BASE_URL = "";

const token =
    localStorage.getItem("pids_token");

if (!token) {

    window.location.href =
        "/login.html";
}


const pendingTasksElement =
    document.getElementById("pendingTasks");

const completedTasksElement =
    document.getElementById("completedTasks");

const highPriorityTasksElement =
    document.getElementById("highPriorityTasks");

const totalTasksElement =
    document.getElementById("totalTasks");

const dashboardTasksElement =
    document.getElementById("dashboardTasks");

const dashboardExpenseElement =
    document.getElementById("dashboardExpense");

const logoutButton =
    document.getElementById("logoutButton");


async function authenticatedFetch(
    url,
    options = {}
) {

    const currentToken =
        localStorage.getItem("pids_token");

    if (!currentToken) {

        window.location.href =
            "/login.html";

        return null;
    }

    const headers = {
        ...(options.headers || {}),
        "Authorization":
            `Bearer ${currentToken}`
    };

    return fetch(
        url,
        {
            ...options,
            headers: headers
        }
    );
}


async function loadDashboard() {

    try {

        await Promise.all([
            loadTaskSummary(),
            loadRecentTasks(),
            loadExpenseSummary()
        ]);

    } catch (error) {

        console.error(
            "NORA dashboard loading error:",
            error
        );
    }
}


async function loadTaskSummary() {

    try {



        const url =
            `${API_BASE_URL}/api/dashboard/summary`;

        const response =
            await authenticatedFetch(url);

        if (!response) {
            return;
        }




        if (response.status === 401) {

            handleSessionExpired(
                url,
                response.status
            );

            return;
        }


        if (response.status === 403) {

            handleAuthorizationError(
                url,
                response.status
            );

            return;
        }


        if (!response.ok) {

            throw new Error(
                `Failed to load task summary (${response.status})`
            );
        }


        const data =
            await response.json();


        if (totalTasksElement) {

            totalTasksElement.textContent =
                data.totalTasks ?? 0;
        }


        if (completedTasksElement) {

            completedTasksElement.textContent =
                data.completedTasks ?? 0;
        }


        if (pendingTasksElement) {

            pendingTasksElement.textContent =
                data.pendingTasks ?? 0;
        }


        if (highPriorityTasksElement) {

            highPriorityTasksElement.textContent =
                data.highPriorityTasks ?? 0;
        }

    } catch (error) {

        console.error(
            "NORA task summary error:",
            error
        );


        setElementValue(
            totalTasksElement,
            0
        );

        setElementValue(
            completedTasksElement,
            0
        );

        setElementValue(
            pendingTasksElement,
            0
        );

        setElementValue(
            highPriorityTasksElement,
            0
        );
    }
}


async function loadRecentTasks() {

    if (!dashboardTasksElement) {
        return;
    }


    try {

        const url =
            `${API_BASE_URL}/api/tasks`;

        const response =
            await authenticatedFetch(url);

        if (!response) {
            return;
        }



        if (response.status === 401) {

            handleSessionExpired(
                url,
                response.status
            );

            return;
        }



        if (response.status === 403) {

            handleAuthorizationError(
                url,
                response.status
            );

            return;
        }


        if (!response.ok) {

            throw new Error(
                `Failed to load tasks (${response.status})`
            );
        }


        const tasks =
            await response.json();


        dashboardTasksElement.innerHTML =
            "";


        if (!Array.isArray(tasks) ||
            tasks.length === 0) {

            dashboardTasksElement.innerHTML = `
<div class="empty-state">
    <h3>No tasks yet</h3>
<p>Create your first task to get started with NORA.</p>
</div>
`;

            return;
        }



        const sortedTasks =
            [...tasks].sort(
                (a, b) => {

                    const dateA =
                        new Date(
                            a.createdAt ||
                            a.dueDate ||
                            0
                        );

                    const dateB =
                        new Date(
                            b.createdAt ||
                            b.dueDate ||
                            0
                        );

                    return dateB - dateA;
                }
            );


        const recentTasks =
            sortedTasks.slice(0, 5);


        recentTasks.forEach(
            task => {

                dashboardTasksElement.appendChild(
                    createTaskElement(task)
                );
            }
        );


    } catch (error) {

        console.error(
            "NORA recent tasks error:",
            error
        );


        dashboardTasksElement.innerHTML = `
<div class="empty-state">
    <h3>Unable to load tasks</h3>
<p>Please refresh the page and try again.</p>
</div>
`;
    }
}




function createTaskElement(task) {

    const row =
        document.createElement("div");

    row.className =
        "task-row";


    const check =
        document.createElement("div");

    check.className =
        "task-check";


    if (task.completed) {

        check.style.background =
            "rgba(34, 197, 94, 0.20)";

        check.style.borderColor =
            "#22c55e";

        check.textContent =
            "✓";

        check.style.color =
            "#86efac";

        check.style.display =
            "flex";

        check.style.alignItems =
            "center";

        check.style.justifyContent =
            "center";

        check.style.fontSize =
            "11px";
    }


    const info =
        document.createElement("div");

    info.className =
        "task-info";


    const title =
        document.createElement("strong");

    title.textContent =
        task.title || "Untitled Task";


    if (task.completed) {

        title.style.textDecoration =
            "line-through";

        title.style.color =
            "var(--text-muted)";
    }


    const meta =
        document.createElement("small");

    meta.textContent =
        getTaskMeta(task);


    info.appendChild(title);

    info.appendChild(meta);


    const priority =
        document.createElement("span");

    priority.className =
        "priority " +
        getPriorityClass(task.priority);

    priority.textContent =
        task.priority || "LOW";


    row.appendChild(check);

    row.appendChild(info);

    row.appendChild(priority);


    return row;
}


function getTaskMeta(task) {

    const parts = [];


    if (task.dueDate) {

        parts.push(
            `Due: ${formatDate(task.dueDate)}`
        );
    }


    if (task.completed) {

        parts.push(
            "Completed"
        );

    } else {

        parts.push(
            "Pending"
        );
    }


    return parts.join(" • ");
}


function getPriorityClass(priority) {

    if (!priority) {
        return "low";
    }


    const value =
        String(priority).toLowerCase();


    if (value === "high") {
        return "high";
    }


    if (value === "medium") {
        return "medium";
    }


    return "low";
}


async function loadExpenseSummary() {

    if (!dashboardExpenseElement) {
        return;
    }


    try {

        const url =
            `${API_BASE_URL}/api/expenses`;

        const response =
            await authenticatedFetch(url);

        if (!response) {
            return;
        }


        if (response.status === 401) {

            handleSessionExpired(
                url,
                response.status
            );

            return;
        }


        if (response.status === 403) {

            handleAuthorizationError(
                url,
                response.status
            );

            return;
        }


        if (!response.ok) {

            throw new Error(
                `Failed to load expenses (${response.status})`
            );
        }


        const expenses =
            await response.json();


        if (!Array.isArray(expenses) ||
            expenses.length === 0) {

            dashboardExpenseElement.innerHTML = `
<div class="empty-state">
    <h3>No expenses yet</h3>
<p>Your expense information will appear here.</p>
</div>
`;

            return;
        }


        let total =
            0;


        expenses.forEach(
            expense => {

                const amount =
                    Number(
                        expense.amount
                    );

                if (!Number.isNaN(amount)) {

                    total += amount;
                }
            }
        );


        const sortedExpenses =
            [...expenses].sort(
                (a, b) => {

                    const dateA =
                        new Date(
                            a.expenseDate ||
                            a.createdAt ||
                            0
                        );

                    const dateB =
                        new Date(
                            b.expenseDate ||
                            b.createdAt ||
                            0
                        );

                    return dateB - dateA;
                }
            );

        const recentExpenses =
            sortedExpenses.slice(0, 5);


        dashboardExpenseElement.innerHTML =
            "";


        const totalElement =
            document.createElement("div");

        totalElement.className =
            "expense-total";

        totalElement.textContent =
            formatCurrency(total);


        dashboardExpenseElement.appendChild(
            totalElement
        );


        recentExpenses.forEach(
            expense => {

                dashboardExpenseElement.appendChild(
                    createExpenseElement(expense)
                );
            }
        );


    } catch (error) {

        console.error(
            "NORA expense summary error:",
            error
        );


        dashboardExpenseElement.innerHTML = `
<div class="empty-state">
    <h3>Unable to load expenses</h3>
<p>Please refresh the page and try again.</p>
</div>
`;
    }
}


function createExpenseElement(expense) {

    const row =
        document.createElement("div");

    row.className =
        "expense-entry";


    const info =
        document.createElement("div");


    const description =
        document.createElement("strong");

    description.textContent =
        expense.description ||
        expense.category ||
        "Expense";


    const meta =
        document.createElement("small");


    const category =
        expense.category ||
        "Other";


    const date =
        expense.expenseDate
            ? formatDate(expense.expenseDate)
            : "";


    meta.textContent =
        date
            ? `${category} • ${date}`
            : category;


    info.appendChild(
        description
    );

    info.appendChild(
        meta
    );


    const amount =
        document.createElement("span");

    amount.className =
        "amount";


    const numericAmount =
        Number(
            expense.amount
        );


    amount.textContent =
        formatCurrency(
            Number.isNaN(numericAmount)
                ? 0
                : numericAmount
        );


    row.appendChild(info);

    row.appendChild(amount);


    return row;
}


function formatCurrency(amount) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    ).format(amount);
}



function formatDate(dateValue) {

    if (!dateValue) {
        return "";
    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            dateValue
        );
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


function setElementValue(
    element,
    value
) {

    if (element) {

        element.textContent =
            value;
    }
}


function handleSessionExpired(
    url,
    status
) {

    console.error(
        "NORA session authentication failed:",
        {
            endpoint: url,
            status: status
        }
    );


    localStorage.removeItem(
        "pids_token"
    );


    alert(
        "Your NORA session has expired or the authentication token is invalid.\n\n" +
        "Status: " + status + "\n" +
        "Endpoint: " + url + "\n\n" +
        "Please sign in again."
    );


    window.location.href =
        "/login.html";
}


function handleAuthorizationError(
    url,
    status
) {

    console.error(
        "NORA authorization error:",
        {
            endpoint: url,
            status: status
        }
    );


    alert(
        "NORA authorization error.\n\n" +
        "Status: " + status + "\n" +
        "Endpoint: " + url + "\n\n" +
        "The JWT was received, but the server refused access.\n" +
        "Your login token was NOT deleted."
    );
}


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


document.addEventListener(
    "DOMContentLoaded",
    () => {

        const currentToken =
            localStorage.getItem(
                "pids_token"
            );


        if (!currentToken) {

            window.location.href =
                "/login.html";

            return;
        }


        void loadDashboard();
    }
);


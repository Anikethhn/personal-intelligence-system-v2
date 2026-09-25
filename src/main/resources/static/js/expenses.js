/* =========================================================
   NORA - EXPENSES
   expenses.js
   ========================================================= */

const API_BASE_URL = "";


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let expenses = [];

let currentFilter = "ALL";

let editingExpenseId = null;


/* =========================================================
   AUTHENTICATION
   ========================================================= */

function getAuthToken() {

    return localStorage.getItem(
        "pids_token"
    );
}


function checkAuthentication() {

    const token =
        getAuthToken();

    if (!token) {

        window.location.href =
            "/login.html";

        return false;
    }

    return true;
}


/* =========================================================
   AUTHENTICATED FETCH
   ========================================================= */

async function authenticatedFetch(
    url,
    options = {}
) {

    const token =
        getAuthToken();


    if (!token) {

        window.location.href =
            "/login.html";

        return null;
    }


    const headers = {
        ...(options.headers || {}),
        "Authorization":
            `Bearer ${token}`
    };


    return fetch(
        url,
        {
            ...options,
            headers: headers
        }
    );
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (!checkAuthentication()) {
            return;
        }


        loadExpenses();


        const form =
            document.getElementById(
                "expenseForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                handleExpenseSubmit
            );
        }


        const categoryFilter =
            document.getElementById(
                "categoryFilter"
            );


        if (categoryFilter) {

            categoryFilter.addEventListener(
                "change",
                () => {

                    currentFilter =
                        categoryFilter.value;

                    renderExpenses();
                }
            );
        }


        const logoutButton =
            document.getElementById(
                "logoutButton"
            );


        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                logout
            );
        }
    }
);


/* =========================================================
   LOAD EXPENSES
   ========================================================= */

async function loadExpenses() {

    const loading =
        document.getElementById(
            "loading"
        );

    const container =
        document.getElementById(
            "expensesContainer"
        );

    const emptyState =
        document.getElementById(
            "emptyState"
        );


    if (loading) {

        loading.style.display =
            "block";
    }


    if (container) {

        container.innerHTML =
            "";
    }


    if (emptyState) {

        emptyState.style.display =
            "none";
    }


    try {

        const response =
            await authenticatedFetch(
                `${API_BASE_URL}/api/expenses`
            );


        if (!response) {
            return;
        }


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            handleSessionExpired();

            return;
        }


        if (!response.ok) {

            const message =
                await response.text();

            throw new Error(
                message ||
                `Failed to load expenses (${response.status})`
            );
        }


        const data =
            await response.json();


        expenses =
            Array.isArray(data)
                ? data
                : [];


        updateStatistics();

        updateCategoryFilter();

        renderExpenses();


    } catch (error) {

        console.error(
            "NORA expenses loading error:",
            error
        );


        if (container) {

            container.innerHTML = `
                <div class="empty-state">
                    <h3>Unable to load expenses</h3>
                    <p>${escapeHtml(
                error.message ||
                "Please refresh the page and try again."
            )}</p>
                </div>
            `;
        }

    } finally {

        if (loading) {

            loading.style.display =
                "none";
        }
    }
}


/* =========================================================
   HANDLE EXPENSE SUBMIT
   ========================================================= */

async function handleExpenseSubmit(
    event
) {

    event.preventDefault();


    const amount =
        getValue("amount");

    const category =
        getValue("category");

    const description =
        getValue("description");

    const expenseDate =
        getValue("expenseDate");


    /*
     * Validation
     */

    if (!amount) {

        alert(
            "Please enter the expense amount."
        );

        return;
    }


    const numericAmount =
        Number(amount);


    if (
        !Number.isFinite(
            numericAmount
        ) ||
        numericAmount <= 0
    ) {

        alert(
            "Please enter a valid expense amount."
        );

        return;
    }


    if (!category) {

        alert(
            "Please select an expense category."
        );

        return;
    }


    if (!expenseDate) {

        alert(
            "Please select the expense date."
        );

        return;
    }


    const expenseData = {

        amount:
        numericAmount,

        category:
        category,

        description:
            description || null,

        expenseDate:
        expenseDate
    };


    const isEditing =
        editingExpenseId !== null &&
        editingExpenseId !== "";


    const saveButton =
        document.getElementById(
            "addExpenseButton"
        );


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            isEditing
                ? "Updating..."
                : "Adding...";
    }


    try {

        let response;


        if (isEditing) {

            response =
                await authenticatedFetch(
                    `${API_BASE_URL}/api/expenses/${editingExpenseId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                expenseData
                            )
                    }
                );

        } else {

            response =
                await authenticatedFetch(
                    `${API_BASE_URL}/api/expenses`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                expenseData
                            )
                    }
                );
        }


        if (!response) {
            return;
        }


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            handleSessionExpired();

            return;
        }


        if (!response.ok) {

            const message =
                await response.text();

            throw new Error(
                message ||
                "Unable to save expense."
            );
        }


        /*
         * Reset form
         */

        resetExpenseForm();


        await loadExpenses();


    } catch (error) {

        console.error(
            "NORA expense save error:",
            error
        );


        alert(
            error.message ||
            "Unable to save expense. Please try again."
        );


    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Add Expense";
        }
    }
}


/* =========================================================
   RENDER EXPENSES
   ========================================================= */

function renderExpenses() {

    const container =
        document.getElementById(
            "expensesContainer"
        );

    const emptyState =
        document.getElementById(
            "emptyState"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    let filteredExpenses =
        [...expenses];


    /*
     * Category filter
     */

    if (
        currentFilter &&
        currentFilter !== "ALL"
    ) {

        filteredExpenses =
            filteredExpenses.filter(
                expense =>
                    String(
                        expense.category || ""
                    ).toLowerCase() ===
                    String(
                        currentFilter
                    ).toLowerCase()
            );
    }


    /*
     * Newest first
     */

    filteredExpenses.sort(
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


    /*
     * Empty state
     */

    if (
        filteredExpenses.length === 0
    ) {

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


    filteredExpenses.forEach(
        expense => {

            const element =
                createExpenseElement(
                    expense
                );


            container.appendChild(
                element
            );
        }
    );
}


/* =========================================================
   CREATE EXPENSE ELEMENT
   ========================================================= */

function createExpenseElement(
    expense
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "expense-card";


    /*
     * Main content
     */

    const main =
        document.createElement(
            "div"
        );


    main.className =
        "expense-main";


    const category =
        document.createElement(
            "span"
        );


    category.className =
        "expense-category";


    category.textContent =
        expense.category ||
        "Other";


    const description =
        document.createElement(
            "h3"
        );


    description.textContent =
        expense.description ||
        "No description";


    const date =
        document.createElement(
            "p"
        );


    date.className =
        "expense-date";


    date.textContent =
        expense.expenseDate
            ? formatDate(
                expense.expenseDate
            )
            : "No date";


    main.appendChild(
        category
    );

    main.appendChild(
        description
    );

    main.appendChild(
        date
    );


    /*
     * Right side
     */

    const right =
        document.createElement(
            "div"
        );


    right.className =
        "expense-right";


    const amount =
        document.createElement(
            "strong"
        );


    amount.className =
        "expense-amount";


    const numericAmount =
        Number(
            expense.amount
        );


    amount.textContent =
        formatCurrency(
            Number.isFinite(
                numericAmount
            )
                ? numericAmount
                : 0
        );


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "expense-actions";


    /*
     * Edit button
     */

    const editButton =
        document.createElement(
            "button"
        );


    editButton.type =
        "button";

    editButton.className =
        "btn-secondary";

    editButton.textContent =
        "Edit";


    editButton.addEventListener(
        "click",
        () => {

            editExpense(
                expense.id
            );
        }
    );


    /*
     * Delete button
     */

    const deleteButton =
        document.createElement(
            "button"
        );


    deleteButton.type =
        "button";

    deleteButton.className =
        "btn-danger";

    deleteButton.textContent =
        "Delete";


    deleteButton.addEventListener(
        "click",
        () => {

            deleteExpense(
                expense.id
            );
        }
    );


    actions.appendChild(
        editButton
    );

    actions.appendChild(
        deleteButton
    );


    right.appendChild(
        amount
    );

    right.appendChild(
        actions
    );


    card.appendChild(
        main
    );

    card.appendChild(
        right
    );


    return card;
}


/* =========================================================
   EDIT EXPENSE
   ========================================================= */

function editExpense(id) {

    const expense =
        expenses.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!expense) {

        alert(
            "Expense not found."
        );

        return;
    }


    editingExpenseId =
        expense.id;


    setValue(
        "amount",
        expense.amount
    );

    setValue(
        "category",
        expense.category
    );

    setValue(
        "description",
        expense.description
    );

    setValue(
        "expenseDate",
        expense.expenseDate
    );


    const addButton =
        document.getElementById(
            "addExpenseButton"
        );


    if (addButton) {

        addButton.textContent =
            "Update Expense";
    }


    const cancelButton =
        document.getElementById(
            "cancelEditButton"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "inline-flex";
    }


    /*
     * Scroll to form
     */

    const form =
        document.getElementById(
            "expenseForm"
        );


    if (form) {

        form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


/* =========================================================
   CANCEL EDIT
   ========================================================= */

function cancelEdit() {

    resetExpenseForm();
}


/* =========================================================
   RESET EXPENSE FORM
   ========================================================= */

function resetExpenseForm() {

    editingExpenseId =
        null;


    const form =
        document.getElementById(
            "expenseForm"
        );


    if (form) {

        form.reset();
    }


    /*
     * Set today's date after reset
     */

    const dateInput =
        document.getElementById(
            "expenseDate"
        );


    if (dateInput) {

        dateInput.value =
            getTodayDate();
    }


    const addButton =
        document.getElementById(
            "addExpenseButton"
        );


    if (addButton) {

        addButton.textContent =
            "Add Expense";
    }


    const cancelButton =
        document.getElementById(
            "cancelEditButton"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "none";
    }
}


/* =========================================================
   DELETE EXPENSE
   ========================================================= */

async function deleteExpense(id) {

    const expense =
        expenses.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    const description =
        expense?.description ||
        expense?.category ||
        "this expense";


    const confirmed =
        confirm(
            `Are you sure you want to delete "${description}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await authenticatedFetch(
                `${API_BASE_URL}/api/expenses/${id}`,
                {
                    method: "DELETE"
                }
            );


        if (!response) {
            return;
        }


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            handleSessionExpired();

            return;
        }


        if (!response.ok) {

            const message =
                await response.text();

            throw new Error(
                message ||
                "Unable to delete expense."
            );
        }


        await loadExpenses();


    } catch (error) {

        console.error(
            "NORA expense delete error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete expense."
        );
    }
}


/* =========================================================
   UPDATE STATISTICS
   ========================================================= */

function updateStatistics() {

    const totalExpenseElement =
        document.getElementById(
            "totalExpense"
        );

    const transactionCountElement =
        document.getElementById(
            "transactionCount"
        );

    const averageExpenseElement =
        document.getElementById(
            "averageExpense"
        );

    const monthlyExpenseElement =
        document.getElementById(
            "monthlyExpense"
        );


    let total =
        0;


    expenses.forEach(
        expense => {

            const amount =
                Number(
                    expense.amount
                );


            if (
                Number.isFinite(
                    amount
                )
            ) {

                total += amount;
            }
        }
    );


    const transactionCount =
        expenses.length;


    const average =
        transactionCount > 0
            ? total / transactionCount
            : 0;


    /*
     * Current month
     */

    const now =
        new Date();


    const currentYear =
        now.getFullYear();


    const currentMonth =
        now.getMonth();


    let monthlyTotal =
        0;


    expenses.forEach(
        expense => {

            if (!expense.expenseDate) {
                return;
            }


            const date =
                new Date(
                    expense.expenseDate
                );


            if (
                date.getFullYear() ===
                currentYear &&
                date.getMonth() ===
                currentMonth
            ) {

                const amount =
                    Number(
                        expense.amount
                    );


                if (
                    Number.isFinite(
                        amount
                    )
                ) {

                    monthlyTotal +=
                        amount;
                }
            }
        }
    );


    if (totalExpenseElement) {

        totalExpenseElement.textContent =
            formatCurrency(total);
    }


    if (transactionCountElement) {

        transactionCountElement.textContent =
            transactionCount;
    }


    if (averageExpenseElement) {

        averageExpenseElement.textContent =
            formatCurrency(average);
    }


    if (monthlyExpenseElement) {

        monthlyExpenseElement.textContent =
            formatCurrency(
                monthlyTotal
            );
    }
}


/* =========================================================
   UPDATE CATEGORY FILTER
   ========================================================= */

function updateCategoryFilter() {

    const filter =
        document.getElementById(
            "categoryFilter"
        );


    if (!filter) {
        return;
    }


    const categories =
        [
            ...new Set(
                expenses
                    .map(
                        expense =>
                            expense.category
                    )
                    .filter(Boolean)
            )
        ]
            .sort(
                (a, b) =>
                    String(a).localeCompare(
                        String(b)
                    )
            );


    const previousValue =
        currentFilter;


    filter.innerHTML = `
        <option value="ALL">
            All Categories
        </option>
    `;


    categories.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                category;


            option.textContent =
                category;


            filter.appendChild(
                option
            );
        }
    );


    /*
     * Preserve current filter
     */

    const exists =
        categories.some(
            category =>
                String(category) ===
                String(previousValue)
        );


    if (
        previousValue !== "ALL" &&
        exists
    ) {

        filter.value =
            previousValue;

    } else {

        filter.value =
            "ALL";

        currentFilter =
            "ALL";
    }
}


/* =========================================================
   FORMAT CURRENCY
   ========================================================= */

function formatCurrency(
    amount
) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    ).format(
        Number.isFinite(amount)
            ? amount
            : 0
    );
}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(
    dateValue
) {

    if (!dateValue) {
        return "";
    }


    /*
     * Avoid timezone shifting for YYYY-MM-DD
     */

    if (
        typeof dateValue === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(
            dateValue
        )
    ) {

        const [
            year,
            month,
            day
        ] =
            dateValue.split("-");


        return `${day} ${getMonthName(
            Number(month)
        )} ${year}`;
    }


    const date =
        new Date(
            dateValue
        );


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


/* =========================================================
   MONTH NAME
   ========================================================= */

function getMonthName(
    month
) {

    const months = [

        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"

    ];


    return months[
    month - 1
        ] || "";
}


/* =========================================================
   TODAY DATE
   ========================================================= */

function getTodayDate() {

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;
}


/* =========================================================
   FORM HELPERS
   ========================================================= */

function getValue(id) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return "";
    }


    return element.value.trim();
}


function setValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.value =
        value ?? "";
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

    localStorage.removeItem(
        "pids_token"
    );


    window.location.href =
        "/login.html";
}


/* =========================================================
   SESSION EXPIRED
   ========================================================= */

function handleSessionExpired() {

    localStorage.removeItem(
        "pids_token"
    );


    alert(
        "Your NORA session has expired. Please sign in again."
    );


    window.location.href =
        "/login.html";
}
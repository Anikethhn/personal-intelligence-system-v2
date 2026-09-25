const API_BASE_URL = "";

let subscriptions = [];
let currentFilter = "ALL";
let currentCategory = "ALL";
let editingSubscriptionId = null;


/* =========================================================
   AUTHENTICATION
   ========================================================= */

function getAuthToken() {
    return localStorage.getItem("pids_token");
}

function redirectToLogin() {
    localStorage.removeItem("pids_token");
    window.location.href = "/login.html";
}

function checkAuthentication() {
    if (getAuthToken()) {
        return true;
    }

    redirectToLogin();
    return false;
}


/* =========================================================
   API
   ========================================================= */

async function authenticatedFetch(url, options = {}) {

    const token = getAuthToken();

    if (!token) {
        redirectToLogin();
        return null;
    }

    return fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        }
    });
}


async function apiRequest(
    url,
    options = {},
    errorMessage = "Request failed."
) {

    const response =
        await authenticatedFetch(
            url,
            options
        );

    if (!response) {
        return null;
    }

    if (response.status === 401 || response.status === 403) {

        alert(
            "Authentication error: " +
            response.status +
            "\nAPI: " +
            response.url
        );

        return;
    }

    if (!response.ok) {

        let message = errorMessage;

        try {
            const text = await response.text();

            if (text) {
                message = text;
            }
        } catch {
            // Keep fallback message.
        }

        throw new Error(message);
    }

    return response;
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

        void loadSubscriptions();

        setupForm();
        setupFilters();
        setupLogout();
    }
);


function setupForm() {

    const form =
        document.getElementById(
            "subscriptionForm"
        );

    if (form) {
        form.addEventListener(
            "submit",
            handleSubscriptionSubmit
        );
    }


    const cancelButton =
        document.getElementById(
            "cancelEditButton"
        );

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            resetSubscriptionForm
        );
    }
}


function setupFilters() {

    const filter =
        document.getElementById(
            "subscriptionFilter"
        );

    if (filter) {

        filter.addEventListener(
            "change",
            () => {

                currentFilter =
                    filter.value || "ALL";

                renderSubscriptions();
            }
        );
    }


    document
        .querySelectorAll(
            ".filter-btn[data-category]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    currentCategory =
                        button.dataset.category ||
                        "ALL";

                    document
                        .querySelectorAll(
                            ".filter-btn[data-category]"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );

                    button.classList.add(
                        "active"
                    );

                    renderSubscriptions();
                }
            );
        });
}


function setupLogout() {

    const button =
        document.getElementById(
            "logoutButton"
        );

    if (button) {
        button.addEventListener(
            "click",
            logout
        );
    }
}


/* =========================================================
   LOAD
   ========================================================= */

async function loadSubscriptions() {

    setLoading(true);
    clearContainer();

    try {

        const response =
            await apiRequest(
                `${API_BASE_URL}/api/subscriptions`,
                {},
                "Unable to load subscriptions."
            );

        if (!response) {
            return;
        }

        const data =
            await response.json();

        subscriptions =
            Array.isArray(data)
                ? data
                : [];

        updateStatistics();
        updateCategoryButtons();
        renderSubscriptions();

    } catch (error) {

        console.error(
            "NORA subscriptions loading error:",
            error
        );

        showError(
            error.message ||
            "Unable to load subscriptions."
        );

    } finally {

        setLoading(false);
    }
}


/* =========================================================
   CREATE / UPDATE
   ========================================================= */

async function handleSubscriptionSubmit(event) {

    event.preventDefault();

    const data =
        getSubscriptionFormData();

    if (!data) {
        return;
    }


    const editing =
        editingSubscriptionId !== null;


    const button =
        document.getElementById(
            "saveSubscriptionButton"
        );


    setButtonState(
        button,
        true,
        editing
            ? "Updating..."
            : "Saving..."
    );


    try {

        const url =
            editing
                ? `${API_BASE_URL}/api/subscriptions/${editingSubscriptionId}`
                : `${API_BASE_URL}/api/subscriptions`;


        const method =
            editing
                ? "PUT"
                : "POST";


        const response =
            await apiRequest(
                url,
                {
                    method: method,
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify(data)
                },
                "Unable to save subscription."
            );


        if (!response) {
            return;
        }


        resetSubscriptionForm();

        await loadSubscriptions();

    } catch (error) {

        console.error(
            "NORA subscription save error:",
            error
        );

        alert(
            error.message ||
            "Unable to save subscription."
        );

    } finally {

        setButtonState(
            button,
            false,
            "Save Subscription"
        );
    }
}


function getSubscriptionFormData() {

    const name =
        getValue("name");

    const amount =
        Number(
            getValue("amount")
        );

    const billingCycle =
        getValue("billingCycle");

    const nextBillingDate =
        getValue("nextBillingDate");

    const category =
        getValue("category");

    const description =
        getValue("description");


    const activeElement =
        document.getElementById("active");


    const active =
        activeElement
            ? activeElement.checked
            : true;


    if (!name) {

        alert(
            "Please enter a subscription name."
        );

        return null;
    }


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        alert(
            "Please enter a valid subscription amount."
        );

        return null;
    }


    if (!billingCycle) {

        alert(
            "Please select a billing cycle."
        );

        return null;
    }


    if (!nextBillingDate) {

        alert(
            "Please select the next billing date."
        );

        return null;
    }


    return {
        name: name,
        amount: amount,
        billingCycle: billingCycle,
        nextBillingDate: nextBillingDate,
        category: category || null,
        description: description || null,
        active: active
    };
}


/* =========================================================
   RENDER
   ========================================================= */

function renderSubscriptions() {

    const container =
        document.getElementById(
            "subscriptionsContainer"
        );

    const emptyState =
        document.getElementById(
            "emptyState"
        );


    if (!container) {
        return;
    }


    const filtered =
        subscriptions
            .filter(matchesFilters)
            .sort(sortSubscriptions);


    container.innerHTML = "";


    if (!filtered.length) {

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


    filtered.forEach(
        subscription =>
            container.appendChild(
                createSubscriptionCard(
                    subscription
                )
            )
    );
}


function matchesFilters(subscription) {

    const statusMatch =
        currentFilter === "ALL" ||
        (
            currentFilter === "ACTIVE" &&
            subscription.active === true
        ) ||
        (
            currentFilter === "INACTIVE" &&
            subscription.active === false
        );


    const selectedCategory =
        String(
            currentCategory || "ALL"
        ).toLowerCase();


    const category =
        String(
            subscription.category || ""
        ).toLowerCase();


    return (
        statusMatch &&
        (
            selectedCategory === "all" ||
            selectedCategory === category
        )
    );
}


function sortSubscriptions(a, b) {

    const first =
        new Date(
            a.nextBillingDate ||
            a.createdAt ||
            0
        );

    const second =
        new Date(
            b.nextBillingDate ||
            b.createdAt ||
            0
        );

    return first - second;
}


/* =========================================================
   CARD
   ========================================================= */

function createSubscriptionCard(subscription) {

    const card =
        document.createElement("div");

    card.className =
        "subscription-card";


    if (subscription.active === false) {
        card.classList.add("inactive");
    }


    const header =
        document.createElement("div");

    header.className =
        "subscription-card-header";


    const title =
        document.createElement("h3");

    title.textContent =
        subscription.name ||
        "Unnamed Subscription";


    const status =
        document.createElement("span");

    status.className =
        subscription.active
            ? "subscription-status active"
            : "subscription-status inactive";

    status.textContent =
        subscription.active
            ? "Active"
            : "Inactive";


    header.append(
        title,
        status
    );


    const amount =
        document.createElement("div");

    amount.className =
        "subscription-amount";

    const numericAmount =
        Number(
            subscription.amount
        );

    amount.textContent =
        formatCurrency(
            Number.isFinite(numericAmount)
                ? numericAmount
                : 0
        );


    const cycle =
        document.createElement("p");

    cycle.className =
        "subscription-cycle";

    cycle.textContent =
        `Billed ${formatBillingCycle(
    subscription.billingCycle
)}`;


    const nextBilling =
        document.createElement("p");

    nextBilling.className =
        "subscription-next-billing";

    nextBilling.textContent =
        subscription.nextBillingDate
            ? `Next billing: ${formatDate(
    subscription.nextBillingDate
)}`
            : "Next billing date not set";


    addOptionalText(
        card,
        subscription.category,
        "subscription-category",
        "span"
    );


    addOptionalText(
        card,
        subscription.description,
        "subscription-description",
        "p"
    );


    const actions =
        document.createElement("div");

    actions.className =
        "subscription-actions";


    actions.append(
        createActionButton(
            "Edit",
            "btn-secondary",
            () =>
                editSubscription(
                    subscription.id
                )
        ),

        createActionButton(
            subscription.active
                ? "Deactivate"
                : "Activate",
            "btn-secondary",
            () =>
                void toggleSubscription(
                    subscription.id
                )
        ),

        createActionButton(
            "Delete",
            "btn-danger",
            () =>
                void deleteSubscription(
                    subscription.id
                )
        )
    );


    card.append(
        header,
        amount,
        cycle,
        nextBilling,
        actions
    );


    return card;
}


function addOptionalText(
    parent,
    value,
    className,
    tag
) {

    if (!value) {
        return;
    }


    const element =
        document.createElement(tag);

    element.className =
        className;

    element.textContent =
        value;

    parent.appendChild(element);
}


function createActionButton(
    text,
    className,
    action
) {

    const button =
        document.createElement("button");

    button.type =
        "button";

    button.className =
        className;

    button.textContent =
        text;

    button.addEventListener(
        "click",
        action
    );

    return button;
}


/* =========================================================
   EDIT
   ========================================================= */

function editSubscription(id) {

    const subscription =
        subscriptions.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!subscription) {

        alert(
            "Subscription not found."
        );

        return;
    }


    editingSubscriptionId =
        subscription.id;


    setValue(
        "subscriptionId",
        subscription.id
    );

    setValue(
        "name",
        subscription.name
    );

    setValue(
        "amount",
        subscription.amount
    );

    setValue(
        "billingCycle",
        subscription.billingCycle
    );

    setValue(
        "nextBillingDate",
        subscription.nextBillingDate
    );

    setValue(
        "category",
        subscription.category
    );

    setValue(
        "description",
        subscription.description
    );


    const active =
        document.getElementById("active");

    if (active) {
        active.checked =
            subscription.active !== false;
    }


    setText(
        "formTitle",
        "Edit Subscription"
    );

    setText(
        "saveSubscriptionButton",
        "Update Subscription"
    );


    const cancel =
        document.getElementById(
            "cancelEditButton"
        );

    if (cancel) {
        cancel.style.display =
            "inline-flex";
    }


    const form =
        document.getElementById(
            "subscriptionForm"
        );

    if (form) {

        form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


/* =========================================================
   TOGGLE
   ========================================================= */

async function toggleSubscription(id) {

    try {

        const response =
            await apiRequest(
                `${API_BASE_URL}/api/subscriptions/${id}/toggle`,
{
    method: "PUT"
},
"Unable to change subscription status."
);


if (!response) {
    return;
}


await loadSubscriptions();

} catch (error) {

    console.error(
        "NORA subscription toggle error:",
        error
    );

    alert(
        error.message ||
        "Unable to change subscription status."
    );
}
}


/* =========================================================
   DELETE
   ========================================================= */

async function deleteSubscription(id) {

    const subscription =
        subscriptions.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    const name =
        subscription?.name ||
        "this subscription";


    if (
        !confirm(
            `Are you sure you want to delete "${name}"?`
        )
    ) {
        return;
    }


    try {

        const response =
            await apiRequest(
                `${API_BASE_URL}/api/subscriptions/${id}`,
                {
                    method: "DELETE"
                },
                "Unable to delete subscription."
            );


        if (!response) {
            return;
        }


        await loadSubscriptions();

    } catch (error) {

        console.error(
            "NORA subscription delete error:",
            error
        );

        alert(
            error.message ||
            "Unable to delete subscription."
        );
    }
}


/* =========================================================
   RESET
   ========================================================= */

function resetSubscriptionForm() {

    editingSubscriptionId =
        null;


    const form =
        document.getElementById(
            "subscriptionForm"
        );

    if (form) {
        form.reset();
    }


    const active =
        document.getElementById("active");

    if (active) {
        active.checked = true;
    }


    setText(
        "formTitle",
        "Add Subscription"
    );

    setText(
        "saveSubscriptionButton",
        "Save Subscription"
    );


    const cancel =
        document.getElementById(
            "cancelEditButton"
        );

    if (cancel) {
        cancel.style.display =
            "none";
    }
}


/* =========================================================
   STATISTICS
   ========================================================= */

function updateStatistics() {

    const active =
        subscriptions.filter(
            item =>
                item.active !== false
        );


    const inactive =
        subscriptions.filter(
            item =>
                item.active === false
        );


    let yearlyTotal = 0;


    active.forEach(subscription => {

        const amount =
            Number(
                subscription.amount
            );

        if (!Number.isFinite(amount)) {
            return;
        }


        yearlyTotal +=
            getYearlyAmount(
                amount,
                String(
                    subscription.billingCycle || ""
                ).toUpperCase()
            );
    });


    setText(
        "activeCount",
        active.length
    );

    setText(
        "inactiveCount",
        inactive.length
    );

    setText(
        "totalMonthlyAmount",
        formatCurrency(
            yearlyTotal / 12
        )
    );

    setText(
        "totalYearlyAmount",
        formatCurrency(
            yearlyTotal
        )
    );
}


function getYearlyAmount(
    amount,
    cycle
) {

    const multipliers = {
        WEEKLY: 52,
        MONTHLY: 12,
        QUARTERLY: 4,
        YEARLY: 1,
        ANNUALLY: 1
    };


    return amount *
        (
            multipliers[cycle] ||
            12
        );
}


/* =========================================================
   CATEGORY BUTTONS
   ========================================================= */

function updateCategoryButtons() {

    const categories =
        new Set(
            subscriptions
                .map(
                    item =>
                        String(
                            item.category || ""
                        ).toLowerCase()
                )
                .filter(Boolean)
        );


    document
        .querySelectorAll(
            ".filter-btn[data-category]"
        )
        .forEach(button => {

            const category =
                String(
                    button.dataset.category || ""
                ).toLowerCase();


            button.style.display =
                (
                    category === "all" ||
                    !category ||
                    categories.has(category)
                )
                    ? ""
                    : "none";
        });
}


/* =========================================================
   FORMATTING
   ========================================================= */

function formatBillingCycle(cycle) {

    const value =
        String(
            cycle || ""
        ).toUpperCase();


    const names = {
        WEEKLY: "weekly",
        MONTHLY: "monthly",
        QUARTERLY: "quarterly",
        YEARLY: "yearly",
        ANNUALLY: "annually"
    };


    return (
        names[value] ||
        String(
            cycle || "monthly"
        ).toLowerCase()
    );
}


function formatCurrency(amount) {

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


function formatDate(value) {

    if (!value) {
        return "";
    }


    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {

        const [
            year,
            month,
            day
        ] =
            value.split("-");


        return `${day} ${getMonthName(
            Number(month)
        )} ${year}`;
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
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


function getMonthName(month) {

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


    return months[month - 1] || "";
}


/* =========================================================
   UI HELPERS
   ========================================================= */

function getValue(id) {

    const element =
        document.getElementById(id);

    return element
        ? element.value.trim()
        : "";
}


function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.value =
            value == null
                ? ""
                : String(value);
    }
}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            String(value);
    }
}


function setButtonState(
    button,
    disabled,
    text
) {

    if (!button) {
        return;
    }

    button.disabled =
        disabled;

    button.textContent =
        text;
}


function setLoading(loadingState) {

    const element =
        document.getElementById(
            "loading"
        );

    if (element) {

        element.style.display =
            loadingState
                ? "block"
                : "none";
    }
}


function clearContainer() {

    const container =
        document.getElementById(
            "subscriptionsContainer"
        );

    const empty =
        document.getElementById(
            "emptyState"
        );


    if (container) {
        container.innerHTML = "";
    }


    if (empty) {
        empty.style.display = "none";
    }
}


function showError(message) {

    const container =
        document.getElementById(
            "subscriptionsContainer"
        );


    if (!container) {
        return;
    }


    const wrapper =
        document.createElement("div");

    wrapper.className =
        "empty-state";


    const heading =
        document.createElement("h3");

    heading.textContent =
        "Unable to load subscriptions";


    const paragraph =
        document.createElement("p");

    paragraph.textContent =
        message;


    wrapper.append(
        heading,
        paragraph
    );

    container.appendChild(wrapper);
}


/* =========================================================
   LOGOUT / SESSION
   ========================================================= */

function logout() {

    localStorage.removeItem(
        "pids_token"
    );

    window.location.href =
        "/login.html";
}


function handleSessionExpired() {

    alert(
        "Your NORA session has expired. Please sign in again."
    );

    redirectToLogin();
}

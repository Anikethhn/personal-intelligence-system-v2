/* =========================================================
   NORA - DECISIONS
   decisions.js
   ========================================================= */

const API_BASE_URL = "";


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let decisions = [];

let currentFilter = "ALL";

let editingDecisionId = null;


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
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (!checkAuthentication()) {
            return;
        }


        loadDecisions();


        const form =
            document.getElementById(
                "decisionForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                handleDecisionSubmit
            );
        }


        /*
         * Close modal when clicking outside
         */

        const modal =
            document.getElementById(
                "decisionModal"
            );


        if (modal) {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target === modal
                    ) {

                        closeDecisionModal();
                    }
                }
            );
        }
    }
);


/* =========================================================
   LOAD DECISIONS
   ========================================================= */

async function loadDecisions() {

    const loading =
        document.getElementById(
            "loading"
        );

    const container =
        document.getElementById(
            "decisionsGrid"
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
                `${API_BASE_URL}/api/decisions`
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
                `Failed to load decisions (${response.status})`
            );
        }


        const data =
            await response.json();


        decisions =
            Array.isArray(data)
                ? data
                : [];


        renderDecisions();


    } catch (error) {

        console.error(
            "NORA decisions loading error:",
            error
        );


        if (container) {

            container.innerHTML = `
                <div class="empty-state">
                    <h3>Unable to load decisions</h3>
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
   FILTER DECISIONS
   ========================================================= */

function filterDecisions(
    status,
    button
) {

    currentFilter =
        status;


    /*
     * Update active filter button
     */

    document
        .querySelectorAll(
            ".filter-btn"
        )
        .forEach(
            btn => {

                btn.classList.remove(
                    "active"
                );
            }
        );


    if (button) {

        button.classList.add(
            "active"
        );

    } else {

        const activeButton =
            document.querySelector(
                `.filter-btn[data-status="${status}"]`
            );


        if (activeButton) {

            activeButton.classList.add(
                "active"
            );
        }
    }


    renderDecisions();
}


/* =========================================================
   RENDER DECISIONS
   ========================================================= */

function renderDecisions() {

    const container =
        document.getElementById(
            "decisionsGrid"
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


    let filteredDecisions =
        decisions;


    if (currentFilter !== "ALL") {

        filteredDecisions =
            decisions.filter(
                decision =>
                    String(
                        decision.status || ""
                    ).toUpperCase() ===
                    currentFilter
            );
    }


    /*
     * Sort newest first
     */

    filteredDecisions =
        [...filteredDecisions].sort(
            (a, b) => {

                const dateA =
                    new Date(
                        a.createdAt || 0
                    );

                const dateB =
                    new Date(
                        b.createdAt || 0
                    );

                return dateB - dateA;
            }
        );


    if (
        filteredDecisions.length === 0
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


    filteredDecisions.forEach(
        decision => {

            const card =
                createDecisionCard(
                    decision
                );


            container.appendChild(
                card
            );
        }
    );
}


/* =========================================================
   CREATE DECISION CARD
   ========================================================= */

function createDecisionCard(
    decision
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "decision-card";


    /*
     * Header
     */

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "decision-card-header";


    const title =
        document.createElement(
            "h3"
        );


    title.textContent =
        decision.title ||
        "Untitled Decision";


    const status =
        document.createElement(
            "span"
        );


    const statusValue =
        String(
            decision.status ||
            "PENDING"
        ).toUpperCase();


    status.className =
        `decision-status ${getStatusClass(
            statusValue
        )}`;


    status.textContent =
        formatStatus(
            statusValue
        );


    header.appendChild(
        title
    );


    header.appendChild(
        status
    );


    /*
     * Description
     */

    const description =
        document.createElement(
            "p"
        );


    description.className =
        "decision-description";


    description.textContent =
        decision.description ||
        "No description provided.";


    /*
     * Details
     */

    const details =
        document.createElement(
            "div"
        );


    details.className =
        "decision-details";


    if (decision.options) {

        details.appendChild(
            createDetailSection(
                "Options",
                decision.options
            )
        );
    }


    if (decision.pros) {

        details.appendChild(
            createDetailSection(
                "Pros",
                decision.pros
            )
        );
    }


    if (decision.cons) {

        details.appendChild(
            createDetailSection(
                "Cons",
                decision.cons
            )
        );
    }


    if (decision.chosenOption) {

        details.appendChild(
            createDetailSection(
                "Chosen Option",
                decision.chosenOption
            )
        );
    }


    if (decision.outcome) {

        details.appendChild(
            createDetailSection(
                "Outcome",
                decision.outcome
            )
        );
    }


    /*
     * Footer
     */

    const footer =
        document.createElement(
            "div"
        );


    footer.className =
        "decision-card-footer";


    const date =
        document.createElement(
            "small"
        );


    date.textContent =
        decision.createdAt
            ? `Created ${formatDate(
                decision.createdAt
            )}`
            : "";


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "decision-actions";


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

            editDecision(
                decision.id
            );
        }
    );


    /*
     * Status button
     */

    const statusButton =
        document.createElement(
            "button"
        );


    statusButton.type =
        "button";

    statusButton.className =
        "btn-secondary";

    statusButton.textContent =
        getNextStatusLabel(
            statusValue
        );


    statusButton.addEventListener(
        "click",
        () => {

            updateDecisionStatus(
                decision.id,
                getNextStatus(
                    statusValue
                )
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

            deleteDecision(
                decision.id
            );
        }
    );


    actions.appendChild(
        editButton
    );

    actions.appendChild(
        statusButton
    );

    actions.appendChild(
        deleteButton
    );


    footer.appendChild(
        date
    );

    footer.appendChild(
        actions
    );


    /*
     * Build card
     */

    card.appendChild(
        header
    );

    card.appendChild(
        description
    );

    if (details.children.length > 0) {

        card.appendChild(
            details
        );
    }

    card.appendChild(
        footer
    );


    return card;
}


/* =========================================================
   CREATE DETAIL SECTION
   ========================================================= */

function createDetailSection(
    label,
    value
) {

    const section =
        document.createElement(
            "div"
        );


    section.className =
        "decision-detail";


    const heading =
        document.createElement(
            "strong"
        );


    heading.textContent =
        label;


    const content =
        document.createElement(
            "p"
        );


    content.textContent =
        value;


    section.appendChild(
        heading
    );

    section.appendChild(
        content
    );


    return section;
}


/* =========================================================
   OPEN NEW DECISION MODAL
   ========================================================= */

function openDecisionModal() {

    editingDecisionId =
        null;


    const modal =
        document.getElementById(
            "decisionModal"
        );

    const modalTitle =
        document.getElementById(
            "modalTitle"
        );

    const form =
        document.getElementById(
            "decisionForm"
        );


    if (form) {

        form.reset();
    }


    setValue(
        "decisionId",
        ""
    );

    setValue(
        "status",
        "PENDING"
    );


    if (modalTitle) {

        modalTitle.textContent =
            "New Decision";
    }


    if (modal) {

        modal.classList.add(
            "active"
        );


        modal.style.display =
            "flex";
    }
}


/* =========================================================
   CLOSE DECISION MODAL
   ========================================================= */

function closeDecisionModal() {

    const modal =
        document.getElementById(
            "decisionModal"
        );


    editingDecisionId =
        null;


    if (modal) {

        modal.classList.remove(
            "active"
        );


        modal.style.display =
            "none";
    }
}


/* =========================================================
   EDIT DECISION
   ========================================================= */

function editDecision(id) {

    const decision =
        decisions.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!decision) {

        alert(
            "Decision not found."
        );

        return;
    }


    editingDecisionId =
        decision.id;


    setValue(
        "decisionId",
        decision.id
    );

    setValue(
        "title",
        decision.title
    );

    setValue(
        "description",
        decision.description
    );

    setValue(
        "options",
        decision.options
    );

    setValue(
        "pros",
        decision.pros
    );

    setValue(
        "cons",
        decision.cons
    );

    setValue(
        "status",
        decision.status ||
        "PENDING"
    );

    setValue(
        "chosenOption",
        decision.chosenOption
    );

    setValue(
        "outcome",
        decision.outcome
    );


    const modalTitle =
        document.getElementById(
            "modalTitle"
        );


    if (modalTitle) {

        modalTitle.textContent =
            "Edit Decision";
    }


    const modal =
        document.getElementById(
            "decisionModal"
        );


    if (modal) {

        modal.classList.add(
            "active"
        );


        modal.style.display =
            "flex";
    }
}


/* =========================================================
   SUBMIT DECISION
   ========================================================= */

async function handleDecisionSubmit(
    event
) {

    event.preventDefault();


    const title =
        getValue("title");


    if (!title) {

        alert(
            "Please enter a decision title."
        );

        return;
    }


    const decisionData = {

        title: title,

        description:
            getValue("description") ||
            null,

        options:
            getValue("options") ||
            null,

        pros:
            getValue("pros") ||
            null,

        cons:
            getValue("cons") ||
            null,

        status:
            getValue("status") ||
            "PENDING",

        chosenOption:
            getValue("chosenOption") ||
            null,

        outcome:
            getValue("outcome") ||
            null
    };


    const isEditing =
        editingDecisionId !== null &&
        editingDecisionId !== "";


    try {

        let response;


        if (isEditing) {

            response =
                await authenticatedFetch(
                    `${API_BASE_URL}/api/decisions/${editingDecisionId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                decisionData
                            )
                    }
                );

        } else {

            response =
                await authenticatedFetch(
                    `${API_BASE_URL}/api/decisions`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                decisionData
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
                "Unable to save decision."
            );
        }


        closeDecisionModal();


        await loadDecisions();


    } catch (error) {

        console.error(
            "NORA decision save error:",
            error
        );


        alert(
            error.message ||
            "Unable to save decision. Please try again."
        );
    }
}


/* =========================================================
   UPDATE DECISION STATUS
   ========================================================= */

async function updateDecisionStatus(
    id,
    newStatus
) {

    if (!id || !newStatus) {
        return;
    }


    try {

        const response =
            await authenticatedFetch(
                `${API_BASE_URL}/api/decisions/${id}/status?status=${encodeURIComponent(
                    newStatus
                )}`,
                {
                    method: "PUT"
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
                "Unable to update decision status."
            );
        }


        await loadDecisions();


    } catch (error) {

        console.error(
            "NORA decision status error:",
            error
        );


        alert(
            error.message ||
            "Unable to update decision status."
        );
    }
}


/* =========================================================
   DELETE DECISION
   ========================================================= */

async function deleteDecision(id) {

    const decision =
        decisions.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    const title =
        decision?.title ||
        "this decision";


    const confirmed =
        confirm(
            `Are you sure you want to delete "${title}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await authenticatedFetch(
                `${API_BASE_URL}/api/decisions/${id}`,
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
                "Unable to delete decision."
            );
        }


        await loadDecisions();


    } catch (error) {

        console.error(
            "NORA decision delete error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete decision."
        );
    }
}


/* =========================================================
   STATUS HELPERS
   ========================================================= */

function getStatusClass(status) {

    switch (
        String(status).toUpperCase()
        ) {

        case "DECIDED":
            return "decided";

        case "COMPLETED":
            return "completed";

        case "CANCELLED":
            return "cancelled";

        case "PENDING":
        default:
            return "pending";
    }
}


function formatStatus(status) {

    switch (
        String(status).toUpperCase()
        ) {

        case "DECIDED":
            return "Decided";

        case "COMPLETED":
            return "Completed";

        case "CANCELLED":
            return "Cancelled";

        case "PENDING":
        default:
            return "Pending";
    }
}


/* =========================================================
   NEXT STATUS
   ========================================================= */

function getNextStatus(
    currentStatus
) {

    switch (
        String(currentStatus).toUpperCase()
        ) {

        case "PENDING":
            return "DECIDED";

        case "DECIDED":
            return "COMPLETED";

        case "COMPLETED":
            return "PENDING";

        case "CANCELLED":
            return "PENDING";

        default:
            return "PENDING";
    }
}


function getNextStatusLabel(
    currentStatus
) {

    switch (
        String(currentStatus).toUpperCase()
        ) {

        case "PENDING":
            return "Mark Decided";

        case "DECIDED":
            return "Mark Completed";

        case "COMPLETED":
            return "Reopen";

        case "CANCELLED":
            return "Reopen";

        default:
            return "Mark Decided";
    }
}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(
    dateValue
) {

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


/* =========================================================
   FORM HELPERS
   ========================================================= */

function getValue(id) {

    const element =
        document.getElementById(id);


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
        document.getElementById(id);


    if (!element) {
        return;
    }


    element.value =
        value ?? "";
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
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
const TOKEN_KEY = "pids_token";
const INSIGHT_API_URL = "/api/insight";

document.addEventListener("DOMContentLoaded", () => {
    const refreshButton = document.getElementById("refreshInsightsBtn");

    if (refreshButton) {
        refreshButton.addEventListener("click", loadInsights);
    }

    loadInsights();
});

async function loadInsights() {
    const loading = document.getElementById("insightsLoading");
    const error = document.getElementById("insightsError");
    const empty = document.getElementById("emptyInsights");

    if (loading) {
        loading.style.display = "block";
    }

    if (error) {
        error.style.display = "none";
        error.textContent = "";
    }

    if (empty) {
        empty.style.display = "none";
    }

    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
        if (loading) {
            loading.style.display = "none";
        }

        window.location.href = "/login.html";
        return;
    }

    try {
        const response = await fetch(INSIGHT_API_URL, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token,
                "Accept": "application/json"
            }
        });

        if (response.status === 401 || response.status === 403) {
            if (loading) {
                loading.style.display = "none";
            }

            if (error) {
                error.textContent = "Session expired. Please login again.";
                error.style.display = "block";
            }

            localStorage.removeItem(TOKEN_KEY);

            return;
        }

        if (!response.ok) {
            const message = await response.text();

            console.error(
                "Insights API error:",
                response.status,
                message
            );

            throw new Error("HTTP " + response.status);
        }

        const result = await response.json();

        const data =
            result &&
            typeof result === "object" &&
            result.data &&
            typeof result.data === "object"
                ? result.data
                : result;

        if (loading) {
            loading.style.display = "none";
        }

        displayInsights(data);

    } catch (e) {
        console.error("Insight loading failed:", e);

        if (loading) {
            loading.style.display = "none";
        }

        if (error) {
            error.textContent =
                "Unable to load insights. Please try again.";
            error.style.display = "block";
        }
    }
}

function displayInsights(data) {
    if (!data || typeof data !== "object") {
        showEmptyState();
        return;
    }

    setText("totalTasks", number(data.totalTasks));
    setText("completedTasks", number(data.completedTasks));
    setText("pendingTasks", number(data.pendingTasks));
    setText("highPriorityTasks", number(data.highPriorityTasks));
    setText("taskCompletionRate", percentage(data.taskCompletionRate));

    setText("totalExpenses", currency(data.totalExpenses));
    setText("averageExpense", currency(data.averageExpense));
    setText("highestExpense", currency(data.highestExpense));
    setText(
        "highestSpendingCategory",
        text(data.highestSpendingCategory, "N/A")
    );
    setText(
        "highestCategoryAmount",
        currency(data.highestCategoryAmount)
    );

    setText("activeSubscriptions", number(data.activeSubscriptions));
    setText("inactiveSubscriptions", number(data.inactiveSubscriptions));
    setText(
        "monthlySubscriptionCost",
        currency(data.monthlySubscriptionCost)
    );
    setText(
        "yearlySubscriptionCost",
        currency(data.yearlySubscriptionCost)
    );

    setText("pendingDecisions", number(data.pendingDecisions));
    setText("decidedDecisions", number(data.decidedDecisions));
    setText("completedDecisions", number(data.completedDecisions));
    setText("cancelledDecisions", number(data.cancelledDecisions));

    displayObservations(data.observations);

    const summary = document.getElementById("insightSummary");

    if (summary) {
        summary.textContent =
            "Your personal activity insights have been updated.";
    }

    hideEmptyState();
}

function displayObservations(observations) {
    const container = document.getElementById("observationsList");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !observations ||
        !Array.isArray(observations) ||
        observations.length === 0
    ) {
        const item = document.createElement("div");
        item.className = "insight-observation";

        const icon = document.createElement("span");
        icon.className = "observation-icon";
        icon.textContent = "✦";

        const textElement = document.createElement("span");
        textElement.className = "observation-text";
        textElement.textContent = "No observations available yet.";

        item.appendChild(icon);
        item.appendChild(textElement);
        container.appendChild(item);

        return;
    }

    observations.forEach(observation => {
        const item = document.createElement("div");
        item.className = "insight-observation";

        const icon = document.createElement("span");
        icon.className = "observation-icon";
        icon.textContent = "✦";

        const textElement = document.createElement("span");
        textElement.className = "observation-text";

        if (
            typeof observation === "object" &&
            observation !== null
        ) {
            textElement.textContent = String(
                observation.text ||
                observation.message ||
                observation.description ||
                JSON.stringify(observation)
            );
        } else {
            textElement.textContent = String(observation);
        }

        item.appendChild(icon);
        item.appendChild(textElement);
        container.appendChild(item);
    });
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function number(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "0";
    }

    const n = Number(value);

    if (Number.isNaN(n)) {
        return "0";
    }

    return n.toLocaleString("en-IN");
}

function text(value, fallback) {
    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return fallback;
    }

    return String(value);
}

function currency(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "₹0.00";
    }

    const n = Number(value);

    if (Number.isNaN(n)) {
        return "₹0.00";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(n);
}

function percentage(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "0%";
    }

    let n = Number(value);

    if (Number.isNaN(n)) {
        return "0%";
    }

    if (n >= 0 && n <= 1) {
        n *= 100;
    }

    return n.toFixed(1) + "%";
}

function showEmptyState() {
    const empty = document.getElementById("emptyInsights");

    if (empty) {
        empty.style.display = "block";
    }
}

function hideEmptyState() {
    const empty = document.getElementById("emptyInsights");

    if (empty) {
        empty.style.display = "none";
    }
}
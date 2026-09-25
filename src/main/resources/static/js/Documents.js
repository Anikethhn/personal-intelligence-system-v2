
const API_BASE_URL = "";
const TOKEN_KEY = "pids_token";

let documents = [];

document.addEventListener("DOMContentLoaded", () => {
    initializeDocumentsPage();
});

function initializeDocumentsPage() {
    setupUploadForm();
    setupFileInput();
    setupSearch();
    setupFilter();
    setupRefresh();
    setupLogout();
    setupIntelligenceModal();
    loadDocuments();
}

function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function redirectToLogin() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "/login.html";
}

async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();

    if (!token) {
        redirectToLogin();
        throw new Error("Authentication required");
    }

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);

    return fetch(url, {
        ...options,
        headers
    });
}

async function loadDocuments() {
    const loading = document.getElementById("loading");
    const emptyState = document.getElementById("emptyState");

    if (loading) {
        loading.style.display = "flex";
    }

    try {
        const response = await authenticatedFetch(
            `${API_BASE_URL}/api/documents`
        );

        if (response.status === 401 || response.status === 403) {
            redirectToLogin();
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load documents");
        }

        documents = await response.json();

        updateStatistics();
        renderDocuments(documents);

        if (emptyState) {
            emptyState.style.display =
                documents.length === 0 ? "flex" : "none";
        }

    } catch (error) {
        console.error("Failed to load documents:", error);
        showToast("Failed to load documents", "error");
    } finally {
        if (loading) {
            loading.style.display = "none";
        }
    }
}

function renderDocuments(documentList) {
    const container = document.getElementById("documentsContainer");
    const emptyState = document.getElementById("emptyState");

    if (!container) {
        console.error("documentsContainer not found");
        return;
    }

    container.innerHTML = "";

    if (!documentList || documentList.length === 0) {
        if (emptyState) {
            emptyState.style.display = "flex";
        }
        return;
    }

    if (emptyState) {
        emptyState.style.display = "none";
    }

    documentList.forEach(documentData => {
        const card = createDocumentCard(documentData);
        container.appendChild(card);
    });
}

function createDocumentCard(documentData) {
    const card = document.createElement("div");

    card.className = "document-card";

    const type = getDocumentType(documentData);
    const icon = getDocumentIcon(type);

    const filename =
        documentData.originalFilename || "Unnamed document";

    const description =
        documentData.description || "";

    const category =
        documentData.category || "General";

    const fileSize =
        formatFileSize(documentData.fileSize);

    const uploadedAt =
        formatDate(documentData.uploadedAt);

    card.innerHTML = `
<div class="document-card-header">

    <div class="document-icon ${type}">
    ${icon}
</div>

<div class="document-card-title-section">
    <h3 title="${escapeHtml(filename)}">
        ${escapeHtml(filename)}
    </h3>

    <p>
        ${escapeHtml(category)}
    </p>
</div>

</div>

<div class="document-card-body">

    <div class="document-description">
        ${
        description
            ? escapeHtml(description)
            : "No description available"
    }
    </div>

    <div class="document-meta">
                <span>
                    ${escapeHtml(fileSize)}
                </span>

        <span>
                    ${escapeHtml(type.toUpperCase())}
                </span>
    </div>

    <div class="document-uploaded">
        Uploaded ${escapeHtml(uploadedAt)}
    </div>

</div>

<div class="document-actions"></div>
    `;

    const actions =
        card.querySelector(".document-actions");

    const intelligenceButton =
        document.createElement("button");

    intelligenceButton.type = "button";
    intelligenceButton.className = "btn-secondary";
    intelligenceButton.textContent = "Intelligence";

    intelligenceButton.addEventListener("click", () => {
        openIntelligence(documentData);
    });

    const viewButton =
        document.createElement("button");

    viewButton.type = "button";
    viewButton.className = "btn-secondary";
    viewButton.textContent = "View";

    viewButton.addEventListener("click", () => {
        viewDocument(documentData);
    });

    const deleteButton =
        document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "btn-danger";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
        deleteDocument(documentData);
    });

    actions.appendChild(intelligenceButton);
    actions.appendChild(viewButton);
    actions.appendChild(deleteButton);

    return card;
}

function setupUploadForm() {
    const form =
        document.getElementById("documentForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        await uploadDocument();
    });
}

async function uploadDocument() {
    const fileInput =
        document.getElementById("file");

    const titleInput =
        document.getElementById("documentTitle");

    const descriptionInput =
        document.getElementById("documentDescription");

    const uploadButton =
        document.getElementById("uploadButton");

    if (
        !fileInput ||
        !fileInput.files ||
        fileInput.files.length === 0
    ) {
        showDocumentError("Please select a document.");
        return;
    }

    const file = fileInput.files[0];

    if (!isSupportedDocument(file)) {
        showDocumentError(
            "Unsupported file type. Allowed types: PDF, TXT, DOCX, PNG and JPEG."
        );
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showDocumentError(
            "File size must not exceed 10 MB."
        );
        return;
    }

    clearDocumentError();

    const formData = new FormData();

    formData.append("file", file);

    let description = "";

    if (
        titleInput &&
        titleInput.value.trim()
    ) {
        description =
            titleInput.value.trim();
    }

    if (
        descriptionInput &&
        descriptionInput.value.trim()
    ) {
        if (description) {
            description +=
                " | " +
                descriptionInput.value.trim();
        } else {
            description =
                descriptionInput.value.trim();
        }
    }

    if (description) {
        formData.append(
            "description",
            description
        );
    }

    if (uploadButton) {
        uploadButton.disabled = true;
        uploadButton.textContent = "Uploading...";
    }

    try {
        const response =
            await authenticatedFetch(
                `${API_BASE_URL}/api/documents`,
                {
                    method: "POST",
                    body: formData
                }
            );

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            redirectToLogin();
            return;
        }

        if (!response.ok) {
            const responseText =
                await response.text();

            let message =
                "Document upload failed.";

            try {
                const errorData =
                    JSON.parse(responseText);

                message =
                    errorData.message ||
                    errorData.error ||
                    message;
            } catch {
                if (responseText) {
                    message = responseText;
                }
            }

            throw new Error(message);
        }

        await response.json();

        showToast(
            "Document uploaded successfully",
            "success"
        );

        clearUploadForm();

        await loadDocuments();

    } catch (error) {
        console.error(
            "Upload failed:",
            error
        );

        showDocumentError(
            error.message ||
            "Document upload failed."
        );

        showToast(
            error.message ||
            "Document upload failed",
            "error"
        );

    } finally {
        if (uploadButton) {
            uploadButton.disabled = false;
            uploadButton.textContent =
                "Upload Document";
        }
    }
}

function setupFileInput() {
    const fileInput =
        document.getElementById("file");

    const selectedFileName =
        document.getElementById(
            "selectedFileName"
        );

    if (!fileInput) {
        return;
    }

    fileInput.addEventListener(
        "change",
        () => {
            if (!selectedFileName) {
                return;
            }

            if (fileInput.files.length > 0) {
                selectedFileName.textContent =
                    fileInput.files[0].name;
            } else {
                selectedFileName.textContent =
                    "No file selected";
            }

            clearDocumentError();
        }
    );
}

function clearUploadForm() {
    const form =
        document.getElementById("documentForm");

    const selectedFileName =
        document.getElementById(
            "selectedFileName"
        );

    if (form) {
        form.reset();
    }

    if (selectedFileName) {
        selectedFileName.textContent =
            "No file selected";
    }

    clearDocumentError();
}

function setupSearch() {
    const searchInput =
        document.getElementById(
            "documentSearch"
        );

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener(
        "input",
        applyFilters
    );
}

function setupFilter() {
    const filter =
        document.getElementById(
            "documentFilter"
        );

    if (!filter) {
        return;
    }

    filter.addEventListener(
        "change",
        applyFilters
    );
}

function applyFilters() {
    const searchInput =
        document.getElementById(
            "documentSearch"
        );

    const filter =
        document.getElementById(
            "documentFilter"
        );

    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    const filterValue =
        filter
            ? filter.value
            : "all";

    const filteredDocuments =
        documents.filter(documentData => {

            const searchableText = [
                documentData.originalFilename || "",
                documentData.description || "",
                documentData.category || ""
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !searchTerm ||
                searchableText.includes(searchTerm);

            const type =
                getDocumentType(documentData);

            let matchesFilter = true;

            if (filterValue !== "all") {
                if (filterValue === "image") {
                    matchesFilter =
                        type === "png" ||
                        type === "jpeg";
                } else {
                    matchesFilter =
                        type === filterValue;
                }
            }

            return matchesSearch &&
                matchesFilter;
        });

    renderDocuments(filteredDocuments);
}

function setupRefresh() {
    const refreshButton =
        document.getElementById(
            "refreshDocumentsButton"
        );

    if (!refreshButton) {
        return;
    }

    refreshButton.addEventListener(
        "click",
        async () => {
            refreshButton.disabled = true;
            refreshButton.textContent =
                "Refreshing...";

            try {
                await loadDocuments();
            } finally {
                refreshButton.disabled = false;
                refreshButton.textContent =
                    "↻ Refresh";
            }
        }
    );
}

function setupLogout() {
    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener(
        "click",
        () => {
            localStorage.removeItem(
                TOKEN_KEY
            );

            window.location.href =
                "/login.html";
        }
    );
}

async function viewDocument(documentData) {
    try {
        const response =
            await authenticatedFetch(
                `${API_BASE_URL}/api/documents/${documentData.id}/download`
);

if (
    response.status === 401 ||
    response.status === 403
) {
    redirectToLogin();
    return;
}

if (!response.ok) {
    throw new Error(
        "Unable to open document"
    );
}

const blob =
    await response.blob();

const url =
    URL.createObjectURL(blob);

window.open(
    url,
    "_blank"
);

setTimeout(() => {
    URL.revokeObjectURL(url);
}, 60000);

} catch (error) {
    console.error(
        "Failed to open document:",
        error
    );

    showToast(
        "Unable to open document",
        "error"
    );
}
}

async function deleteDocument(documentData) {
    const filename =
        documentData.originalFilename ||
        "this document";

    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${filename}"?`
        );

    if (!confirmed) {
        return;
    }

    try {
        const response =
            await authenticatedFetch(
                `${API_BASE_URL}/api/documents/${documentData.id}`,
                {
                    method: "DELETE"
                }
            );

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            redirectToLogin();
            return;
        }

        if (!response.ok) {
            const responseText =
                await response.text();

            throw new Error(
                responseText ||
                "Failed to delete document"
            );
        }

        showToast(
            "Document deleted successfully",
            "success"
        );

        await loadDocuments();

    } catch (error) {
        console.error(
            "Delete failed:",
            error
        );

        showToast(
            error.message ||
            "Failed to delete document",
            "error"
        );
    }
}

async function openIntelligence(documentData) {
    const modal =
        document.getElementById(
            "documentIntelligenceModal"
        );

    const body =
        document.getElementById(
            "intelligenceBody"
        );

    const title =
        document.getElementById(
            "intelligenceTitle"
        );

    if (!modal || !body) {
        return;
    }

    if (title) {
        title.textContent =
            documentData.originalFilename ||
            "Document Intelligence";
    }

    body.innerHTML = `
        <div class="document-detail-row">
            <div class="document-detail-label">
                Status
            </div>

            <div class="document-detail-value">
                Loading intelligence...
            </div>
        </div>
    `;

    modal.classList.add("show");

    try {
        const response =
            await authenticatedFetch(
                `${API_BASE_URL}/api/documents/${documentData.id}/intelligence`
            );

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            redirectToLogin();
            return;
        }

        if (!response.ok) {
            const responseText =
                await response.text();

            let message =
                "Document intelligence is not available.";

            try {
                const errorData =
                    JSON.parse(responseText);

                message =
                    errorData.message ||
                    errorData.error ||
                    message;
            } catch {
                if (responseText) {
                    message = responseText;
                }
            }

            throw new Error(message);
        }

        const intelligence =
            await response.json();

        renderIntelligence(
            intelligence,
            documentData
        );

    } catch (error) {
        console.error(
            "Failed to load intelligence:",
            error
        );

        body.innerHTML = `
            <div class="document-detail-row">
                <div class="document-detail-label">
                    Status
                </div>

                <div class="document-detail-value">
                    ${escapeHtml(
            error.message ||
            "Document intelligence is not available."
        )}
                </div>
            </div>
        `;
    }
}

function renderIntelligence(
    intelligence,
    documentData
) {
    const body =
        document.getElementById(
            "intelligenceBody"
        );

    if (!body) {
        return;
    }

    body.innerHTML = "";

    addIntelligenceRow(
        body,
        "Category",
        documentData &&
        documentData.category
            ? documentData.category
            : "General"
    );

    addIntelligenceRow(
        body,
        "Summary",
        intelligence.summary
    );

    addIntelligenceRow(
        body,
        "Keywords",
        intelligence.keywords
    );

    addIntelligenceRow(
        body,
        "Dates",
        intelligence.extractedDates
    );

    addIntelligenceRow(
        body,
        "Amounts",
        intelligence.extractedAmounts
    );

    addIntelligenceRow(
        body,
        "Names",
        intelligence.extractedNames
    );

    addIntelligenceRow(
        body,
        "Organizations",
        intelligence.extractedOrganizations
    );

    addIntelligenceRow(
        body,
        "Extracted Text",
        intelligence.extractedText
    );

    addIntelligenceRow(
        body,
        "Processed At",
        formatDateTime(
            intelligence.processedAt
        )
    );
}

function addIntelligenceRow(
    container,
    label,
    value
) {
    const row =
        document.createElement("div");

    row.className =
        "document-detail-row";

    const labelElement =
        document.createElement("div");

    labelElement.className =
        "document-detail-label";

    labelElement.textContent =
        label;

    const valueElement =
        document.createElement("div");

    valueElement.className =
        "document-detail-value";

    valueElement.textContent =
        value &&
        String(value).trim()
            ? value
            : "No information found";

    row.appendChild(labelElement);
    row.appendChild(valueElement);

    container.appendChild(row);
}

function setupIntelligenceModal() {
    const modal =
        document.getElementById(
            "documentIntelligenceModal"
        );

    const closeButton =
        document.getElementById(
            "closeIntelligenceButton"
        );

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeIntelligenceModal
        );
    }

    if (modal) {
        modal.addEventListener(
            "click",
            event => {
                if (event.target === modal) {
                    closeIntelligenceModal();
                }
            }
        );
    }

    document.addEventListener(
        "keydown",
        event => {
            if (event.key === "Escape") {
                closeIntelligenceModal();
            }
        }
    );
}

function closeIntelligenceModal() {
    const modal =
        document.getElementById(
            "documentIntelligenceModal"
        );

    if (modal) {
        modal.classList.remove("show");
    }
}

function updateStatistics() {
    const total =
        document.getElementById(
            "totalDocuments"
        );

    const pdf =
        document.getElementById(
            "pdfDocuments"
        );

    const word =
        document.getElementById(
            "wordDocuments"
        );

    const other =
        document.getElementById(
            "otherDocuments"
        );

    let pdfCount = 0;
    let wordCount = 0;
    let otherCount = 0;

    documents.forEach(documentData => {
        const type =
            getDocumentType(documentData);

        if (type === "pdf") {
            pdfCount++;
        } else if (type === "docx") {
            wordCount++;
        } else {
            otherCount++;
        }
    });

    if (total) {
        total.textContent =
            documents.length;
    }

    if (pdf) {
        pdf.textContent =
            pdfCount;
    }

    if (word) {
        word.textContent =
            wordCount;
    }

    if (other) {
        other.textContent =
            otherCount;
    }
}

function getDocumentType(documentData) {
    const contentType =
        documentData.contentType
            ? documentData.contentType.toLowerCase()
            : "";

    const filename =
        documentData.originalFilename
            ? documentData.originalFilename.toLowerCase()
            : "";

    if (
        contentType === "application/pdf" ||
        filename.endsWith(".pdf")
    ) {
        return "pdf";
    }

    if (
        contentType === "text/plain" ||
        filename.endsWith(".txt")
    ) {
        return "txt";
    }

    if (
        contentType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        filename.endsWith(".docx")
    ) {
        return "docx";
    }

    if (
        contentType === "image/png" ||
        filename.endsWith(".png")
    ) {
        return "png";
    }

    if (
        contentType === "image/jpeg" ||
        filename.endsWith(".jpg") ||
        filename.endsWith(".jpeg")
    ) {
        return "jpeg";
    }

    return "other";
}

function getDocumentIcon(type) {
    switch (type) {
        case "pdf":
            return "PDF";

        case "docx":
            return "DOC";

        case "txt":
            return "TXT";

        case "png":
        case "jpeg":
            return "IMG";

        default:
            return "FILE";
    }
}

function isSupportedDocument(file) {
    if (!file) {
        return false;
    }

    const allowedTypes = [
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/png",
        "image/jpeg"
    ];

    if (
        file.type &&
        allowedTypes.includes(file.type)
    ) {
        return true;
    }

    const filename =
        file.name
            ? file.name.toLowerCase()
            : "";

    return [
        ".pdf",
        ".txt",
        ".docx",
        ".png",
        ".jpg",
        ".jpeg"
    ].some(extension =>
        filename.endsWith(extension)
    );
}

function formatFileSize(bytes) {
    if (
        bytes === null ||
        bytes === undefined ||
        isNaN(bytes)
    ) {
        return "Unknown size";
    }

    if (bytes === 0) {
        return "0 B";
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];

    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );

    const size =
        bytes /
        Math.pow(1024, index);

    return `${size.toFixed(
        index === 0 ? 0 : 2
    )} ${units[index]}`;
}

function formatDate(dateValue) {
    if (!dateValue) {
        return "Unknown date";
    }

    const date =
        new Date(dateValue);

    if (isNaN(date.getTime())) {
        return "Unknown date";
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

function formatDateTime(dateValue) {
    if (!dateValue) {
        return "Unknown";
    }

    const date =
        new Date(dateValue);

    if (isNaN(date.getTime())) {
        return String(dateValue);
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

function showDocumentError(message) {
    const element =
        document.getElementById(
            "documentError"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message || "";

    element.style.display =
        message ? "block" : "none";
}

function clearDocumentError() {
    showDocumentError("");
}

function showToast(
    message,
    type = "info"
) {
    const container =
        document.getElementById(
            "toastContainer"
        );

    if (!container) {
        return;
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast toast-${type}`;

    toast.textContent =
        message;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
}

function escapeHtml(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


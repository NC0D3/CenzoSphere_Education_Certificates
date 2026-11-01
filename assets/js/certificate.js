
"use strict";

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const CONFIG = {
    certificatesUrl: "data/certificates.json",

    deliverableTypes: {
        TASK: "Tarea",
        PRACTICE: "Práctica",
        PEC: "Prueba de Evaluación Continua (PEC)",
        FINAL_PROJECT: "Proyecto final",
        ESSAY: "Ensayo",
        RESEARCH: "Investigación",
        TT: "Trabajo Terminal",
        PT: "Proyecto Terminal",
        OTHER: "Otro"
    },

    serviceTypes: {
        ACADEMIC_ADVISORY: "Asesoramiento académico",
        REVIEW: "Revisión",
        CORRECTION: "Corrección",
        TUTORING: "Tutoría",
        TECHNICAL_SUPPORT: "Apoyo técnico",
        CONSULTING: "Consultoría",
        OTHER: "Otro"
    }
};


/* =========================================================
   ELEMENTOS DEL DOM
========================================================= */

const elements = {
    loading: document.getElementById("loading-state"),
    error: document.getElementById("error-state"),
    errorTitle: document.getElementById("error-title"),
    errorMessage: document.getElementById("error-message"),
    retryButton: document.getElementById("retry-button"),

    certificate: document.getElementById("certificate"),

    deliverableName: document.getElementById("deliverable-name"),
    deliverableType: document.getElementById("deliverable-type"),
    deliverableSubject: document.getElementById("deliverable-subject"),

    serviceDescription: document.getElementById("service-description"),
    serviceType: document.getElementById("service-type"),

    reviewerName: document.getElementById("reviewer-name"),
    reviewerTitle: document.getElementById("reviewer-title"),

    licenseContainer: document.getElementById("license-container"),
    licenseType: document.getElementById("license-type"),
    licenseIdentifier: document.getElementById("license-identifier"),
    licenseAuthority: document.getElementById("license-authority"),
    licenseAuthorityRow: document.getElementById("license-authority-row"),
    licenseCountry: document.getElementById("license-country"),

    deliveryDate: document.getElementById("delivery-date"),
    certificateId: document.getElementById("certificate-id"),

    copyButton: document.getElementById("copy-id-button"),
    copyFeedback: document.getElementById("copy-feedback"),

    currentYear: document.getElementById("current-year")
};


/* =========================================================
   UTILIDADES
========================================================= */

const UUID_V4_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;


function isObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}


function isNonEmptyString(value, maxLength = 500) {
    return (
        typeof value === "string" &&
        value.trim().length > 0 &&
        value.length <= maxLength
    );
}


function isValidDate(value) {
    if (typeof value !== "string") {
        return false;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
        return false;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}


function formatDate(value) {
    const [year, month, day] = value.split("-").map(Number);

    return new Intl.DateTimeFormat("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC"
    }).format(new Date(Date.UTC(year, month - 1, day)));
}


function setText(element, value) {
    element.textContent = value ?? "—";
}


function showLoading() {
    elements.loading.hidden = false;
    elements.error.hidden = true;
    elements.certificate.hidden = true;
    elements.copyFeedback.textContent = "";
}


function showError(title, message) {
    elements.loading.hidden = true;
    elements.certificate.hidden = true;
    elements.error.hidden = false;

    setText(elements.errorTitle, title);
    setText(elements.errorMessage, message);
}


function showCertificate() {
    elements.loading.hidden = true;
    elements.error.hidden = true;
    elements.certificate.hidden = false;
}


/* =========================================================
   VALIDACIÓN DE REGISTROS
========================================================= */

function validateCertificate(record) {
    const errors = [];

    if (!isObject(record)) {
        return ["El registro no es un objeto válido."];
    }

    // Identificador
    if (
        typeof record.certificate_id !== "string" ||
        !UUID_V4_REGEX.test(record.certificate_id)
    ) {
        errors.push("El identificador UUID v4 es inválido.");
    }

    // Fecha
    if (!isValidDate(record.delivery_date)) {
        errors.push("La fecha de entrega no es válida.");
    }

    // Entregable
    if (!isObject(record.deliverable)) {
        errors.push("Falta la información del entregable.");
    } else {
        if (!isNonEmptyString(record.deliverable.type, 80)) {
            errors.push("El tipo de entregable es obligatorio.");
        }

        if (!isNonEmptyString(record.deliverable.name, 240)) {
            errors.push("El nombre del entregable es obligatorio.");
        }

        if (!isNonEmptyString(record.deliverable.subject, 160)) {
            errors.push("La asignatura o área es obligatoria.");
        }
    }

    // Servicio
    if (!isObject(record.service)) {
        errors.push("Falta la información del servicio.");
    } else {
        if (!isNonEmptyString(record.service.type, 80)) {
            errors.push("El tipo de servicio es obligatorio.");
        }

        if (!isNonEmptyString(record.service.description, 500)) {
            errors.push("La descripción del servicio es obligatoria.");
        }
    }

    // Revisor
    if (!isObject(record.reviewer)) {
        errors.push("Falta la información de la persona revisora.");
    } else {
        if (!isNonEmptyString(record.reviewer.name, 160)) {
            errors.push("El nombre de la persona revisora es obligatorio.");
        }

        if (!isNonEmptyString(record.reviewer.professional_title, 160)) {
            errors.push("El título profesional es obligatorio.");
        }

        // Credencial opcional
        if (
            record.reviewer.license !== undefined &&
            record.reviewer.license !== null
        ) {
            const license = record.reviewer.license;

            if (!isObject(license)) {
                errors.push("La credencial profesional tiene una estructura inválida.");
            } else {
                if (!isNonEmptyString(license.type, 80)) {
                    errors.push("El tipo de credencial es inválido.");
                }

                if (!isNonEmptyString(license.identifier, 120)) {
                    errors.push("El identificador de la credencial es inválido.");
                }

                if (
                    license.issuing_authority !== undefined &&
                    !isNonEmptyString(license.issuing_authority, 160)
                ) {
                    errors.push("La autoridad emisora es inválida.");
                }

                if (
                    !isNonEmptyString(license.country, 2) ||
                    !/^[A-Z]{2}$/.test(license.country)
                ) {
                    errors.push("El código de país de la credencial es inválido.");
                }
            }
        }
    }

    // Este visor solo admite información pública.
    if (Object.hasOwn(record, "private_data")) {
        errors.push("Este visor no admite el campo private_data.");
    }

    return errors;
}


/* =========================================================
   CARGA Y PREPARACIÓN DEL REGISTRO
========================================================= */

async function loadCertificates() {
    const response = await fetch(CONFIG.certificatesUrl, {
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(
            `No se pudo acceder a certificates.json (HTTP ${response.status}).`
        );
    }

    try {
        return await response.json();
    } catch {
        throw new Error(
            "El archivo certificates.json contiene JSON mal formado."
        );
    }
}


function findCertificate(records, requestedId) {
    if (!Array.isArray(records)) {
        return {
            status: "invalid-file"
        };
    }

    const matches = records.filter(record =>
        isObject(record) &&
        typeof record.certificate_id === "string" &&
        record.certificate_id.toLowerCase() === requestedId.toLowerCase()
    );

    if (matches.length === 0) {
        return {
            status: "not-found"
        };
    }

    if (matches.length > 1) {
        return {
            status: "duplicate"
        };
    }

    const record = matches[0];
    const errors = validateCertificate(record);

    if (errors.length > 0) {
        return {
            status: "invalid-record",
            errors
        };
    }

    return {
        status: "success",
        record
    };
}


/* =========================================================
   RENDERIZADO
========================================================= */

function renderCertificate(record) {
    setText(
        elements.deliverableName,
        record.deliverable.name
    );

    setText(
        elements.deliverableType,
        CONFIG.deliverableTypes[record.deliverable.type] ||
        record.deliverable.type
    );

    setText(
        elements.deliverableSubject,
        record.deliverable.subject
    );

    setText(
        elements.serviceDescription,
        record.service.description
    );

    setText(
        elements.serviceType,
        CONFIG.serviceTypes[record.service.type] ||
        record.service.type
    );

    setText(
        elements.reviewerName,
        record.reviewer.name
    );

    setText(
        elements.reviewerTitle,
        record.reviewer.professional_title
    );

    setText(
        elements.deliveryDate,
        formatDate(record.delivery_date)
    );

    setText(
        elements.certificateId,
        record.certificate_id
    );

    renderLicense(record.reviewer.license);

    elements.copyButton.dataset.certificateId =
        record.certificate_id;

    showCertificate();
}


function renderLicense(license) {
    if (!license) {
        elements.licenseContainer.hidden = true;
        return;
    }

    elements.licenseContainer.hidden = false;

    setText(
        elements.licenseType,
        license.type
    );

    setText(
        elements.licenseIdentifier,
        license.identifier
    );

    setText(
        elements.licenseCountry,
        license.country
    );

    if (license.issuing_authority) {
        elements.licenseAuthorityRow.hidden = false;

        setText(
            elements.licenseAuthority,
            license.issuing_authority
        );
    } else {
        elements.licenseAuthorityRow.hidden = true;
    }
}


/* =========================================================
   CONSULTA PRINCIPAL
========================================================= */

async function consultCertificate() {
    showLoading();

    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get("id");

    // No se proporcionó un ID.
    if (!requestedId || requestedId.trim() === "") {
        showError(
            "No se especificó una constancia",
            "Para consultar una constancia, utiliza el código QR o proporciona un identificador válido en la dirección de esta página."
        );
        return;
    }

    // UUID v4 inválido.
    if (!UUID_V4_REGEX.test(requestedId)) {
        showError(
            "Identificador inválido",
            "El identificador proporcionado no tiene un formato UUID versión 4 válido. Comprueba que el enlace o código QR sea correcto."
        );
        return;
    }

    let records;

    try {
        records = await loadCertificates();
    } catch (error) {
        console.error("[CenzoSphere] Error al cargar registros:", error);

        showError(
            "No se pudo acceder al registro",
            "No fue posible cargar la base de datos pública de constancias. Comprueba tu conexión e intenta nuevamente más tarde."
        );
        return;
    }

    if (!Array.isArray(records)) {
        showError(
            "Archivo de registros inválido",
            "El archivo certificates.json no tiene la estructura esperada. Contacta con CenzoSphere Education."
        );
        return;
    }

    const result = findCertificate(records, requestedId);

    switch (result.status) {
        case "not-found":
            showError(
                "Constancia no encontrada",
                "No existe ninguna constancia asociada al identificador proporcionado. Verifica el código QR o el enlace recibido."
            );
            return;

        case "duplicate":
            showError(
                "Registro duplicado",
                "El identificador aparece más de una vez en la base de datos. La consulta se ha bloqueado por seguridad."
            );
            console.error(
                "[CenzoSphere] ID duplicado:",
                requestedId
            );
            return;

        case "invalid-record":
            showError(
                "Registro inválido",
                "La constancia localizada contiene información incompleta o con un formato incorrecto. Contacta con CenzoSphere Education."
            );

            console.error(
                "[CenzoSphere] Errores de validación:",
                result.errors
            );
            return;

        case "invalid-file":
            showError(
                "Archivo de registros inválido",
                "La base de datos no tiene el formato esperado."
            );
            return;

        case "success":
            renderCertificate(result.record);
            return;

        default:
            showError(
                "Error inesperado",
                "Ocurrió un problema al procesar la constancia."
            );
    }
}


/* =========================================================
   COPIAR IDENTIFICADOR
========================================================= */

async function copyCertificateId() {
    const id = elements.copyButton.dataset.certificateId;

    if (!id) {
        return;
    }

    try {
        await navigator.clipboard.writeText(id);
        elements.copyFeedback.textContent =
            "Identificador copiado correctamente.";
    } catch {
        elements.copyFeedback.textContent =
            "No fue posible copiar el identificador.";
    }
}


/* =========================================================
   INICIALIZACIÓN
========================================================= */

elements.retryButton.addEventListener(
    "click",
    consultCertificate
);

elements.copyButton.addEventListener(
    "click",
    copyCertificateId
);

elements.currentYear.textContent =
    new Date().getFullYear();

consultCertificate();

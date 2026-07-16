// ========================================
// Configuration
// ========================================

// Do not include a trailing slash.
const API_BASE_URL =
    "https://curly-space-xylophone-7jwvxvxr94pcrr57-3000.app.github.dev";

// Your Formspree endpoint.
const FORMSPREE_URL =
    "https://formspree.io/f/xdaqkjdv";

// ========================================
// Mobile navigation
// ========================================

const menuButton = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

if (menuButton && navLinks) {
    menuButton.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("active");

        menuButton.setAttribute(
            "aria-expanded",
            String(isOpen)
        );
    });
}

// ========================================
// Device selection
// ========================================

const deviceSelect = document.getElementById("device");

const otherDeviceContainer = document.getElementById(
    "other-device-container"
);

const otherDeviceInput = document.getElementById(
    "other-device"
);

if (deviceSelect && otherDeviceContainer) {
    deviceSelect.addEventListener("change", () => {
        const otherSelected =
            deviceSelect.value === "Other";

        otherDeviceContainer.style.display =
            otherSelected ? "block" : "none";

        if (otherDeviceInput) {
            otherDeviceInput.required = otherSelected;

            if (!otherSelected) {
                otherDeviceInput.value = "";
            }
        }
    });
}

// ========================================
// Contact form
// ========================================

const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

if (contactForm) {
    contactForm.addEventListener(
        "submit",
        handleContactSubmission
    );
}

async function handleContactSubmission(event) {
    event.preventDefault();

    const submitButton = contactForm.querySelector(
        'button[type="submit"]'
    );

    const selectedDevice = deviceSelect.value;

    const finalDevice =
        selectedDevice === "Other"
            ? otherDeviceInput.value.trim()
            : selectedDevice;

    const formData = {
        name: document
            .getElementById("name")
            .value
            .trim(),

        email: document
            .getElementById("email")
            .value
            .trim(),

        phone: document
            .getElementById("phone")
            .value
            .trim(),

        device: finalDevice,

        message: document
            .getElementById("message")
            .value
            .trim()
    };

    if (
        !formData.name ||
        !formData.email ||
        !formData.phone ||
        !formData.device ||
        !formData.message
    ) {
        showStatus(
            "Please complete every required field.",
            true
        );

        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";

        showStatus(
            "Submitting your service request...",
            false
        );

        /*
         * Step 1:
         * Save the customer request in Neon through Express.
         */
        const neonResponse = await fetch(
            `${API_BASE_URL}/api/contact`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(formData)
            }
        );

        const neonText = await neonResponse.text();

        let neonResult;

        try {
            neonResult = JSON.parse(neonText);
        } catch {
            throw new Error(
                "The database server did not return a valid response."
            );
        }

        if (!neonResponse.ok) {
            throw new Error(
                neonResult.error ||
                neonResult.message ||
                "The request could not be stored in the database."
            );
        }

        /*
         * Step 2:
         * Send an email notification through Formspree.
         */
        const formspreeData = new FormData();

        formspreeData.append("name", formData.name);
        formspreeData.append("email", formData.email);
        formspreeData.append("phone", formData.phone);
        formspreeData.append("device", formData.device);
        formspreeData.append("message", formData.message);

        // Optional Formspree email subject.
        formspreeData.append(
            "_subject",
            `New service request from ${formData.name}`
        );

        const formspreeResponse = await fetch(
            FORMSPREE_URL,
            {
                method: "POST",

                headers: {
                    Accept: "application/json"
                },

                body: formspreeData
            }
        );

        const formspreeResult =
            await formspreeResponse.json();

        if (!formspreeResponse.ok) {
            console.error(
                "Formspree error:",
                formspreeResult
            );

            /*
             * The database insert already succeeded.
             * Tell the user the request was stored, even if
             * the notification email failed.
             */
            showStatus(
                "Your request was saved, but the email notification could not be sent.",
                true
            );

            return;
        }

        showStatus(
            "Your service request was submitted successfully.",
            false
        );

        contactForm.reset();

        if (otherDeviceContainer) {
            otherDeviceContainer.style.display = "none";
        }
    } catch (error) {
        console.error(
            "Contact submission error:",
            error
        );

        showStatus(
            `Request could not be submitted: ${error.message}`,
            true
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent =
            "Submit Service Request";
    }
}

// ========================================
// Status message
// ========================================

function showStatus(message, isError) {
    if (!formStatus) {
        alert(message);
        return;
    }

    formStatus.textContent = message;

    formStatus.className = isError
        ? "form-status error"
        : "form-status success";
}

console.log(
    "Zamora Tech Solutions website loaded."
);
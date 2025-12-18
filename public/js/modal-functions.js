// Global modal functions - load before contact-modal.html
function openContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.error('Contact modal not loaded');
    }
}

function closeContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal on outside click
window.addEventListener("click", function (event) {
    const modal = document.getElementById("contactModal");
    if (modal && event.target === modal) {
        modal.style.display = "none";
    }
});

// Contact form handler
async function handleContactSubmit(event) {
    event.preventDefault();

    const form = document.getElementById("contactForm");

    const payload = {
        name: form.name.value,
        email: form.email.value,
        subject: form.subject.value,
        message: form.message.value
    };

    try {
        const res = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error("Failed to send message");
        }

        alert("Message sent successfully.");
        form.reset();
        closeContactModal();
    } catch (err) {
        alert("There was a problem sending your message. Please try again.");
    }
}

// Load contact modal HTML
document.addEventListener('DOMContentLoaded', function() {
    fetch("/partials/contact-modal.html")
        .then(res => {
            if (!res.ok) throw new Error('Failed to load contact modal');
            return res.text();
        })
        .then(html => {
            document.getElementById("contact-modal-root").innerHTML = html;
        })
        .catch(err => {
            console.error('Contact modal load error:', err);
        });
});
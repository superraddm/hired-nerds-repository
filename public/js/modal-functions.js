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
function handleContactSubmit(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
    };

    const mailtoLink = `mailto:jof@jofdavies.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;

    window.location.href = mailtoLink;
    closeContactModal();
    document.getElementById('contactForm').reset();
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
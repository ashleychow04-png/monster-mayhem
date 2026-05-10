// LOGIN FUNCTION
// Handles user login validation and redirects to main game page
function login() {

    // Gets username input value from login form
    const username = document.getElementById("username").value;

    // Gets password input value from login form
    const password = document.getElementById("password").value;

    // Checks if both fields are filled
    if (username && password) {

        // Redirects user to main game page if login is valid
        window.location.href = "index.html";

    } else {

        // Shows error message if fields are empty
        document.getElementById("message").innerText =
            "Please enter username and password.";
    }
}

// SIGNUP FUNCTION
// Handles new user registration (basic check only)
function signup() {

    // Gets new username input value
    const username = document.getElementById("newUsername").value;

    // Gets new password input value
    const password = document.getElementById("newPassword").value;

    // Checks if both signup fields are filled
    if (username && password) {

        // Redirects user to game page after signup
        window.location.href = "index.html";

    } else {

        // Shows error message if signup fields are missing
        document.getElementById("message").innerText =
            "Please fill all fields.";
    }
}

// SHOW SIGNUP FORM
// Switches UI from login form to signup form
function showSignup() {

    // Hides login form
    document.getElementById("loginForm").style.display = "none";

    // Shows signup form
    document.getElementById("signupForm").style.display = "block";
}

// SHOW LOGIN FORM
// Switches UI back from signup form to login form
function showLogin() {

    // Shows login form
    document.getElementById("loginForm").style.display = "block";

    // Hides signup form
    document.getElementById("signupForm").style.display = "none";
}
function showCoinPopup(amount, x, y) {

    const popup = document.createElement("div");

    popup.className = "coin-popup";
    popup.innerText = `+${amount} 💰`;

    popup.style.left = (x || window.innerWidth / 2) + "px";
    popup.style.top = (y || window.innerHeight / 2) + "px";

    document.body.appendChild(popup);

    setTimeout(() => popup.remove(), 1000);
}
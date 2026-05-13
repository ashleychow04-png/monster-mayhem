// CURRENT USER
let currentUser = localStorage.getItem("currentUser");

// USERS DATABASE
let users = JSON.parse(localStorage.getItem("users")) || [];

// UPDATE NAV BAR
function updateNavDisplay() {

    let user = users.find(
        u => u.username === currentUser
    );

    // IF USER NOT FOUND
    if (!user) {

        document.getElementById("userDisplay")
            .innerText = "Not logged in";

        return;
    }

    // SHOW USER + COINS
    document.getElementById("userDisplay").innerHTML =
        `👤 ${currentUser} | 💰 ${user.coins}`;
}

// BUY CHARACTER
function buyCharacter(char, price) {

    let userIndex = users.findIndex(
        u => u.username === currentUser
    );

    // NO USER
    if (userIndex === -1) {

        alert("Please log in first!");
        return;
    }

    // ENOUGH COINS
    if (users[userIndex].coins >= price) {

        // REMOVE COINS
        users[userIndex].coins -= price;

        // EQUIP CHARACTER
        users[userIndex].character = char;

        // SAVE
        localStorage.setItem(
            "users",
            JSON.stringify(users)
        );

        // UPDATE DISPLAY
        updateNavDisplay();

        alert("You bought " + char);

    } else {

        alert("Not enough coins!");
    }
}

// LOGIN CHECK
if (!currentUser) {

    window.location.href = "login.html";
}

// START
updateNavDisplay();
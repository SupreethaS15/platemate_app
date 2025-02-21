// Authentication Check
function authCheck(page) {
    if (!isUserLoggedIn()) {
        alert("Please log in to access this feature.");
        showPage('login');
    } else {
        showPage(page);
    }
}

// Check if user is authenticated
function isUserLoggedIn() {
    return localStorage.getItem("userId") !== null;
}
// 🟢 Enhanced Login Function
async function login() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();
    const errorElement = document.getElementById("login-error");

    if (!email || !password) {
        errorElement.textContent = "Please fill in all fields.";
        return;
    }

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("userId", data.user.id);
            localStorage.setItem("userName", data.user.name);
            localStorage.setItem("userEmail", data.user.email);
            showPage("profile");
        } else {
            errorElement.textContent = "Invalid email or password.";
        }
    } catch (error) {
        console.error("Login error:", error);
        errorElement.textContent = "An error occurred during login.";
    }
}

// 🟢 Enhanced Signup Function
async function register() {
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value.trim();
    const errorElement = document.getElementById("signup-error");

    if (!name || !email || !password) {
        errorElement.textContent = "Please fill in all fields.";
        return;
    }

    try {
        const response = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });

        if (response.ok) {
            alert("Registration successful! Please log in.");
            showPage("login");
        } else {
            const errorData = await response.json();
            errorElement.textContent = errorData.message || "Registration failed.";
        }
    } catch (error) {
        console.error("Signup error:", error);
        errorElement.textContent = "An error occurred during signup.";
    }
}

// Page Navigation
function showPage(page) {
    const pages = ['home', 'shop', 'login', 'signup', 'profile'];
    pages.forEach(p => {
        document.getElementById(p).style.display = page === p ? 'flex' : 'none';
    });
    if (page === 'profile') loadProfile();
}

// 🥗 Fetch recipes by mood and display as cards
async function fetchRecipes(mood) {
    try {
        const response = await fetch(`/recipes/mood/${encodeURIComponent(mood)}`);
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

        const data = await response.json();
        const resultContainer = document.getElementById("recipe-results");
        resultContainer.innerHTML = data.map(recipe => `
            <div class="card" onclick="viewRecipe('${recipe.id}')">
                <h4>${recipe.title}</h4>
                <button onclick="saveRecipe(event, '${recipe.id}', '${recipe.title}')">Save Recipe</button>
            </div>
        `).join("");
    } catch (error) {
        console.error("Error fetching recipes:", error);
    }
}

// 🍳 Add ingredient to input field
function addIngredient(ingredient) {
    const inputField = document.getElementById("user-ingredients");
    inputField.value += inputField.value ? `, ${ingredient}` : ingredient;
}

// 🥘 Suggest recipes based on ingredients and display as cards
async function suggestRecipes() {
    const ingredients = document.getElementById("user-ingredients").value.trim();
    if (!ingredients) return alert("Please enter some ingredients.");

    try {
        const response = await fetch(`/recipes/ingredients?ingredients=${encodeURIComponent(ingredients)}`);
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

        const data = await response.json();
        const resultContainer = document.getElementById("ingredient-recipe-results");
        resultContainer.innerHTML = data.map(recipe => `
            <div class="card" onclick="viewRecipe('${recipe.id}')">
                <img src="${recipe.image}" alt="${recipe.title}">
                <h4>${recipe.title}</h4>
                <button onclick="saveRecipe(event, '${recipe.id}', '${recipe.title}')">Save Recipe</button>
            </div>
        `).join("");
    } catch (error) {
        console.error("Error suggesting recipes:", error);
    }
}

// 🍽️ Fetch top 5 restaurants and display as cards
async function findRestaurants() {
    const city = document.getElementById("location").value.trim();
    if (!city) return alert("Please enter a location!");

    try {
        const response = await fetch(`/restaurants/city/${encodeURIComponent(city)}`);
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

        const data = await response.json();
        const resultContainer = document.getElementById("restaurant-results");
        resultContainer.innerHTML = data.map(restaurant => `
            <div class="card clickable" onclick="toggleAddress('${restaurant.display_name}')">
                <h4>${restaurant.display_name}</h4>
                <p class="address" id="address-${restaurant.display_name}" style="display:none;">${restaurant.address}</p>
            </div>
        `).join("");
    } catch (error) {
        console.error("Error fetching restaurants:", error);
    }
}

// 🍴 Toggle restaurant address visibility
function toggleAddress(name) {
    const addressElement = document.getElementById(`address-${name}`);
    addressElement.style.display = addressElement.style.display === 'none' ? 'block' : 'none';
}

// 🔖 Save Recipe to Profile
async function saveRecipe(event, recipeId, title) {
    event.stopPropagation(); // Prevent card click event
    const userId = localStorage.getItem("userId");
    try {
        const response = await fetch(`/save-recipe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, recipeId, title })
        });

        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        alert("Recipe saved successfully!");
    } catch (error) {
        console.error("Error saving recipe:", error);
        alert("Failed to save recipe.");
    }
}

// 👤 Load profile data and display saved recipes
async function loadProfile() {
    document.getElementById("profile-name").innerText = localStorage.getItem("userName") || "N/A";
    document.getElementById("profile-email").innerText = localStorage.getItem("userEmail") || "N/A";

    const userId = localStorage.getItem("userId");
    try {
        const response = await fetch(`/get-saved-recipes/${userId}`);
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

        const savedRecipes = await response.json();
        const savedContainer = document.getElementById("saved-recipes");
        savedContainer.innerHTML = savedRecipes.length 
            ? savedRecipes.map(recipe => `<div class="card">${recipe.title}</div>`).join("")
            : "<p>No saved recipes yet.</p>";
    } catch (error) {
        console.error("Error fetching saved recipes:", error);
    }
}

// 🚪 Logout user
function logout() {
    localStorage.clear();
    alert("Logged out successfully!");
    showPage('login');
}

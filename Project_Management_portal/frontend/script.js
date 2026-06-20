const API_URL = "http://localhost:5000";

// LOGIN
async function login() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.token) {
        localStorage.setItem("token", data.token);

        document.getElementById("authSection").style.display = "none";
        document.getElementById("taskSection").style.display = "block";

        getTasks();
    } else {
        alert("Login failed");
    }
}

// ADD TASK
async function addTask() {
    const token = localStorage.getItem("token");

    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;

    await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
    });

    getTasks();
}

// GET TASKS
async function getTasks() {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/tasks`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const tasks = await res.json();

    const list = document.getElementById("taskList");
    list.innerHTML = "";

    tasks.forEach(task => {
        const li = document.createElement("li");

        li.innerHTML = `
            <b>${task.title}</b> - ${task.description} 
            (${task.status})
            
            <button onclick="markDone(${task.id})">Done</button>
            <button onclick="deleteTask(${task.id})">Delete</button>
        `;

        list.appendChild(li);
    });
}

// DONE
async function markDone(id) {
    const token = localStorage.getItem("token");

    await fetch(`${API_URL}/tasks/${id}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    getTasks();
}

// DELETE
async function deleteTask(id) {
    const token = localStorage.getItem("token");

    await fetch(`${API_URL}/tasks/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    getTasks();
}

// AUTO LOAD
window.onload = () => {
    const token = localStorage.getItem("token");

    if (token) {
        document.getElementById("authSection").style.display = "none";
        document.getElementById("taskSection").style.display = "block";
        getTasks();
    }
};
function logout() {
    // Remove token
    localStorage.removeItem("token");

    // Clear task list UI
    document.getElementById("taskList").innerHTML = "";

    // Optional: clear inputs
    document.getElementById("title").value = "";
    document.getElementById("description").value = "";

    // Hide task section (if you added auth UI control)
    document.getElementById("taskSection").style.display = "none";

    alert("Logged out successfully");
}
function resetApp() {
    // Clear all inputs
    document.getElementById("regUsername").value = "";
    document.getElementById("regPassword").value = "";
    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
    document.getElementById("title").value = "";
    document.getElementById("description").value = "";

    // Clear tasks from UI
    document.getElementById("taskList").innerHTML = "";

    // Remove token (logs out user)
    localStorage.removeItem("token");

    // Hide task section if you are using it
    const taskSection = document.getElementById("taskSection");
    if (taskSection) taskSection.style.display = "none";

    alert("App reset successfully");
}
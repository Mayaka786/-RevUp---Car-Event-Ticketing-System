document.addEventListener("DOMContentLoaded", () => {
  fetchStats();
  fetchEvents();

  const form = document.getElementById("eventForm");

  form.onsubmit = async (e) => {
    e.preventDefault();

    const eventId = document.getElementById("eventId").value;

    const newEvent = {
      title: document.getElementById("title").value,
      category: document.getElementById("category").value,
      location: document.getElementById("location").value,
      eventDate: document.getElementById("eventDate").value,
      price: document.getElementById("price").value,
      description: document.getElementById("description").value,
    };

    const method = eventId ? "PUT" : "POST";
    const endpoint = eventId ? `/api/events/${eventId}` : "/api/events";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });

      const data = await res.json();
      if (data.success) {
        hideModal();
        form.reset();
        document.getElementById("eventId").value = "";
        fetchEvents();
        fetchStats();
        alert(eventId ? "✅ Event updated successfully!" : "✅ Event created successfully!");
      } else {
        alert((eventId ? "Update" : "Create") + " failed: " + data.error);
      }
    } catch (err) {
      console.error((eventId ? "Update" : "Create") + " error:", err);
      alert("Server error while " + (eventId ? "updating" : "creating") + " event");
    }
  };

  document.getElementById('searchInput').addEventListener('input', fetchEvents);
  document.getElementById('categoryFilter').addEventListener('change', fetchEvents);
});

// 📊 Stats
async function fetchStats() {
  try {
    const res = await fetch("/api/admin/stats");
    const data = await res.json();
    if (data.success) {
      document.getElementById("totalEvents").textContent = data.stats.totalEvents;
      document.getElementById("ticketsSold").textContent = data.stats.ticketsSold;
      document.getElementById("totalRevenue").textContent =
        "KES " + (data.stats.revenue || 0).toLocaleString();
    }
  } catch (err) {
    console.error("Stats fetch error:", err);
  }
}

// 🎟 Events Table
async function fetchEvents() {
  try {
    const res = await fetch("/api/events");
    const data = await res.json();
    const tbody = document.querySelector("#eventsTable tbody");
    tbody.innerHTML = "";

    const searchValue = document.getElementById("searchInput")?.value?.toLowerCase() || "";
    const categoryFilter = document.getElementById("categoryFilter")?.value || "";

    if (data.success) {
      let filteredEvents = data.events;

      if (searchValue) {
        filteredEvents = filteredEvents.filter(event =>
          event.title.toLowerCase().includes(searchValue)
        );
      }

      if (categoryFilter) {
        filteredEvents = filteredEvents.filter(event =>
          event.category.toLowerCase() === categoryFilter.toLowerCase()
        );
      }

      filteredEvents.forEach((event) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${event.title}</td>
          <td>${new Date(event.eventDate).toLocaleString()}</td>
          <td>${event.category}</td>
          <td>${event.location}</td>
          <td>KES ${parseFloat(event.price).toFixed(2)}</td>
          <td>
            <button onclick="editEvent(${event.eventId})">Edit</button>
            <button onclick="deleteEvent(${event.eventId})">Delete</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    }
  } catch (err) {
    console.error("Event fetch error:", err);
  }
}

// ✏️ Edit
function editEvent(id) {
  fetch("/api/events")
    .then((res) => res.json())
    .then((data) => {
      const event = data.events.find((e) => e.eventId === id);
      if (event) {
        document.getElementById("title").value = event.title;
        document.getElementById("category").value = event.category;
        document.getElementById("description").value = event.description;
        document.getElementById("location").value = event.location;
        document.getElementById("eventDate").value = event.eventDate.slice(0, 16);
        document.getElementById("price").value = event.price;
        document.getElementById("eventId").value = event.eventId;
        showModal();
      }
    });
}

// ❌ Delete
async function deleteEvent(eventId) {
  if (!confirm("Are you sure you want to delete this event?")) return;
  try {
    const res = await fetch(`/api/events/${eventId}`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (data.success) {
      fetchEvents();
      fetchStats();
      alert("🗑️ Event deleted successfully.");
    } else {
      alert("Failed to delete: " + data.error);
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Server error while deleting event");
  }
}

// 🔓 Logout
function logout() {
  fetch("/api/admin/logout", { method: "POST" }).then(() => {
    alert("Logged out successfully");
    window.location.href = "admin-login.html";
  });
}

// Modal controls
function showModal() {
  document.getElementById("eventModal").classList.remove("hidden");
}
function hideModal() {
  document.getElementById("eventModal").classList.add("hidden");
  document.getElementById("eventForm").reset();
  document.getElementById("eventId").value = "";
}

// Ensure eventDate can’t be past
window.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById('eventDate');
  const now = new Date();
  const iso = now.toISOString().slice(0, 16);
  dateInput.min = iso;
});

function exportEvents() {
  window.open('/api/admin/export/events/csv', '_blank');
}

function exportTickets() {
  window.open('/api/admin/export/tickets/csv', '_blank');
}

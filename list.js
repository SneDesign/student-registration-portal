// list.js
const STORAGE_KEY = 'qac_students';

function loadStudents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveStudents(students) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function render(students) {
  const tbody = document.querySelector('#students tbody');
  tbody.innerHTML = '';

  if (!students.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No students yet.</td></tr>`;
    return;
  }

  for (const s of students) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.name}</td>
      <td>${s.surname}</td>
      <td>${s.email}</td>
      <td>${s.phone}</td>
      <td>${s.course}</td>
      <td>${s.id_number}</td>
      <td>
        <button class="btn sm danger" data-id="${s.id_number}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

function attachEvents() {
  const search = document.getElementById('search');
  const tbody = document.querySelector('#students tbody');

  // Filter
  search?.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    const all = loadStudents();
    const filtered = all.filter(s =>
      [s.name, s.surname, s.email, s.phone, s.course, s.id_number]
        .some(v => String(v).toLowerCase().includes(q))
    );
    render(filtered);
  });

  // Delete (event delegation)
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const all = loadStudents().filter(s => s.id_number !== id);
    saveStudents(all);
    render(all);
  });

  // If register.html updates localStorage in another tab, update list live
  window.addEventListener('storage', (evt) => {
    if (evt.key === STORAGE_KEY) {
      render(loadStudents());
    }
  });
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  attachEvents();
  render(loadStudents());
});

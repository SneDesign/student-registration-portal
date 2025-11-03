
const form = document.getElementById('editForm');
const statusEl = document.getElementById('formStatus');

const params = new URLSearchParams(location.search);
const id = params.get('id');
if (!id) {
  location.href = 'index.html';
}

async function load() {
  const res = await fetch('/api/students/' + id);
  if (!res.ok) return alert('Student not found');
  const s = await res.json();
  form.elements.id.value = s.id;
  form.elements.name.value = s.name;
  form.elements.surname.value = s.surname;
  form.elements.email.value = s.email;
  form.elements.phone.value = s.phone;
  form.elements.id_number.value = s.id_number;
  form.elements.course.value = s.course;
  form.elements.address.value = s.address || '';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.textContent = '';
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const res = await fetch('/api/students/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      statusEl.textContent = 'Student details successfully updated.';
    } else {
      const j = await res.json();
      statusEl.textContent = j.error || (j.errors ? j.errors.map(x=>x.msg).join(', ') : 'Failed to update');
    }
  } catch (err) {
    statusEl.textContent = 'Network error';
  }
});

load();

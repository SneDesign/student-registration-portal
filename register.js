// register.js
(function () {
  const STORAGE_KEY = 'qac_students';
  const form = document.getElementById('regForm');
  const statusEl = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  function setStatus(msg, type = 'info') {
    statusEl.textContent = msg;
    statusEl.className = `status ${type}`;
  }

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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus('Please correct the highlighted fields.', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      setStatus('Saving…');

      const data = Object.fromEntries(new FormData(form).entries());

      // Optional: prevent duplicate ID numbers
      const students = loadStudents();
      if (students.some(s => s.id_number === data.id_number)) {
        setStatus('A student with that ID number already exists.', 'error');
        submitBtn.disabled = false;
        return;
      }

      students.push({
        name: data.name?.trim(),
        surname: data.surname?.trim(),
        email: data.email?.trim(),
        phone: data.phone?.trim(),
        course: data.course,
        id_number: data.id_number?.trim(),
        address: data.address?.trim() || ''
      });

      saveStudents(students);

      setStatus('Student registered successfully.', 'success');
      await new Promise(r => setTimeout(r, 500));
      // Go back to list
      window.location.href = 'index.html';
    } catch (err) {
      setStatus('Something went wrong. Please try again.', 'error');
      console.error(err);
    } finally {
      submitBtn.disabled = false;
    }
  });
})();

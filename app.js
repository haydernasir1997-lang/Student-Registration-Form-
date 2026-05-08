
const STORAGE_KEY = 'edu_students';


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


function showSection(sectionId) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById(sectionId).classList.add('active');

  const btnIndex = sectionId === 'form-section' ? 0 : 1;
  document.querySelectorAll('.nav-btn')[btnIndex].classList.add('active');

  if (sectionId === 'records-section') renderRecords();
}


const validators = {
  firstName:  v => v.trim().length >= 2 ? null : 'First name must be at least 2 characters.',
  lastName:   v => v.trim().length >= 2 ? null : 'Last name must be at least 2 characters.',
  studentId:  v => v.trim().length >= 3 ? null : 'Student ID is required.',
  dob:        v => v ? (new Date(v) < new Date() ? null : 'Date of birth must be in the past.') : 'Date of birth is required.',
  gender:     v => v ? null : 'Please select a gender.',
  email:      v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Enter a valid email address.',
  department: v => v ? null : 'Please select a department.',
  year:       v => v ? null : 'Please select a year of study.',
  enrollDate: v => v ? null : 'Enrollment date is required.',
  phone:      v => !v || /^[+\d\s\-()]{7,20}$/.test(v) ? null : 'Enter a valid phone number.',
};

function validateField(name, value) {
  const fn = validators[name];
  return fn ? fn(value) : null;
}

function showError(fieldName, msg) {
  const el = document.getElementById('err-' + fieldName);
  const input = document.getElementById(fieldName);
  if (el) el.textContent = msg || '';
  if (input) {
    msg ? input.classList.add('invalid') : input.classList.remove('invalid');
  }
}

function validateAll(data) {
  let valid = true;
  const required = ['firstName','lastName','studentId','dob','gender','email','department','year','enrollDate'];
  required.forEach(f => {
    const err = validateField(f, data[f] || '');
    showError(f, err);
    if (err) valid = false;
  });
  // Optional phone
  const phoneErr = validateField('phone', data.phone || '');
  showError('phone', phoneErr);
  if (phoneErr) valid = false;
  return valid;
}


function getFormData() {
  const ids = ['firstName','lastName','studentId','dob','gender','email','phone','nationality',
               'department','year','enrollDate','status','address'];
  const data = {};
  ids.forEach(id => {
    const el = document.getElementById(id);
    data[id] = el ? el.value.trim() : '';
  });
  return data;
}


function resetForm() {
  document.getElementById('registrationForm').reset();
  const errFields = ['firstName','lastName','studentId','dob','gender','email','phone','department','year','enrollDate'];
  errFields.forEach(f => showError(f, ''));
}


function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');
  const icon  = toast.querySelector('.toast-icon');

  msgEl.textContent = msg;
  icon.textContent = isError ? '✕' : '✓';
  icon.style.color = isError ? 'var(--error)' : 'var(--success)';
  toast.style.borderColor = isError ? 'rgba(248,113,113,.3)' : 'rgba(52,211,153,.3)';

  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}


document.getElementById('registrationForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const data = getFormData();
  if (!validateAll(data)) {
    showToast('Please fix the errors before submitting.', true);
    return;
  }

 
  const students = loadStudents();
  if (students.find(s => s.studentId.toLowerCase() === data.studentId.toLowerCase())) {
    showError('studentId', 'This Student ID is already registered.');
    document.getElementById('studentId').classList.add('invalid');
    showToast('Duplicate Student ID detected.', true);
    return;
  }

  data.id = Date.now();
  data.registeredAt = new Date().toISOString();
  students.push(data);
  saveStudents(students);

  resetForm();
  showToast(`${data.firstName} ${data.lastName} registered successfully!`);
});


['firstName','lastName','studentId','dob','gender','email','phone','department','year','enrollDate'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('blur', () => {
    const err = validateField(id, el.value.trim());
    showError(id, err);
  });
  el.addEventListener('input', () => {
    if (el.classList.contains('invalid')) {
      const err = validateField(id, el.value.trim());
      showError(id, err);
    }
  });
});


function badgeClass(status) {
  const map = {
    'Active':    'badge-active',
    'Part-time': 'badge-parttime',
    'Exchange':  'badge-exchange',
    'Deferred':  'badge-deferred',
  };
  return map[status] || 'badge-active';
}


function renderRecords(filter = '') {
  let students = loadStudents();

  if (filter) {
    const q = filter.toLowerCase();
    students = students.filter(s =>
      (s.firstName + ' ' + s.lastName).toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  }

  const tbody = document.getElementById('recordsBody');
  const countEl = document.getElementById('recordsCount');
  const all = loadStudents();

  countEl.textContent = all.length === 0
    ? 'No students registered yet.'
    : `Showing ${students.length} of ${all.length} student${all.length !== 1 ? 's' : ''}.`;

  if (students.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="8">${filter ? 'No matching records found.' : 'No students registered yet.'}</td>
      </tr>`;
    return;
  }

  tbody.innerHTML = students.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><code>${escHtml(s.studentId)}</code></td>
      <td>${escHtml(s.firstName)} ${escHtml(s.lastName)}</td>
      <td>${escHtml(s.department)}</td>
      <td>${escHtml(s.year)}</td>
      <td>${escHtml(s.email)}</td>
      <td><span class="badge ${badgeClass(s.status)}">${escHtml(s.status || 'Active')}</span></td>
      <td><button class="btn-delete" onclick="deleteStudent(${s.id})">Delete</button></td>
    </tr>
  `).join('');
}


function deleteStudent(id) {
  if (!confirm('Are you sure you want to delete this student record?')) return;
  let students = loadStudents().filter(s => s.id !== id);
  saveStudents(students);
  renderRecords(document.getElementById('searchInput').value);
  showToast('Student record deleted.');
}


function clearAllRecords() {
  if (!confirm('This will permanently delete ALL student records. Are you sure?')) return;
  saveStudents([]);
  renderRecords();
  showToast('All records cleared.');
}


function filterRecords() {
  const q = document.getElementById('searchInput').value;
  renderRecords(q);
}


function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


(function init() { 
  const enrollEl = document.getElementById('enrollDate');
  if (enrollEl) enrollEl.valueAsDate = new Date();
})();

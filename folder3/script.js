const doctors = [
  {
    name: 'Dr. Tamil Selvi',
    specialty: 'General Physician',
    location: 'Central Hospital',
    availability: 'Available now',
    phone: '123-456-7890',
  },
  {
    name: 'Dr. Ravi Kumar',
    specialty: 'Cardiologist',
    location: 'Heart Care Clinic',
    availability: 'On call',
    phone: '354-624-3729',
  },
  {
    name: 'Dr. Anjali Mehta',
    specialty: 'Orthopedic Surgeon',
    location: 'City Ortho Center',
    availability: 'By appointment',
    phone: '354-624-3729',
  },
  {
    name: 'Dr. Brindha',
    specialty: 'Pediatrician',
    location: 'Children Care Hospital',
    availability: 'Available now',
    phone: '348-102-3948',
  },
];

const doctorGrid = document.getElementById('doctorGrid');
const resultSummary = document.getElementById('resultSummary');
const searchName = document.getElementById('searchName');
const searchLocation = document.getElementById('searchLocation');
const searchAvailability = document.getElementById('searchAvailability');
const resetFilters = document.getElementById('resetFilters');
const searchButton = document.getElementById('searchButton');
const searchPanel = document.getElementById('searchPanel');

function renderDoctors() {
  const nameTerm = searchName.value.trim().toLowerCase();
  const locationTerm = searchLocation.value.trim().toLowerCase();
  const availability = searchAvailability.value;

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesName =
      !nameTerm ||
      doctor.name.toLowerCase().includes(nameTerm) ||
      doctor.specialty.toLowerCase().includes(nameTerm);
    const matchesLocation = !locationTerm || doctor.location.toLowerCase().includes(locationTerm);
    const matchesAvailability = !availability || doctor.availability === availability;

    return matchesName && matchesLocation && matchesAvailability;
  });

  resultSummary.textContent =
    filteredDoctors.length === doctors.length
      ? 'Showing all nearby providers.'
      : `Showing ${filteredDoctors.length} matching provider${filteredDoctors.length === 1 ? '' : 's'}.`;

  if (filteredDoctors.length === 0) {
    doctorGrid.innerHTML = '<div class="empty-state">No doctors match your search. Try changing the filters.</div>';
    return;
  }

  doctorGrid.innerHTML = filteredDoctors
    .map(
      (doctor) => `
        <article class="doctor-result-card">
          <div>
            <span class="availability">${doctor.availability}</span>
            <h3>${doctor.name}</h3>
            <p>${doctor.specialty}</p>
          </div>
          <div class="doctor-meta">
            <span>${doctor.location}</span>
            <a href="tel:${doctor.phone.replaceAll('-', '')}">${doctor.phone}</a>
          </div>
          <a class="button primary" href="doctors.html">Book Appointment</a>
        </article>
      `
    )
    .join('');
}

searchName.addEventListener('input', renderDoctors);
searchLocation.addEventListener('input', renderDoctors);
searchAvailability.addEventListener('change', renderDoctors);

resetFilters.addEventListener('click', () => {
  searchName.value = '';
  searchLocation.value = '';
  searchAvailability.value = '';
  renderDoctors();
});

searchButton.addEventListener('click', () => {
  searchPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  searchName.focus();
});

renderDoctors();

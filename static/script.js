const form = document.querySelector('#predict-form');
const textarea = document.querySelector('#symptoms');
const predictBtn = document.querySelector('#predict-btn');
const exampleBtn = document.querySelector('#example-btn');
const errorBox = document.querySelector('#error');
const diseaseName = document.querySelector('#disease-name');
const detectedList = document.querySelector('#detected-list');
const chips = document.querySelectorAll('[data-chip]');
const symptomBtn = document.querySelector('#symptom-btn');
const symptomSection = document.querySelector('#symptom-section');
const symptomList = document.querySelector('#symptom-list');
const symptomStatus = document.querySelector('#symptom-status');

const exampleText = 'high fever, pounding headache, dry cough, body ache';
let symptomsLoaded = false;

const setLoading = (state) => {
  predictBtn.disabled = state;
  predictBtn.textContent = state ? 'Predicting...' : 'Predict now';
};

const setError = (message) => {
  errorBox.textContent = message || '';
};

const renderDetected = (items) => {
  detectedList.innerHTML = '';
  if (!items || !items.length) {
    const li = document.createElement('li');
    li.textContent = 'Nada por enquanto.';
    li.classList.add('muted');
    detectedList.appendChild(li);
    return;
  }
  items.forEach((symptom) => {
    const li = document.createElement('li');
    li.textContent = symptom;
    detectedList.appendChild(li);
  });
};

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const value = chip.dataset.chip;
    const current = textarea.value.trim();
    const alreadyIncluded = current
      .toLowerCase()
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .includes(value.toLowerCase());
    if (alreadyIncluded) return;
    textarea.value = current ? `${current}, ${value}` : value;
  });
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  setError('');
  const symptoms = textarea.value.trim();
  if (!symptoms) {
    setError('Describe at least one symptom.');
    return;
  }
  setLoading(true);
  try {
    const response = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms }),
    });
    const data = await response.json();
    if (!response.ok || data.Error) {
      setError(data.Error || 'Could not predict right now.');
      diseaseName.textContent = 'Awaiting your description';
      renderDetected([]);
      return;
    }
    diseaseName.textContent = data.predicted_disease;
    renderDetected(data.symptoms_detected);
  } catch (err) {
    setError('Connection failed. Please try again.');
  } finally {
    setLoading(false);
  }
});

exampleBtn?.addEventListener('click', () => {
  textarea.value = exampleText;
  textarea.focus();
  setError('');
});

symptomBtn?.addEventListener('click', async () => {
  symptomSection?.classList.remove('hidden');
  if (symptomsLoaded) {
    symptomList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  symptomBtn.disabled = true;
  symptomStatus.textContent = 'Loading symptoms...';
  try {
    const res = await fetch('/symptoms');
    const data = await res.json();
    const items = data.symptoms || [];
    symptomList.innerHTML = '';
    if (!items.length) {
      symptomStatus.textContent = 'No symptoms available.';
    } else {
      symptomStatus.textContent = 'Tap any symptom to add it to your description.';
      items.forEach((sym) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'symptom-pill';
        pill.textContent = sym;
        pill.addEventListener('click', () => {
          const current = textarea.value.trim();
          const exists = current
            .toLowerCase()
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
            .includes(sym.toLowerCase());
          if (exists) return;
          textarea.value = current ? `${current}, ${sym}` : sym;
          textarea.focus();
        });
        symptomList.appendChild(pill);
      });
      symptomsLoaded = true;
      symptomList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (e) {
    symptomStatus.textContent = 'Failed to load symptoms. Try again.';
  } finally {
    symptomBtn.disabled = false;
  }
});

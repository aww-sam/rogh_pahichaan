const form = document.querySelector('#predict-form');
const textarea = document.querySelector('#symptoms');
const predictBtn = document.querySelector('#predict-btn');
const exampleBtn = document.querySelector('#example-btn');
const errorBox = document.querySelector('#error');
const diseaseName = document.querySelector('#disease-name');
const detectedList = document.querySelector('#detected-list');
const chips = document.querySelectorAll('[data-chip]');

const exampleText = 'febre alta, dor de cabeça, fadiga, náusea';

const setLoading = (state) => {
  predictBtn.disabled = state;
  predictBtn.textContent = state ? 'Prevendo...' : 'Prever agora';
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
    setError('Descreva ao menos um sintoma.');
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
      setError(data.Error || 'Não foi possível prever agora.');
      diseaseName.textContent = 'Aguardando sua descrição';
      renderDetected([]);
      return;
    }
    diseaseName.textContent = data.predicted_disease;
    renderDetected(data.symptoms_detected);
  } catch (err) {
    setError('Falha de conexão. Tente novamente.');
  } finally {
    setLoading(false);
  }
});

exampleBtn?.addEventListener('click', () => {
  textarea.value = exampleText;
  textarea.focus();
  setError('');
});

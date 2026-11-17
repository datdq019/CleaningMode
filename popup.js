let currentLang = 'vi';
let selectedTheme = 'dark';
const hasExternalMouse = window.matchMedia('(any-pointer: fine)').matches;

const kbToggle = document.getElementById('kbToggle');
const tpToggle = document.getElementById('tpToggle');
const kbTrack = document.getElementById('kbTrack');
const tpTrack = document.getElementById('tpTrack');
const safetyAlert = document.getElementById('safetyAlert');
const startCleanBtn = document.getElementById('startCleanBtn');
const langToggleBtn = document.getElementById('langToggleBtn');

const i18n = {
  vi: {
    notice: "Chế độ Fullscreen ẩn taskbar và chặn trình duyệt. Phím hệ thống (Windows, Alt+Tab) do OS quản lý.",
    kb: "Khóa Bàn phím", tp: "Khóa Touchpad", theme: "Giao diện màu sắc:", timer: "Thời gian:",
    safety: "Không phát hiện chuột ngoại vi! Chỉ được khóa 1 trong 2 thiết bị.",
    btn: "Bắt đầu Vệ sinh (Fullscreen)"
  },
  en: {
    notice: "Fullscreen mode hides taskbar and browser input. System keys (Windows, Alt+Tab) are managed by OS.",
    kb: "Lock Keyboard", tp: "Lock Touchpad", theme: "Theme Style:", timer: "Timer:",
    safety: "No external mouse detected! You can only lock 1 of the 2 devices.",
    btn: "Start Cleaning (Fullscreen)"
  }
};

function updateLangTexts() {
  const t = i18n[currentLang];
  document.getElementById('txtNotice').textContent = t.notice;
  document.getElementById('txtKb').textContent = t.kb;
  document.getElementById('txtTp').textContent = t.tp;
  document.getElementById('txtTheme').textContent = t.theme;
  document.getElementById('txtTimer').textContent = t.timer;
  document.getElementById('txtSafety').textContent = t.safety;
  startCleanBtn.textContent = t.btn;
  langToggleBtn.textContent = currentLang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN';
}

langToggleBtn.addEventListener('click', () => {
  currentLang = currentLang === 'vi' ? 'en' : 'vi';
  updateLangTexts();
});

function updateToggles() {
  kbTrack.style.backgroundColor = kbToggle.checked ? 'var(--accent)' : 'rgba(148,163,184,0.3)';
  tpTrack.style.backgroundColor = tpToggle.checked ? 'var(--accent)' : 'rgba(148,163,184,0.3)';
  kbToggle.nextElementSibling.nextElementSibling.style.transform = kbToggle.checked ? 'translateX(18px)' : 'translateX(2px)';
  tpToggle.nextElementSibling.nextElementSibling.style.transform = tpToggle.checked ? 'translateX(18px)' : 'translateX(2px)';
}

function validateSafety() {
  updateToggles();
  if (!hasExternalMouse && kbToggle.checked && tpToggle.checked) {
    safetyAlert.style.display = 'block';
    startCleanBtn.disabled = true;
  } else if (!kbToggle.checked && !tpToggle.checked) {
    safetyAlert.style.display = 'none';
    startCleanBtn.disabled = true;
  } else {
    safetyAlert.style.display = 'none';
    startCleanBtn.disabled = false;
  }
}

kbToggle.addEventListener('change', validateSafety);
tpToggle.addEventListener('change', validateSafety);

document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedTheme = btn.getAttribute('data-theme');
    document.body.setAttribute('data-theme', selectedTheme);
  });
});

startCleanBtn.addEventListener('click', () => {
  const duration = document.getElementById('durationSelect').value;
  const url = chrome.runtime.getURL(`clean.html?kb=${kbToggle.checked}&tp=${tpToggle.checked}&theme=${selectedTheme}&duration=${duration}&lang=${currentLang}`);
  chrome.tabs.create({ url });
});

validateSafety();
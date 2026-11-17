(function () {
  const params = new URLSearchParams(window.location.search);
  const lockKeyboard = params.get('kb') !== 'false';
  const lockTouchpad = params.get('tp') !== 'false';
  const theme = params.get('theme') || 'dark';
  const currentLang = params.get('lang') || 'vi';
  let secondsRemaining = parseInt(params.get('duration'), 10) || 180;

  let blockedEventsCount = 0;
  let escHoldInterval = null;
  let escHoldStart = null;

  document.body.setAttribute('data-theme', theme);

  const i18n = {
    vi: {
      fs_prompt: "🖥️ Bấm để vào Toàn màn hình (Ẩn Taskbar)",
      fs_active: "🖥️ Đang ở Toàn màn hình (Đã khóa ESC & F11)",
      cleaning_header: "ĐANG VỆ SINH LAPTOP",
      blocked_prefix: "Đã chặn",
      blocked_suffix: "thao tác vô tình",
      esc_hold_hint: "Nhấn giữ phím <strong style='color: var(--text-primary);'>ESC</strong> trong 2 giây để thoát",
      kb_locked: "⌨️ Bàn phím: 🔒 ĐÃ KHÓA",
      kb_unlocked: "⌨️ Bàn phím: ✅ ĐANG MỞ",
      tp_locked: "🖱️ Touchpad: 🔒 ĐÃ KHÓA",
      tp_unlocked: "🖱️ Touchpad: ✅ ĐANG MỞ"
    },
    en: {
      fs_prompt: "🖥️ Click to enter Fullscreen (Hide Taskbar)",
      fs_active: "🖥️ Fullscreen Active (ESC & F11 Locked)",
      cleaning_header: "LAPTOP CLEANING MODE",
      blocked_prefix: "Blocked",
      blocked_suffix: "accidental actions",
      esc_hold_hint: "Hold <strong style='color: var(--text-primary);'>ESC</strong> for 2 seconds to exit",
      kb_locked: "⌨️ Keyboard: 🔒 LOCKED",
      kb_unlocked: "⌨️ Keyboard: ✅ UNLOCKED",
      tp_locked: "🖱️ Touchpad: 🔒 LOCKED",
      tp_unlocked: "🖱️ Touchpad: ✅ UNLOCKED"
    }
  };

  const dict = i18n[currentLang] || i18n.vi;

  // Apply static texts
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  fullscreenBtn.textContent = dict.fs_prompt;
  document.getElementById('cleaningHeader').textContent = dict.cleaning_header;
  document.getElementById('blockedPrefix').textContent = dict.blocked_prefix;
  document.getElementById('blockedSuffix').textContent = dict.blocked_suffix;
  document.getElementById('escHoldHint').innerHTML = dict.esc_hold_hint;

  // Status Pills
  const kbPill = document.getElementById('kbStatusPill');
  const tpPill = document.getElementById('tpStatusPill');

  if (lockKeyboard) {
    kbPill.textContent = dict.kb_locked;
    kbPill.className = 'pill pill-locked';
  } else {
    kbPill.textContent = dict.kb_unlocked;
    kbPill.className = 'pill pill-unlocked';
  }

  if (lockTouchpad) {
    tpPill.textContent = dict.tp_locked;
    tpPill.className = 'pill pill-locked';
  } else {
    tpPill.textContent = dict.tp_unlocked;
    tpPill.className = 'pill pill-unlocked';
  }

  // Lock System Keys (Escape & F11) via Keyboard Lock API
  async function lockSystemKeys() {
    if ('keyboard' in navigator && navigator.keyboard && navigator.keyboard.lock) {
      try {
        await navigator.keyboard.lock(['Escape', 'F11']);
      } catch (err) {
        console.warn('Keyboard lock error:', err);
      }
    }
  }

  function unlockSystemKeys() {
    if ('keyboard' in navigator && navigator.keyboard && navigator.keyboard.unlock) {
      try {
        navigator.keyboard.unlock();
      } catch (err) {}
    }
  }

  // Fullscreen Handling
  async function requestFs() {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      await lockSystemKeys();
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  }

  fullscreenBtn.addEventListener('click', requestFs);

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      fullscreenBtn.textContent = dict.fs_active;
      lockSystemKeys();
    } else {
      fullscreenBtn.textContent = dict.fs_prompt;
      unlockSystemKeys();
    }
  });

  // Exit Clean Mode Safely
  async function exitCleanMode() {
    clearInterval(timerInterval);
    resetEscProgress();
    unlockSystemKeys();
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {}
    window.close();
  }

  // Countdown Timer
  function updateTimerDisplay() {
    const m = Math.floor(secondsRemaining / 60).toString().padStart(2, '0');
    const s = (secondsRemaining % 60).toString().padStart(2, '0');
    document.getElementById('cleanTimer').textContent = `${m}:${s}`;
  }

  updateTimerDisplay();
  const timerInterval = setInterval(() => {
    secondsRemaining--;
    if (secondsRemaining <= 0) {
      exitCleanMode();
      return;
    }
    updateTimerDisplay();
  }, 1000);

  function incrementBlocked() {
    blockedEventsCount++;
    document.getElementById('blockedCounter').textContent = blockedEventsCount;
  }

  // ESC 2-Second Hold Mechanism
  function resetEscProgress() {
    clearInterval(escHoldInterval);
    escHoldInterval = null;
    escHoldStart = null;
    document.getElementById('escProgressBar').style.width = '0%';
  }

  function startEscHold() {
    if (escHoldInterval) return;
    escHoldStart = Date.now();
    escHoldInterval = setInterval(() => {
      const elapsed = Date.now() - escHoldStart;
      const pct = Math.min(100, Math.round((elapsed / 2000) * 100));
      document.getElementById('escProgressBar').style.width = pct + '%';
      if (elapsed >= 2000) {
        exitCleanMode();
      }
    }, 30);
  }

  // Keyboard Interception
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.code === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (!e.repeat) {
        startEscHold();
      }
      return;
    }

    if (e.key === 'F11' || e.code === 'F11') {
      e.preventDefault();
      e.stopPropagation();
      if (lockKeyboard) {
        incrementBlocked();
      }
      return;
    }

    if (lockKeyboard) {
      e.preventDefault();
      e.stopPropagation();
      incrementBlocked();
    }
  }, true);

  window.addEventListener('keyup', (e) => {
    if (e.key === 'Escape' || e.code === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      resetEscProgress();
    }
  }, true);

  // Touchpad / Mouse Interception
  ['mousedown', 'wheel', 'contextmenu', 'touchstart', 'touchmove'].forEach(evtName => {
    window.addEventListener(evtName, (e) => {
      if (!lockTouchpad) return;
      if (e.target && e.target.closest('#fullscreenBtn')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      incrementBlocked();
    }, { capture: true, passive: false });
  });
})();
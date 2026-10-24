/**
 * =========================================================================
 * 🔔 SI-ROSTER AUDIO ENGINE (Apple-Style Minimalist Soft Chimes & Haptic Taps)
 * =========================================================================
 * - Uses Web Audio API for zero-latency, zero-bandwidth crystal clear sound
 * - Automatic audio context unlocking on user interaction (iOS/Android/Desktop)
 * - Ultra-soft, velvety tones designed for calm school & quiet environments
 * - Global soft tactile tap sound for all interactive buttons and cards
 * - Mute / Unmute state management with LocalStorage (Defaults to SOUND ON)
 * =========================================================================
 */
(function (root) {
  'use strict';

  var AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var isUnlocked = false;
  var lastPlayTimes = {};

  // Check saved sound preference (Default is TRUE / เปิดเสียงเป็นค่าเริ่มต้น)
  var isSoundEnabled = true;
  try {
    var saved = localStorage.getItem('roster_sound_enabled');
    if (saved === 'false') {
      isSoundEnabled = false;
    } else {
      isSoundEnabled = true;
    }
  } catch (e) {
    isSoundEnabled = true;
  }

  function getAudioContext() {
    if (!AudioCtxClass) return null;
    if (!ctx) {
      try {
        ctx = new AudioCtxClass();
      } catch (e) {
        console.warn('[RosterAudio] AudioContext init warning:', e);
      }
    }
    return ctx;
  }

  // Pre-unlock AudioContext on first user interaction
  function unlockAudio() {
    if (isUnlocked) return;
    var c = getAudioContext();
    if (c) {
      if (c.state === 'suspended') {
        c.resume().then(function () {
          isUnlocked = true;
        }).catch(function () {});
      } else {
        isUnlocked = true;
      }
    }
    ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(function (evt) {
      window.removeEventListener(evt, unlockAudio, true);
    });
  }

  ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(function (evt) {
    window.addEventListener(evt, unlockAudio, { once: true, passive: true, capture: true });
  });

  // Debounce check so sounds don't overlap awkwardly
  function shouldThrottle(soundKey, throttleMs) {
    var now = Date.now();
    var last = lastPlayTimes[soundKey] || 0;
    if (now - last < (throttleMs || 250)) {
      return true;
    }
    lastPlayTimes[soundKey] = now;
    return false;
  }

  /**
   * Execute callback when AudioContext is in active 'running' state
   */
  function withReadyContext(callback) {
    var c = getAudioContext();
    if (!c) return;

    if (c.state === 'suspended') {
      c.resume().then(function () {
        isUnlocked = true;
        callback(c);
      }).catch(function () {
        callback(c);
      });
    } else {
      callback(c);
    }
  }

  var RosterAudio = {
    /**
     * Current sound enabled state (true = ON, false = OFF / Muted)
     */
    isEnabled: isSoundEnabled,

    /**
     * Toggle sound ON / OFF and update UI + LocalStorage
     */
    toggleMute: function () {
      unlockAudio();
      this.isEnabled = !this.isEnabled;
      isSoundEnabled = this.isEnabled;

      try {
        localStorage.setItem('roster_sound_enabled', this.isEnabled ? 'true' : 'false');
      } catch (e) {}

      this.updateToggleUI();

      if (this.isEnabled) {
        this.playTap();
      }

      return this.isEnabled;
    },

    /**
     * Update toggle button icon, text, and title
     */
    updateToggleUI: function () {
      var btn = document.getElementById('btnSoundToggle') || document.getElementById('btnSoundTest');
      if (!btn) return;

      var icon = btn.querySelector('i');
      var text = btn.querySelector('.btn-refresh-text') || btn.querySelector('span');

      if (this.isEnabled) {
        btn.setAttribute('title', 'เสียงระบบ: เปิด (แตะเพื่อปิดเสียง)');
        btn.setAttribute('aria-label', 'ปิดเสียงระบบ');
        btn.classList.remove('sound-muted');
        btn.classList.add('sound-active');
        if (icon) {
          icon.className = 'fa-solid fa-volume-high';
          icon.style.color = '#3b82f6';
        }
        if (text) {
          text.textContent = 'เปิดเสียง';
        }
      } else {
        btn.setAttribute('title', 'เสียงระบบ: ปิด (แตะเพื่อเปิดเสียง)');
        btn.setAttribute('aria-label', 'เปิดเสียงระบบ');
        btn.classList.remove('sound-active');
        btn.classList.add('sound-muted');
        if (icon) {
          icon.className = 'fa-solid fa-volume-xmark';
          icon.style.color = '#94a3b8';
        }
        if (text) {
          text.textContent = 'ปิดเสียง';
        }
      }
    },

    /**
     * 1. เสียงสัมผัสปุ่มทุกปุ่ม (Minimalist Soft Haptic Button Tap)
     */
    playTap: function () {
      if (!this.isEnabled) return;
      if (shouldThrottle('tap', 45)) return;
      withReadyContext(function (c) {
        try {
          var now = c.currentTime;
          var osc = c.createOscillator();
          var gain = c.createGain();
          var filter = c.createBiquadFilter();

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1400, now);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(420, now);
          osc.frequency.exponentialRampToValueAtTime(180, now + 0.045);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.18, now + 0.006);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

          osc.connect(gain);
          gain.connect(filter);
          filter.connect(c.destination);

          osc.start(now);
          osc.stop(now + 0.05);
        } catch (e) {
          console.warn('[RosterAudio] Tap sound warning:', e);
        }
      });
    },

    /**
     * 2. ลงหน้าที่สำเร็จ (Duty Signup Success) - ฉบับนุ่มนวลเป็นพิเศษ (Ultra-Soft Velvety Chime)
     */
    playSuccess: function () {
      if (!this.isEnabled) return;
      if (shouldThrottle('success', 300)) return;
      withReadyContext(function (c) {
        try {
          var now = c.currentTime;

          var filter = c.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2200, now);
          filter.Q.setValueAtTime(0.6, now);

          var masterGain = c.createGain();
          masterGain.gain.setValueAtTime(0.60, now);
          filter.connect(masterGain);
          masterGain.connect(c.destination);

          var notes = [
            { freq: 783.99,  delay: 0.00, dur: 1.15, gain: 0.40 }, // G5 (Warm comforting fundamental)
            { freq: 1046.50, delay: 0.09, dur: 1.25, gain: 0.44 }, // C6
            { freq: 1318.51, delay: 0.18, dur: 1.35, gain: 0.40 }, // E6
            { freq: 1567.98, delay: 0.27, dur: 1.50, gain: 0.32 }  // G6 (Gentle, warm, non-piercing)
          ];

          notes.forEach(function (note) {
            var osc = c.createOscillator();
            var gain = c.createGain();
            var startTime = now + note.delay;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, startTime);

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.linearRampToValueAtTime(note.gain, startTime + 0.035);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

            osc.connect(gain);
            gain.connect(filter);

            osc.start(startTime);
            osc.stop(startTime + note.dur + 0.05);
          });
        } catch (e) {
          console.warn('[RosterAudio] Success chime warning:', e);
        }
      });
    },

    /**
     * 3. ตรวจพบกิจกรรมใหม่ในหน้า Feed / มีการสร้างกิจกรรมใหม่ (New Activity Created / Announced)
     */
    playNewActivity: function () {
      if (!this.isEnabled) return;
      if (shouldThrottle('newActivity', 400)) return;
      withReadyContext(function (c) {
        try {
          var now = c.currentTime;
          var filter = c.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2600, now);

          var masterGain = c.createGain();
          masterGain.gain.setValueAtTime(0.60, now);
          filter.connect(masterGain);
          masterGain.connect(c.destination);

          var notes = [
            { freq: 880.00,  delay: 0.00, dur: 0.65, gain: 0.42 }, // A5
            { freq: 1318.51, delay: 0.11, dur: 1.15, gain: 0.48 }  // E6
          ];

          notes.forEach(function (note) {
            var osc = c.createOscillator();
            var gain = c.createGain();
            var startTime = now + note.delay;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, startTime);

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.linearRampToValueAtTime(note.gain, startTime + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

            osc.connect(gain);
            gain.connect(filter);

            osc.start(startTime);
            osc.stop(startTime + note.dur + 0.05);
          });
        } catch (e) {
          console.warn('[RosterAudio] New activity sound warning:', e);
        }
      });
    },

    /**
     * 4. แจ้งเตือนข้อผิดพลาด เช่น ลงชื่อซ้ำ หรือระบบแจ้งเตือน Error (Soft Warning)
     */
    playError: function () {
      if (!this.isEnabled) return;
      if (shouldThrottle('error', 300)) return;
      withReadyContext(function (c) {
        try {
          var now = c.currentTime;
          var filter = c.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1000, now);

          var masterGain = c.createGain();
          masterGain.gain.setValueAtTime(0.50, now);
          filter.connect(masterGain);
          masterGain.connect(c.destination);

          var notes = [
            { freq: 311.13, delay: 0.00, dur: 0.28, gain: 0.35 }, // Eb4
            { freq: 261.63, delay: 0.10, dur: 0.45, gain: 0.40 }  // C4
          ];

          notes.forEach(function (note) {
            var osc = c.createOscillator();
            var gain = c.createGain();
            var startTime = now + note.delay;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, startTime);

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.linearRampToValueAtTime(note.gain, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

            osc.connect(gain);
            gain.connect(filter);

            osc.start(startTime);
            osc.stop(startTime + note.dur + 0.05);
          });
        } catch (e) {
          console.warn('[RosterAudio] Error sound warning:', e);
        }
      });
    },

    /**
     * 5. แอดมินสร้างหรือบันทึกกิจกรรมสำเร็จในระบบหลังบ้าน (Admin Action)
     */
    playAdmin: function () {
      if (!this.isEnabled) return;
      if (shouldThrottle('admin', 300)) return;
      withReadyContext(function (c) {
        try {
          var now = c.currentTime;
          var filter = c.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2400, now);

          var masterGain = c.createGain();
          masterGain.gain.setValueAtTime(0.60, now);
          filter.connect(masterGain);
          masterGain.connect(c.destination);

          var notes = [
            { freq: 698.46,  delay: 0.00, dur: 0.55, gain: 0.38 }, // F5
            { freq: 880.00,  delay: 0.08, dur: 0.70, gain: 0.42 }, // A5
            { freq: 1046.50, delay: 0.16, dur: 1.05, gain: 0.45 }  // C6
          ];

          notes.forEach(function (note) {
            var osc = c.createOscillator();
            var gain = c.createGain();
            var startTime = now + note.delay;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, startTime);

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.linearRampToValueAtTime(note.gain, startTime + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

            osc.connect(gain);
            gain.connect(filter);

            osc.start(startTime);
            osc.stop(startTime + note.dur + 0.05);
          });
        } catch (e) {
          console.warn('[RosterAudio] Admin action sound warning:', e);
        }
      });
    },

    /**
     * Manual unlock helper
     */
    unlock: function () {
      unlockAudio();
    },

    /**
     * Pop-up Sound Test Modal
     */
    testSoundModal: function () {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'ทดสอบระบบเสียง SI-ROSTER',
          html: [
            '<div style="text-align: left; display: flex; flex-direction: column; gap: 10px; margin-top: 14px;">',
            '  <button type="button" class="btn btn-outline" style="width:100%; justify-content:center; padding: 10px 16px; border-radius: 10px;" onclick="window.RosterAudio.playTap()">🔘 1. สัมผัสปุ่ม (Soft Tap)</button>',
            '  <button type="button" class="btn btn-outline" style="width:100%; justify-content:center; padding: 10px 16px; border-radius: 10px;" onclick="window.RosterAudio.playSuccess()">✨ 2. ลงหน้าที่สำเร็จ (Velvety Chime)</button>',
            '  <button type="button" class="btn btn-outline" style="width:100%; justify-content:center; padding: 10px 16px; border-radius: 10px;" onclick="window.RosterAudio.playNewActivity()">🔔 3. กิจกรรมใหม่ (New Activity)</button>',
            '  <button type="button" class="btn btn-outline" style="width:100%; justify-content:center; padding: 10px 16px; border-radius: 10px;" onclick="window.RosterAudio.playError()">⚠️ 4. ข้อผิดพลาด (Soft Warning)</button>',
            '  <button type="button" class="btn btn-outline" style="width:100%; justify-content:center; padding: 10px 16px; border-radius: 10px;" onclick="window.RosterAudio.playAdmin()">🛡️ 5. แอดมินบันทึกข้อมูล (Admin Action)</button>',
            '</div>'
          ].join(''),
          showConfirmButton: true,
          confirmButtonText: 'ปิดหน้าต่าง',
          confirmButtonColor: '#0f172a'
        });
      }
    }
  };

  /**
   * =========================================================================
   * 🔘 GLOBAL INTERACTIVE ELEMENT SOUND DELEGATOR
   * =========================================================================
   */
  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', function (e) {
      try {
        var target = e.target;
        if (!target) return;

        var interactive = target.closest(
          'button, .btn, .dg-act-pill-btn, .view-btn, .activity-card, a.dg-btn-black, .tab-item, .swal2-confirm, .swal2-cancel, .custom-swal-btn, [role="button"], .dash-act-filter-btn, .duty-select-option, .modal-close, .modal-close-corner'
        );

        if (interactive) {
          // If clicking the sound toggle itself, skip tap sound so toggleMute handles it
          if (interactive.id === 'btnSoundToggle' || interactive.id === 'btnSoundTest') {
            return;
          }
          if (interactive.disabled || interactive.classList.contains('disabled') || interactive.getAttribute('aria-disabled') === 'true') {
            return;
          }
          RosterAudio.playTap();
        }
      } catch (err) {
        // Silent
      }
    }, { passive: true, capture: true });

    // Sync button UI on initial DOM load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        RosterAudio.updateToggleUI();
      });
    } else {
      setTimeout(function () {
        RosterAudio.updateToggleUI();
      }, 50);
    }
  }

  root.RosterAudio = RosterAudio;
})(window);

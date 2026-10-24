/**
 * =========================================================================
 * 🔔 SI-ROSTER AUDIO ENGINE (Apple-Style Minimalist Soft Chimes & Haptic Taps)
 * =========================================================================
 * - Uses Web Audio API for zero-latency, zero-bandwidth crystal clear sound
 * - Automatic audio context unlocking on user interaction (iOS/Android/Desktop)
 * - Ultra-soft, velvety tones designed for calm school & quiet environments
 * - Global soft tactile tap sound for all interactive buttons and cards
 * - Includes interactive Sound Test Modal for instant browser verification
 * =========================================================================
 */
(function (root) {
  'use strict';

  var AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var isUnlocked = false;
  var lastPlayTimes = {};

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
     * 1. เสียงสัมผัสปุ่มทุกปุ่ม (Minimalist Soft Haptic Button Tap)
     * - Organic, velvety micro-pop / haptic tap on glass (inspired by iOS haptic feedback)
     * - Frequency drop 420Hz -> 180Hz over 45ms with 1400Hz low-pass filter
     * - Subtle, calming, satisfying, not fatiguing or loud
     */
    playTap: function () {
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
     * - Warm Rhodes / Marimba major chime (G5 -> C6 -> E6 -> G6)
     * - Soft lowpass filter at 2200Hz to remove harsh treble
     * - 35ms linear blossoming attack (zero sharp click, smooth acoustic bloom)
     * - Gentle 1.5s natural decay
     */
    playSuccess: function () {
      if (shouldThrottle('success', 300)) return;
      withReadyContext(function (c) {
        try {
          var now = c.currentTime;

          // Warm lowpass filter to create a silky, smooth, non-piercing acoustic tone
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

            // Velvety soft attack (blossoms naturally without clipping)
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
     * - Pleasant modern dual-tone notification ping (A5 -> E6)
     * - Soft, polite bell ring with lowpass warm filter
     */
    playNewActivity: function () {
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
     * - Gentle low-frequency double chime (Eb4 -> C4)
     * - Non-harsh, elegant soft bump
     */
    playError: function () {
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
     * - Confident affirmative chime (F5 -> A5 -> C6)
     * - Crisp, clean, authoritative
     */
    playAdmin: function () {
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
     * Interactive Sound Test Modal (SweetAlert2 Popup)
     */
    testSoundModal: function () {
      unlockAudio();
      if (typeof Swal === 'undefined') {
        this.playSuccess();
        return;
      }

      Swal.fire({
        html: [
          '<div style="text-align: center; padding: 10px 0;">',
          '  <div style="font-size: 52px; color: #3B82F6; margin-bottom: 8px;">',
          '    <i class="fa-solid fa-volume-high"></i>',
          '  </div>',
          '  <h3 style="font-size: 1.35rem; font-weight: 700; color: #0F172A; margin: 0 0 8px 0;">ทดสอบเสียงแจ้งเตือนระบบ (SI-ROSTER)</h3>',
          '  <p style="font-size: 0.88rem; color: #64748B; margin-bottom: 20px;">แตะหรือคลิกแต่ละปุ่มเพื่อทดสอบฟังเสียงเอฟเฟกต์แบบ Soft & Minimalist</p>',
          '  <div style="display: flex; flex-direction: column; gap: 10px; text-align: left;">',
          '    <button type="button" class="btn btn-block" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-radius: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; cursor: pointer; transition: all 0.2s ease;" onclick="window.RosterAudio.playTap(); this.style.borderColor=\'#3B82F6\'; setTimeout(() => this.style.borderColor=\'#E2E8F0\', 600);">',
          '      <span style="font-weight: 600; color: #1E293B;"><i class="fa-solid fa-hand-pointer" style="color: #3B82F6; margin-right: 8px;"></i> 1. เสียงสัมผัสปุ่มทุกปุ่ม (Soft Tap)</span>',
          '      <i class="fa-solid fa-play" style="font-size: 0.8rem; color: #64748B;"></i>',
          '    </button>',
          '    <button type="button" class="btn btn-block" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-radius: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; cursor: pointer; transition: all 0.2s ease;" onclick="window.RosterAudio.playSuccess(); this.style.borderColor=\'#10B981\'; setTimeout(() => this.style.borderColor=\'#E2E8F0\', 600);">',
          '      <span style="font-weight: 600; color: #1E293B;"><i class="fa-solid fa-circle-check" style="color: #10B981; margin-right: 8px;"></i> 2. ลงหน้าที่สำเร็จ (Velvety Soft Chime)</span>',
          '      <i class="fa-solid fa-play" style="font-size: 0.8rem; color: #64748B;"></i>',
          '    </button>',
          '    <button type="button" class="btn btn-block" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-radius: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; cursor: pointer; transition: all 0.2s ease;" onclick="window.RosterAudio.playNewActivity(); this.style.borderColor=\'#06B6D4\'; setTimeout(() => this.style.borderColor=\'#E2E8F0\', 600);">',
          '      <span style="font-weight: 600; color: #1E293B;"><i class="fa-solid fa-bell" style="color: #06B6D4; margin-right: 8px;"></i> 3. มีกิจกรรมใหม่ (New Activity)</span>',
          '      <i class="fa-solid fa-play" style="font-size: 0.8rem; color: #64748B;"></i>',
          '    </button>',
          '    <button type="button" class="btn btn-block" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-radius: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; cursor: pointer; transition: all 0.2s ease;" onclick="window.RosterAudio.playError(); this.style.borderColor=\'#EF4444\'; setTimeout(() => this.style.borderColor=\'#E2E8F0\', 600);">',
          '      <span style="font-weight: 600; color: #1E293B;"><i class="fa-solid fa-circle-exclamation" style="color: #EF4444; margin-right: 8px;"></i> 4. ข้อผิดพลาด / แจ้งเตือน (Warning)</span>',
          '      <i class="fa-solid fa-play" style="font-size: 0.8rem; color: #64748B;"></i>',
          '    </button>',
          '    <button type="button" class="btn btn-block" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-radius: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; cursor: pointer; transition: all 0.2s ease;" onclick="window.RosterAudio.playAdmin(); this.style.borderColor=\'#8B5CF6\'; setTimeout(() => this.style.borderColor=\'#E2E8F0\', 600);">',
          '      <span style="font-weight: 600; color: #1E293B;"><i class="fa-solid fa-shield-halved" style="color: #8B5CF6; margin-right: 8px;"></i> 5. แอดมินบันทึกข้อมูล (Admin)</span>',
          '      <i class="fa-solid fa-play" style="font-size: 0.8rem; color: #64748B;"></i>',
          '    </button>',
          '  </div>',
          '</div>'
        ].join(''),
        showConfirmButton: true,
        confirmButtonColor: '#0F172A',
        confirmButtonText: 'ปิดหน้าต่าง',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });

      // Play soft tap sound preview immediately on open
      this.playTap();
    }
  };

  /**
   * =========================================================================
   * 🔘 GLOBAL INTERACTIVE ELEMENT SOUND DELEGATOR
   * =========================================================================
   * Automatically attaches subtle, minimalist soft tap sound to:
   * - <button>, .btn, .dg-act-pill-btn, .view-btn
   * - .activity-card (when clicking into an activity)
   * - SweetAlert2 action buttons (.swal2-confirm, .swal2-cancel, .custom-swal-btn)
   * - Tabs (.tab-item), pagination, status buttons, modal close icons
   * =========================================================================
   */
  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', function (e) {
      try {
        var target = e.target;
        if (!target) return;

        // Find interactive button / element
        var interactive = target.closest(
          'button, .btn, .dg-act-pill-btn, .view-btn, .activity-card, a.dg-btn-black, .tab-item, .swal2-confirm, .swal2-cancel, .custom-swal-btn, [role="button"], .dash-act-filter-btn, .duty-select-option, .modal-close, .modal-close-corner'
        );

        if (interactive) {
          // Check if disabled
          if (interactive.disabled || interactive.classList.contains('disabled') || interactive.getAttribute('aria-disabled') === 'true') {
            return;
          }
          RosterAudio.playTap();
        }
      } catch (err) {
        // Silent
      }
    }, { passive: true, capture: true });
  }

  root.RosterAudio = RosterAudio;
})(window);

/**
 * =========================================================================
 * 🔔 SI-ROSTER AUDIO ENGINE (Apple-Style Minimalist Soft Chimes)
 * =========================================================================
 * - Uses Web Audio API for zero-latency, zero-bandwidth crystal clear sound
 * - Automatic audio context unlocking on user interaction (iOS/Android/Desktop)
 * - Minimalist soft tones designed specifically for school & quiet environments
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

  /**
   * Play synthesized harmonic chime
   * @param {Array<{freq: number, delay: number, dur: number, gain: number, type?: OscillatorType, harmonics?: boolean}>} notes 
   * @param {number} masterVol Master volume scalar (default 0.75)
   */
  function synthesizeChime(notes, masterVol) {
    withReadyContext(function (c) {
      try {
        var now = c.currentTime;
        var vol = typeof masterVol === 'number' ? masterVol : 0.75;

        var masterGain = c.createGain();
        masterGain.gain.setValueAtTime(vol, now);
        masterGain.connect(c.destination);

        notes.forEach(function (note) {
          var osc = c.createOscillator();
          var gain = c.createGain();
          var startTime = now + (note.delay || 0);
          var dur = note.dur || 0.75;
          var peakGain = (note.gain || 0.5) * vol;

          osc.type = note.type || 'sine';
          osc.frequency.setValueAtTime(note.freq, startTime);

          // Soft attack to eliminate clicking/popping
          gain.gain.setValueAtTime(0.0001, startTime);
          gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.02);
          // Long, natural exponential decay (glass chime bell resonance)
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(startTime);
          osc.stop(startTime + dur + 0.05);

          // Warm harmonic overtone for natural glass resonance
          if (note.harmonics) {
            var harmOsc = c.createOscillator();
            var harmGain = c.createGain();
            harmOsc.type = 'sine';
            harmOsc.frequency.setValueAtTime(note.freq * 2, startTime);
            harmGain.gain.setValueAtTime(0.0001, startTime);
            harmGain.gain.exponentialRampToValueAtTime(peakGain * 0.22, startTime + 0.018);
            harmGain.gain.exponentialRampToValueAtTime(0.0001, startTime + (dur * 0.6));
            harmOsc.connect(harmGain);
            harmGain.connect(masterGain);
            harmOsc.start(startTime);
            harmOsc.stop(startTime + dur + 0.05);
          }
        });
      } catch (e) {
        console.warn('[RosterAudio] Synthesize note warning:', e);
      }
    });
  }

  var RosterAudio = {
    /**
     * 1. ลงหน้าที่สำเร็จ (Duty Signup Success)
     * - Minimalist soft Apple-style glass chime (C6 -> E6 -> G6 -> C7)
     * - Sparkling, delightful, uplifting upward arpeggio
     */
    playSuccess: function () {
      if (shouldThrottle('success', 300)) return;
      synthesizeChime([
        { freq: 1046.50, delay: 0.00, dur: 0.95, gain: 0.55, harmonics: true }, // C6
        { freq: 1318.51, delay: 0.08, dur: 1.05, gain: 0.60, harmonics: true }, // E6
        { freq: 1567.98, delay: 0.16, dur: 1.25, gain: 0.65, harmonics: true }, // G6
        { freq: 2093.00, delay: 0.24, dur: 1.45, gain: 0.50, harmonics: true }  // C7
      ], 0.85);
    },

    /**
     * 2. ตรวจพบกิจกรรมใหม่ในหน้า Feed / มีการสร้างกิจกรรมใหม่ (New Activity Created / Announced)
     * - Pleasant modern dual-tone notification ping (A5 -> E6)
     * - Soft, polite bell ring
     */
    playNewActivity: function () {
      if (shouldThrottle('newActivity', 400)) return;
      synthesizeChime([
        { freq: 880.00,  delay: 0.00, dur: 0.65, gain: 0.55, harmonics: true }, // A5
        { freq: 1318.51, delay: 0.11, dur: 1.15, gain: 0.65, harmonics: true }  // E6
      ], 0.80);
    },

    /**
     * 3. แจ้งเตือนข้อผิดพลาด เช่น ลงชื่อซ้ำ หรือระบบแจ้งเตือน Error (Soft Warning)
     * - Gentle low-frequency double chime (Eb4 -> C4)
     * - Non-harsh, elegant soft bump
     */
    playError: function () {
      if (shouldThrottle('error', 300)) return;
      synthesizeChime([
        { freq: 311.13, delay: 0.00, dur: 0.28, gain: 0.40, harmonics: false }, // Eb4
        { freq: 261.63, delay: 0.10, dur: 0.50, gain: 0.50, harmonics: false }  // C4
      ], 0.75);
    },

    /**
     * 4. แอดมินสร้างหรือบันทึกกิจกรรมสำเร็จในระบบหลังบ้าน (Admin Action)
     * - Confident affirmative chime (F5 -> A5 -> C6)
     * - Crisp, clean, authoritative
     */
    playAdmin: function () {
      if (shouldThrottle('admin', 300)) return;
      synthesizeChime([
        { freq: 698.46,  delay: 0.00, dur: 0.55, gain: 0.50, harmonics: true }, // F5
        { freq: 880.00,  delay: 0.08, dur: 0.70, gain: 0.58, harmonics: true }, // A5
        { freq: 1046.50, delay: 0.16, dur: 1.05, gain: 0.62, harmonics: true }  // C6
      ], 0.82);
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
          '  <p style="font-size: 0.88rem; color: #64748B; margin-bottom: 20px;">แตะหรือคลิกแต่ละปุ่มเพื่อทดสอบฟังเสียงเอฟเฟกต์แบบ Soft Chime</p>',
          '  <div style="display: flex; flex-direction: column; gap: 10px; text-align: left;">',
          '    <button type="button" class="btn btn-block" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-radius: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; cursor: pointer; transition: all 0.2s ease;" onclick="window.RosterAudio.playSuccess(); this.style.borderColor=\'#10B981\'; setTimeout(() => this.style.borderColor=\'#E2E8F0\', 600);">',
          '      <span style="font-weight: 600; color: #1E293B;"><i class="fa-solid fa-circle-check" style="color: #10B981; margin-right: 8px;"></i> 1. ลงหน้าที่สำเร็จ (Success)</span>',
          '      <i class="fa-solid fa-play" style="font-size: 0.8rem; color: #64748B;"></i>',
          '    </button>',
          '    <button type="button" class="btn btn-block" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-radius: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; cursor: pointer; transition: all 0.2s ease;" onclick="window.RosterAudio.playNewActivity(); this.style.borderColor=\'#3B82F6\'; setTimeout(() => this.style.borderColor=\'#E2E8F0\', 600);">',
          '      <span style="font-weight: 600; color: #1E293B;"><i class="fa-solid fa-bell" style="color: #3B82F6; margin-right: 8px;"></i> 2. มีกิจกรรมใหม่ (New Activity)</span>',
          '      <i class="fa-solid fa-play" style="font-size: 0.8rem; color: #64748B;"></i>',
          '    </button>',
          '    <button type="button" class="btn btn-block" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-radius: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; cursor: pointer; transition: all 0.2s ease;" onclick="window.RosterAudio.playError(); this.style.borderColor=\'#EF4444\'; setTimeout(() => this.style.borderColor=\'#E2E8F0\', 600);">',
          '      <span style="font-weight: 600; color: #1E293B;"><i class="fa-solid fa-circle-exclamation" style="color: #EF4444; margin-right: 8px;"></i> 3. ข้อผิดพลาด / แจ้งเตือน (Warning)</span>',
          '      <i class="fa-solid fa-play" style="font-size: 0.8rem; color: #64748B;"></i>',
          '    </button>',
          '    <button type="button" class="btn btn-block" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-radius: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; cursor: pointer; transition: all 0.2s ease;" onclick="window.RosterAudio.playAdmin(); this.style.borderColor=\'#8B5CF6\'; setTimeout(() => this.style.borderColor=\'#E2E8F0\', 600);">',
          '      <span style="font-weight: 600; color: #1E293B;"><i class="fa-solid fa-shield-halved" style="color: #8B5CF6; margin-right: 8px;"></i> 4. แอดมินบันทึกข้อมูล (Admin)</span>',
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

      // Play success chime preview immediately on open
      this.playSuccess();
    }
  };

  root.RosterAudio = RosterAudio;
})(window);

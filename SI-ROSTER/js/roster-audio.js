/**
 * =========================================================================
 * 🔔 SI-ROSTER HYBRID AUDIO ENGINE (Web Audio API Synthesizer + MP3 Fallback)
 * =========================================================================
 * - Dual Engine Architecture:
 *   1. Primary: Studio-grade Web Audio API harmonic synthesizer (zero-bandwidth)
 *   2. Fallback: Local high-fidelity MP3/WAV audio files for mobile/unsupported browsers
 * - Preloaded audio pool with automatic path resolution across subdirectories
 * - Mobile audio unlocking (primes both Web Audio and HTML5 Audio on first touch)
 * - Mute / Unmute state management with LocalStorage (Defaults to SOUND ON)
 * - Configurable engine mode: 'hybrid' (default auto fallback), 'mp3', or 'synth'
 * =========================================================================
 */
(function (root) {
  'use strict';

  var AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var isUnlocked = false;
  var isHtml5Unlocked = false;
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

  // Check saved audio engine mode ('hybrid' | 'mp3' | 'synth')
  var currentEngine = 'hybrid';
  try {
    var savedEngine = localStorage.getItem('roster_audio_engine');
    if (savedEngine === 'mp3' || savedEngine === 'synth' || savedEngine === 'hybrid') {
      currentEngine = savedEngine;
    }
  } catch (e) {
    currentEngine = 'hybrid';
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

  // Pre-unlock AudioContext and HTML5 Audio on first user interaction
  function unlockAudio() {
    if (isUnlocked && isHtml5Unlocked) return;

    // 1. Unlock Web Audio API
    var c = getAudioContext();
    if (c) {
      try {
        if (c.state === 'suspended') {
          c.resume().then(function () {
            isUnlocked = true;
          }).catch(function () {});
        } else {
          isUnlocked = true;
        }

        // Play 1ms silent buffer to satisfy strict iOS Safari restrictions
        var buffer = c.createBuffer(1, 1, 22050);
        var source = c.createBufferSource();
        source.buffer = buffer;
        source.connect(c.destination);
        source.start(0);
      } catch (e) {}
    }

    // 2. Unlock HTML5 Audio Media Element (primes media channel on iOS/Android)
    try {
      var silentAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
      silentAudio.volume = 0.01;
      var p = silentAudio.play();
      if (p && typeof p.then === 'function') {
        p.then(function () {
          silentAudio.pause();
          isHtml5Unlocked = true;
        }).catch(function () {
          isHtml5Unlocked = true;
        });
      } else {
        isHtml5Unlocked = true;
      }
    } catch (e) {
      isHtml5Unlocked = true;
    }

    ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(function (evt) {
      window.removeEventListener(evt, unlockAudio, true);
    });
  }

  if (typeof window !== 'undefined') {
    ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(function (evt) {
      window.addEventListener(evt, unlockAudio, { once: true, passive: true, capture: true });
    });
  }

  // Debounce check so sounds don't overlap awkwardly
  function shouldThrottle(soundKey, throttleMs) {
    var now = Date.now();
    var last = lastPlayTimes[soundKey] || 0;
    if (now - last < (throttleMs || 200)) {
      return true;
    }
    lastPlayTimes[soundKey] = now;
    return false;
  }

  /**
   * =========================================================================
   * 📁 HTML5 AUDIO PRELOADER & MP3 FALLBACK ENGINE
   * =========================================================================
   */
  var SOUND_FILES = {
    'tap': 'tap.mp3',
    'success': 'success.mp3',
    'newActivity': 'new-activity.mp3',
    'error': 'error.mp3',
    'admin': 'admin.mp3'
  };

  // Resolve file paths across various URL configurations
  function getCandidatePaths(filename) {
    return [
      '/assets/sounds/' + filename,
      'assets/sounds/' + filename,
      '../assets/sounds/' + filename,
      '/sounds/' + filename
    ];
  }

  var audioPool = {};

  function preloadSound(key) {
    if (typeof Audio === 'undefined') return;
    var filename = SOUND_FILES[key];
    if (!filename) return;

    var candidates = getCandidatePaths(filename);
    var audio = new Audio();
    audio.preload = 'auto';

    var candidateIdx = 0;
    function tryNext() {
      if (candidateIdx >= candidates.length) return;
      audio.src = candidates[candidateIdx++];
      audio.load();
    }

    audio.addEventListener('error', function () {
      tryNext();
    });

    tryNext();
    audioPool[key] = { audio: audio, candidates: candidates, activeSrc: candidates[0] };
  }

  // Preload common audio files
  if (typeof window !== 'undefined') {
    Object.keys(SOUND_FILES).forEach(function (k) {
      try {
        preloadSound(k);
      } catch (e) {}
    });
  }

  /**
   * Play an MP3 file using HTML5 Audio (Cloned instance to support rapid overlapping)
   */
  function playAudioFile(key, volume) {
    if (typeof Audio === 'undefined') return false;
    var filename = SOUND_FILES[key];
    if (!filename) return false;

    var candidates = getCandidatePaths(filename);
    var audio = new Audio();
    audio.volume = typeof volume === 'number' ? volume : 0.85;

    var index = 0;
    function attemptPlay() {
      if (index >= candidates.length) return;
      audio.src = candidates[index++];
      var playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function (err) {
          // If playback failed due to src 404, try next candidate
          if (index < candidates.length) {
            attemptPlay();
          } else {
            console.warn('[RosterAudio] HTML5 audio playback error:', err);
          }
        });
      }
    }

    attemptPlay();
    return true;
  }

  /**
   * Execute callback when AudioContext is in active 'running' state
   * Returns false if context failed or is suspended and unable to resume
   */
  function withReadyContext(callback, onFallback) {
    var c = getAudioContext();
    if (!c) {
      if (typeof onFallback === 'function') onFallback();
      return;
    }

    if (c.state === 'suspended') {
      c.resume().then(function () {
        isUnlocked = true;
        callback(c);
      }).catch(function (err) {
        console.warn('[RosterAudio] AudioContext resume failed, using fallback:', err);
        if (typeof onFallback === 'function') onFallback();
      });
    } else {
      try {
        callback(c);
      } catch (e) {
        console.warn('[RosterAudio] Synthesizer error, using fallback:', e);
        if (typeof onFallback === 'function') onFallback();
      }
    }
  }

  var RosterAudio = {
    /**
     * Current sound enabled state (true = ON, false = OFF / Muted)
     */
    isEnabled: isSoundEnabled,

    /**
     * Current engine mode: 'hybrid' | 'mp3' | 'synth'
     */
    engine: currentEngine,

    /**
     * Set engine mode ('hybrid', 'mp3', or 'synth')
     */
    setEngine: function (engineMode) {
      if (engineMode === 'mp3' || engineMode === 'synth' || engineMode === 'hybrid') {
        this.engine = engineMode;
        currentEngine = engineMode;
        try {
          localStorage.setItem('roster_audio_engine', engineMode);
        } catch (e) {}
      }
      return this.engine;
    },

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
     * Directly play an MP3 backup file
     */
    playAudioFile: function (soundName, volume) {
      if (!this.isEnabled) return false;
      return playAudioFile(soundName, volume);
    },

    /**
     * 1. เสียงสัมผัสปุ่มทุกปุ่ม (Soft Tactile Button Tap)
     */
    playTap: function () {
      if (!this.isEnabled) return;
      if (shouldThrottle('tap', 45)) return;

      var self = this;
      if (this.engine === 'mp3') {
        playAudioFile('tap', 0.50);
        return;
      }

      withReadyContext(function (c) {
        try {
          var now = c.currentTime;
          var osc = c.createOscillator();
          var gain = c.createGain();
          var filter = c.createBiquadFilter();

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1400, now);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(120, now + 0.035);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.35, now + 0.003);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

          osc.connect(gain);
          gain.connect(filter);
          filter.connect(c.destination);

          osc.start(now);
          osc.stop(now + 0.04);
        } catch (e) {
          playAudioFile('tap', 0.50);
        }
      }, function () {
        playAudioFile('tap', 0.50);
      });
    },

    /**
     * 2. เสียงลงหน้าที่สำเร็จ (Duty Signup Success - Velvety Chime)
     */
    playSuccess: function () {
      if (!this.isEnabled) return;
      if (shouldThrottle('success', 500)) return;

      var self = this;
      if (this.engine === 'mp3') {
        playAudioFile('success', 0.85);
        return;
      }

      withReadyContext(function (c) {
        try {
          var now = c.currentTime;
          var filter = c.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2200, now);

          var masterGain = c.createGain();
          masterGain.gain.setValueAtTime(0.55, now);
          filter.connect(masterGain);
          masterGain.connect(c.destination);

          var notes = [
            { freq: 783.99,  delay: 0.00, dur: 0.75, gain: 0.32 }, // G5
            { freq: 1046.50, delay: 0.08, dur: 0.90, gain: 0.38 }, // C6
            { freq: 1318.51, delay: 0.16, dur: 1.05, gain: 0.35 }, // E6
            { freq: 1567.98, delay: 0.24, dur: 1.15, gain: 0.30 }  // G6
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
          playAudioFile('success', 0.85);
        }
      }, function () {
        playAudioFile('success', 0.85);
      });
    },

    /**
     * 3. ตรวจพบกิจกรรมใหม่ในหน้า Feed / มีการสร้างกิจกรรมใหม่ (New Activity Created / Announced)
     */
    playNewActivity: function () {
      if (!this.isEnabled) return;
      if (shouldThrottle('newActivity', 400)) return;

      var self = this;
      if (this.engine === 'mp3') {
        playAudioFile('newActivity', 0.85);
        return;
      }

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
            { freq: 880.00,  delay: 0.00, dur: 0.70, gain: 0.35 }, // A5
            { freq: 1318.51, delay: 0.11, dur: 1.05, gain: 0.40 }  // E6
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
          playAudioFile('newActivity', 0.85);
        }
      }, function () {
        playAudioFile('newActivity', 0.85);
      });
    },

    /**
     * 4. แจ้งเตือนข้อผิดพลาด เช่น ลงชื่อซ้ำ หรือระบบแจ้งเตือน Error (Crisp Audible Warning)
     */
    playError: function () {
      if (!this.isEnabled) return;
      if (shouldThrottle('error', 200)) return;

      var self = this;
      if (this.engine === 'mp3') {
        playAudioFile('error', 0.95);
        return;
      }

      var played = false;
      withReadyContext(function (c) {
        try {
          var now = c.currentTime;
          var filter = c.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(3200, now);

          var masterGain = c.createGain();
          masterGain.gain.setValueAtTime(0.85, now);
          filter.connect(masterGain);
          masterGain.connect(c.destination);

          var notes = [
            { freq: 659.25, delay: 0.00, dur: 0.40, gain: 0.55 }, // E5
            { freq: 440.00, delay: 0.12, dur: 0.65, gain: 0.60 }  // A4
          ];

          notes.forEach(function (note) {
            var osc = c.createOscillator();
            var osc2 = c.createOscillator();
            var gain = c.createGain();
            var startTime = now + note.delay;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, startTime);

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(note.freq * 2, startTime);

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.linearRampToValueAtTime(note.gain, startTime + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

            osc.connect(gain);
            osc2.connect(gain);
            gain.connect(filter);

            osc.start(startTime);
            osc2.start(startTime);
            osc.stop(startTime + note.dur + 0.05);
            osc2.stop(startTime + note.dur + 0.05);
          });
          played = true;
        } catch (e) {
          playAudioFile('error', 0.95);
        }
      }, function () {
        playAudioFile('error', 0.95);
      });

      // Reliable fallback: if AudioContext was suspended or delayed on mobile, play HTML5 MP3
      setTimeout(function () {
        if (!played && self.engine !== 'synth') {
          playAudioFile('error', 0.95);
        }
      }, 50);
    },

    /**
     * 5. แอดมินสร้างหรือบันทึกกิจกรรมสำเร็จในระบบหลังบ้าน (Admin Action)
     */
    playAdmin: function () {
      if (!this.isEnabled) return;
      if (shouldThrottle('admin', 300)) return;

      var self = this;
      if (this.engine === 'mp3') {
        playAudioFile('admin', 0.85);
        return;
      }

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
            { freq: 698.46,  delay: 0.00, dur: 0.60, gain: 0.32 }, // F5
            { freq: 880.00,  delay: 0.08, dur: 0.75, gain: 0.35 }, // A5
            { freq: 1046.50, delay: 0.16, dur: 0.95, gain: 0.38 }  // C6
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
          playAudioFile('admin', 0.85);
        }
      }, function () {
        playAudioFile('admin', 0.85);
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
          title: 'ทดสอบระบบเสียง SI-ROSTER (Hybrid)',
          html: [
            '<div style="text-align: left; display: flex; flex-direction: column; gap: 10px; margin-top: 14px;">',
            '  <button type="button" class="btn btn-outline" style="width:100%; justify-content:center; padding: 10px 16px; border-radius: 10px;" onclick="window.RosterAudio.playTap()">🔘 1. สัมผัสปุ่ม (Soft Tap)</button>',
            '  <button type="button" class="btn btn-outline" style="width:100%; justify-content:center; padding: 10px 16px; border-radius: 10px;" onclick="window.RosterAudio.playSuccess()">✨ 2. ลงหน้าที่สำเร็จ (Velvety Chime)</button>',
            '  <button type="button" class="btn btn-outline" style="width:100%; justify-content:center; padding: 10px 16px; border-radius: 10px;" onclick="window.RosterAudio.playNewActivity()">🔔 3. กิจกรรมใหม่ (New Activity)</button>',
            '  <button type="button" class="btn btn-outline" style="width:100%; justify-content:center; padding: 10px 16px; border-radius: 10px;" onclick="window.RosterAudio.playError()">⚠️ 4. ข้อผิดพลาด (Soft Warning)</button>',
            '  <button type="button" class="btn btn-outline" style="width:100%; justify-content:center; padding: 10px 16px; border-radius: 10px;" onclick="window.RosterAudio.playAdmin()">🛡️ 5. แอดมินบันทึกข้อมูล (Admin Action)</button>',
            '  <div style="border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 10px; text-align: center;">',
            '    <small style="color: #64748b;">ทดสอบเล่นไฟล์ MP3 สำรองโดยตรง:</small>',
            '    <div style="display: flex; gap: 6px; justify-content: center; margin-top: 6px; flex-wrap: wrap;">',
            '      <button type="button" class="btn btn-outline" style="font-size: 0.75rem; padding: 4px 8px;" onclick="window.RosterAudio.playAudioFile(\'tap\')">MP3 Tap</button>',
            '      <button type="button" class="btn btn-outline" style="font-size: 0.75rem; padding: 4px 8px;" onclick="window.RosterAudio.playAudioFile(\'success\')">MP3 Success</button>',
            '      <button type="button" class="btn btn-outline" style="font-size: 0.75rem; padding: 4px 8px;" onclick="window.RosterAudio.playAudioFile(\'newActivity\')">MP3 Alert</button>',
            '    </div>',
            '  </div>',
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
          if (interactive.id === 'btnSoundToggle' || interactive.id === 'btnSoundTest' || interactive.id === 'adminSoundMasterToggle') {
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

/**
 * DIEGO SKELETON LOADING SYSTEM
 * Standardized 1:1 Authentic UI Skeletons with Shimmer Wave animation
 */

(function () {
  'use strict';

  window.DgSkeletons = {
    // 1. News & Activities Cards Skeleton (Carousel & Grid)
    newsCards: function (count = 3) {
      let html = '';
      for (let i = 0; i < count; i++) {
        html += `
          <div class="dg-sk-card" aria-hidden="true">
            <div class="dg-sk-card-cover dg-skeleton-shimmer">
              <div class="dg-sk-card-tag dg-skeleton-shimmer" style="background: rgba(255,255,255,0.7);"></div>
            </div>
            <div class="dg-sk-card-body">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <div class="dg-skeleton-shimmer dg-sk-avatar" style="width: 14px; height: 14px;"></div>
                <div class="dg-skeleton-shimmer dg-sk-line" style="width: 80px; margin-bottom: 0;"></div>
              </div>
              <div class="dg-skeleton-shimmer dg-sk-line lg" style="width: 85%;"></div>
              <div class="dg-skeleton-shimmer dg-sk-line lg" style="width: 60%; margin-bottom: 16px;"></div>
              <div class="dg-skeleton-shimmer dg-sk-line" style="width: 95%;"></div>
              <div class="dg-skeleton-shimmer dg-sk-line" style="width: 90%;"></div>
              <div class="dg-skeleton-shimmer dg-sk-line" style="width: 45%;"></div>
              <div class="dg-sk-card-footer">
                <div style="display: flex; gap: 8px;">
                  <div class="dg-skeleton-shimmer dg-sk-avatar" style="width: 24px; height: 24px;"></div>
                  <div class="dg-skeleton-shimmer dg-sk-avatar" style="width: 24px; height: 24px;"></div>
                  <div class="dg-skeleton-shimmer dg-sk-avatar" style="width: 24px; height: 24px;"></div>
                </div>
                <div class="dg-skeleton-shimmer dg-sk-line" style="width: 65px; margin-bottom: 0;"></div>
              </div>
            </div>
          </div>
        `;
      }
      return html;
    },

    // 2. Upcoming Events List Skeleton (Homepage & Calendar)
    eventList: function (count = 4) {
      let html = '';
      for (let i = 0; i < count; i++) {
        html += `
          <div class="dg-sk-event-item" aria-hidden="true">
            <div class="dg-sk-event-date-box dg-skeleton-shimmer"></div>
            <div class="dg-sk-event-content">
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
                <div class="dg-skeleton-shimmer dg-sk-pill" style="width: 65px; height: 20px;"></div>
                <div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 90px; margin-bottom: 0;"></div>
              </div>
              <div class="dg-skeleton-shimmer dg-sk-line lg" style="width: 70%; margin-bottom: 8px;"></div>
              <div style="display: flex; gap: 14px; align-items: center;">
                <div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 80px; margin-bottom: 0;"></div>
                <div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 120px; margin-bottom: 0;"></div>
              </div>
            </div>
            <div class="dg-skeleton-shimmer dg-sk-pill" style="width: 28px; height: 28px; border-radius: 50%;"></div>
          </div>
        `;
      }
      return html;
    },

    // 3. Team Roster Skeleton (Full Authentic Hierarchy)
    teamHierarchy: function () {
      return `
        <div class="dg-container" style="padding-top: 40px; padding-bottom: 60px;" aria-hidden="true">
          <!-- President Card Skeleton -->
          <div class="dg-sk-team-pres-wrap">
            <div class="dg-skeleton-shimmer dg-sk-avatar" style="width: 120px; height: 120px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);"></div>
            <div class="dg-skeleton-shimmer dg-sk-line lg" style="width: 200px; height: 24px; margin-bottom: 10px;"></div>
            <div class="dg-skeleton-shimmer dg-sk-pill" style="width: 240px; height: 28px; margin-bottom: 20px;"></div>
            <div class="dg-skeleton-shimmer dg-sk-line" style="width: 80%; max-width: 480px; margin-bottom: 8px;"></div>
            <div class="dg-skeleton-shimmer dg-sk-line" style="width: 60%; max-width: 360px;"></div>
          </div>

          <!-- Section Label: Vice Presidents -->
          <div style="margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
            <div class="dg-skeleton-shimmer dg-sk-line lg" style="width: 180px; margin-bottom: 0;"></div>
            <div class="dg-skeleton-shimmer dg-sk-line" style="flex: 1; height: 1px; margin-bottom: 0;"></div>
          </div>

          <!-- VPs Grid Skeleton (3 Cards) -->
          <div class="dg-sk-team-vp-grid">
            ${[1, 2, 3].map(() => `
              <div class="dg-sk-team-vp-card">
                <div class="dg-skeleton-shimmer dg-sk-avatar" style="width: 84px; height: 84px; margin-bottom: 16px;"></div>
                <div class="dg-skeleton-shimmer dg-sk-line lg" style="width: 150px; margin-bottom: 8px;"></div>
                <div class="dg-skeleton-shimmer dg-sk-pill" style="width: 130px; height: 24px; margin-bottom: 12px;"></div>
                <div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 100px;"></div>
              </div>
            `).join('')}
          </div>

          <!-- Section Label: Committee Members Table -->
          <div style="margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
            <div class="dg-skeleton-shimmer dg-sk-line lg" style="width: 220px; margin-bottom: 0;"></div>
            <div class="dg-skeleton-shimmer dg-sk-line" style="flex: 1; height: 1px; margin-bottom: 0;"></div>
          </div>

          <!-- Committee Members Table Skeleton -->
          <table class="dg-sk-table">
            <thead>
              <tr style="background: var(--dg-bg-subtle, #f8f9fa);">
                <th style="width: 80px;"><div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 40px; margin: 0;"></div></th>
                <th><div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 120px; margin: 0;"></div></th>
                <th style="width: 140px;"><div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 70px; margin: 0;"></div></th>
                <th style="width: 200px;"><div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 100px; margin: 0;"></div></th>
              </tr>
            </thead>
            <tbody>
              ${[1, 2, 3, 4, 5].map(() => `
                <tr>
                  <td><div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 30px; margin: 0;"></div></td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="dg-skeleton-shimmer dg-sk-avatar" style="width: 32px; height: 32px;"></div>
                      <div class="dg-skeleton-shimmer dg-sk-line" style="width: 140px; margin: 0;"></div>
                    </div>
                  </td>
                  <td><div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 80px; margin: 0;"></div></td>
                  <td><div class="dg-skeleton-shimmer dg-sk-pill" style="width: 110px; height: 22px; margin: 0;"></div></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    },

    // 4. Admin / Table Rows Skeleton
    tableRows: function (cols = 5, rows = 5) {
      let html = '';
      for (let r = 0; r < rows; r++) {
        html += '<tr class="dg-sk-row" aria-hidden="true">';
        for (let c = 0; c < cols; c++) {
          const width = c === 0 ? '35px' : (c === 1 ? '140px' : (c === cols - 1 ? '80px' : '90px'));
          html += `
            <td style="padding: 14px 18px;">
              <div class="dg-skeleton-shimmer dg-sk-line" style="width: ${width}; margin-bottom: 0;"></div>
            </td>
          `;
        }
        html += '</tr>';
      }
      return html;
    },

    // 5. Admin Recruitment Stats Cards Skeleton
    statsCards: function (count = 4) {
      let html = '';
      for (let i = 0; i < count; i++) {
        html += `
          <div class="dg-sk-card" style="padding: 20px;" aria-hidden="true">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 90px; margin: 0;"></div>
              <div class="dg-skeleton-shimmer dg-sk-avatar" style="width: 28px; height: 28px;"></div>
            </div>
            <div class="dg-skeleton-shimmer dg-sk-line lg" style="width: 60px; height: 32px; margin-bottom: 8px;"></div>
            <div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 120px; margin: 0;"></div>
          </div>
        `;
      }
      return html;
    },

    // 6. Applicant Status Check Skeleton Card (admission.html)
    applicantStatusCard: function () {
      return `
        <div class="dg-sk-card" style="padding: 28px; max-width: 580px; margin: 24px auto;" aria-hidden="true">
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px; border-bottom: 1px solid var(--dg-border, #eee); padding-bottom: 18px;">
            <div class="dg-skeleton-shimmer dg-sk-avatar" style="width: 56px; height: 56px;"></div>
            <div style="flex: 1;">
              <div class="dg-skeleton-shimmer dg-sk-line lg" style="width: 160px; margin-bottom: 8px;"></div>
              <div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 110px; margin: 0;"></div>
            </div>
            <div class="dg-skeleton-shimmer dg-sk-pill" style="width: 85px; height: 28px;"></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
            <div>
              <div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 60px; margin-bottom: 6px;"></div>
              <div class="dg-skeleton-shimmer dg-sk-line" style="width: 120px; margin: 0;"></div>
            </div>
            <div>
              <div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 60px; margin-bottom: 6px;"></div>
              <div class="dg-skeleton-shimmer dg-sk-line" style="width: 100px; margin: 0;"></div>
            </div>
          </div>
          <div class="dg-skeleton-shimmer dg-sk-rect" style="height: 44px; width: 100%;"></div>
        </div>
      `;
    },

    // 7. Admin Team Editor Cards Skeleton
    adminTeamEditorCards: function (count = 3) {
      let html = '';
      for (let i = 0; i < count; i++) {
        html += `
          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;" aria-hidden="true">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px;">
              <div class="dg-skeleton-shimmer dg-sk-line lg" style="width: 220px; margin: 0;"></div>
              <div class="dg-skeleton-shimmer dg-sk-pill" style="width: 90px; height: 32px;"></div>
            </div>
            <div style="display: grid; grid-template-columns: 120px 1fr; gap: 24px; align-items: start;">
              <div style="text-align: center;">
                <div class="dg-skeleton-shimmer dg-sk-rect" style="width: 120px; height: 120px; border-radius: 8px; margin-bottom: 12px;"></div>
                <div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 80px; margin: 0 auto;"></div>
              </div>
              <div>
                <div style="margin-bottom: 16px;">
                  <div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 100px; margin-bottom: 8px;"></div>
                  <div class="dg-skeleton-shimmer dg-sk-line" style="width: 100%; height: 38px; border-radius: 6px;"></div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <div>
                    <div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 80px; margin-bottom: 8px;"></div>
                    <div class="dg-skeleton-shimmer dg-sk-line" style="width: 100%; height: 38px; border-radius: 6px;"></div>
                  </div>
                  <div>
                    <div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 80px; margin-bottom: 8px;"></div>
                    <div class="dg-skeleton-shimmer dg-sk-line" style="width: 100%; height: 38px; border-radius: 6px;"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }
      return html;
    },

    // 8. Admin News Cards Skeleton
    adminNewsCards: function (count = 4) {
      let html = '';
      for (let i = 0; i < count; i++) {
        html += `
          <div class="admin-news-item-card" style="pointer-events: none;" aria-hidden="true">
            <div class="dg-skeleton-shimmer dg-sk-rect" style="width: 100%; aspect-ratio: 3/2; border-radius: 8px 8px 0 0;"></div>
            <div class="admin-news-item-body">
              <div class="admin-news-meta" style="display: flex; gap: 8px; margin-bottom: 10px;">
                <div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 80px; margin: 0;"></div>
                <div class="dg-skeleton-shimmer dg-sk-pill" style="width: 60px; height: 18px;"></div>
              </div>
              <div class="dg-skeleton-shimmer dg-sk-line lg" style="width: 85%; margin-bottom: 8px;"></div>
              <div class="dg-skeleton-shimmer dg-sk-line" style="width: 95%; margin-bottom: 6px;"></div>
              <div class="dg-skeleton-shimmer dg-sk-line" style="width: 60%; margin-bottom: 14px;"></div>
              <div style="display: flex; gap: 6px; margin-bottom: 14px;">
                <div class="dg-skeleton-shimmer dg-sk-pill" style="width: 70px; height: 22px;"></div>
                <div class="dg-skeleton-shimmer dg-sk-pill" style="width: 80px; height: 22px;"></div>
              </div>
              <div class="admin-card-actions" style="display: flex; gap: 8px; justify-content: flex-end;">
                <div class="dg-skeleton-shimmer dg-sk-pill" style="width: 65px; height: 30px;"></div>
                <div class="dg-skeleton-shimmer dg-sk-pill" style="width: 55px; height: 30px;"></div>
              </div>
            </div>
          </div>
        `;
      }
      return html;
    },

    // 9. Admin Status History Timeline Skeleton
    adminTimelineHistory: function (count = 3) {
      let html = '';
      for (let i = 0; i < count; i++) {
        html += `
          <div style="display: flex; gap: 14px; margin-bottom: 16px;" aria-hidden="true">
            <div class="dg-skeleton-shimmer dg-sk-avatar" style="width: 14px; height: 14px; margin-top: 4px; flex-shrink: 0;"></div>
            <div style="flex: 1;">
              <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 6px;">
                <div class="dg-skeleton-shimmer dg-sk-pill" style="width: 80px; height: 20px;"></div>
                <div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 110px; margin: 0;"></div>
              </div>
              <div class="dg-skeleton-shimmer dg-sk-line sm" style="width: 70%; margin: 0;"></div>
            </div>
          </div>
        `;
      }
      return html;
    }
  };
})();

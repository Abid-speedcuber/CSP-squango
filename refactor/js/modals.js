/* ==== FILE: js/modals.js ==== */
/* exported generateModalHTML openNewParityAnalysis openEditCaseModal openCustomizeSVGsModal openNotesModal openParityTracingPersonalization */

import { CSPData } from './data-store.js?v=esm-20260511-2';
import { algToShapeIndex } from './tools/alg_to_index.js?v=esm-20260511-2';
import { caleTracer, ParityTracerLibrary } from './tools/cales-parity-tracer.js?v=esm-20260511-2';
import { normalizeScramble } from './tools/scrambleNormalizer.js?v=esm-20260511-2';
import {
    PRESET_CONFIG,
    enhancedAccess,
    setEnhancedAccess,
    updateAppState
} from './restoftheapp.js?v=esm-20260511-2';
import { registerAction } from './browser-api.js?v=esm-20260511-2';

﻿/*
╔═══════════════════════════════════════════════════════════════════════════╗
║                          DYNAMIC MODAL GENERATION                         ║
╚═══════════════════════════════════════════════════════════════════════════╝
*/

// Helper function for color names
export function getColorName(hexColor) {
    const colorMap = {
        '#000000': 'Black',
        '#FFFFFF': 'White',
        '#FFFF00': 'Yellow',
        '#FFD700': 'Yellow'
    };
    return colorMap[hexColor.toUpperCase()] || 'Top';
}

// Make getColorName globally accessible for training modal
window.getColorName = getColorName;

// Generate all modal HTML dynamically for lazy loading
export function generateModalHTML() {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'dynamicModals';

    modalContainer.innerHTML = `
        <div id="colorSchemeModal" class="modal">
            <div class="modal-content" style="max-width: 500px; max-height: 80vh; min-height: 20vh;">
                <div class="modal-header">
                    <span class="modal-title">Color Scheme Settings</span>
                    <button class="close-btn" onclick="closeColorSchemeModal()">&times;</button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">Top Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="top" data-color="#FFFF00" style="background: #FFFF00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Yellow</button>
                            <button class="color-btn" data-face="top" data-color="#000000" style="background: #000000; color: white; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Black</button>
                            <button class="color-btn" data-face="top" data-color="#FFFFFF" style="background: #FFFFFF; color: #000000; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">White</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">Bottom Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="bottom" data-color="#FFFF00" style="background: #FFFF00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Yellow</button>
                            <button class="color-btn" data-face="bottom" data-color="#000000" style="background: #000000; color: white; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Black</button>
                            <button class="color-btn" data-face="bottom" data-color="#FFFFFF" style="background: #FFFFFF; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">White</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">Front Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="front" data-color="#CC0000" style="background: #CC0000; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Red</button>
                            <button class="color-btn" data-face="front" data-color="#00AA00" style="background: #00AA00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Green</button>
                            <button class="color-btn" data-face="front" data-color="#0066CC" style="background: #0066CC; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Blue</button>
                            <button class="color-btn" data-face="front" data-color="#FF8C00" style="background: #FF8C00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Orange</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">Right Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="right" data-color="#CC0000" style="background: #CC0000; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Red</button>
                            <button class="color-btn" data-face="right" data-color="#00AA00" style="background: #00AA00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Green</button>
                            <button class="color-btn" data-face="right" data-color="#0066CC" style="background: #0066CC; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Blue</button>
                            <button class="color-btn" data-face="right" data-color="#FF8C00" style="background: #FF8C00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Orange</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">Back Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="back" data-color="#CC0000" style="background: #CC0000; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Red</button>
                            <button class="color-btn" data-face="back" data-color="#00AA00" style="background: #00AA00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Green</button>
                            <button class="color-btn" data-face="back" data-color="#0066CC" style="background: #0066CC; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Blue</button>
                            <button class="color-btn" data-face="back" data-color="#FF8C00" style="background: #FF8C00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Orange</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">Left Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="left" data-color="#CC0000" style="background: #CC0000; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Red</button>
                            <button class="color-btn" data-face="left" data-color="#00AA00" style="background: #00AA00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Green</button>
                            <button class="color-btn" data-face="left" data-color="#0066CC" style="background: #0066CC; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Blue</button>
                            <button class="color-btn" data-face="left" data-color="#FF8C00" style="background: #FF8C00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Orange</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

         <!-- Desktop Profile Modal (Popup style) -->
        <div id="profileModalDesktop" class="profile-popup-desktop">
            <div class="profile-popup-content">
                <!-- View Mode -->
                <div id="profileViewDesktop">
                    <div style="text-align: center; padding: 20px 20px 15px; border-bottom: 1px solid var(--surface-border);">
                        <img id="profileAvatarDesktop" src="res/avatar.svg" style="width: 56px; height: 56px; margin-bottom: 10px; border-radius: 50%; border: 3px solid var(--avatar-border-idle);">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <h3 id="profileNameDesktop" style="margin: 0; font-size: 1.2rem; color: var(--text-ui); font-weight: 600;">Profile</h3>
                            <button onclick="switchToEditProfile('Desktop')" style="background: none; border: none; cursor: pointer; padding: 2px; display: flex; align-items: center; color: var(--sidebar-close-color);" title="Edit Profile">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                        </div>
                    </div>
                    <div style="padding: 15px;">
                        <div style="margin-bottom: 12px;">
                            <div class="progress-track" style="border-radius: 8px; height: 24px; position: relative; overflow: hidden;">
                                <div id="profileLearningProgressDesktop" style="background: var(--bar-learning); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px; position: absolute; left: 0; top: 0;"></div>
                                <div id="profileLearnedProgressDesktop" style="background: var(--bar-learned); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px; position: absolute; left: 0; top: 0; z-index: 1;"></div>
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding: 0 10px; justify-content: space-between; z-index: 2;">
                                    <span style="font-size: 0.75rem; color: var(--text-ui); font-weight: 600;">Learned</span>
                                    <span id="profileLearnedTextDesktop" style="font-weight: 700; color: var(--text-ui); font-size: 0.8rem;">0/90</span>
                                </div>
                            </div>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <div class="progress-track" style="border-radius: 8px; height: 24px; position: relative; overflow: hidden;">
                                <div id="profileCoverageProgressDesktop" style="background: var(--bar-coverage); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px;"></div>
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding: 0 10px; justify-content: space-between;">
                                    <span style="font-size: 0.75rem; color: var(--text-ui); font-weight: 600;">Coverage</span>
                                    <span id="profileCoverageTextDesktop" style="font-weight: 700; color: var(--text-ui); font-size: 0.8rem;">0.0%</span>
                                </div>
                            </div>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <div class="progress-track" style="border-radius: 8px; height: 24px; position: relative; overflow: hidden;">
                                <div id="profileSafetyProgressDesktop" style="background: var(--bar-safety); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px;"></div>
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding: 0 10px; justify-content: space-between;">
                                    <span style="font-size: 0.75rem; color: var(--text-ui); font-weight: 600;">Safety</span>
                                    <span id="profileSafetyTextDesktop" style="font-weight: 700; color: var(--text-ui); font-size: 0.8rem;">0.0%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Edit Mode -->
                <div id="profileEditDesktop" style="display: none;">
                    <div style="padding: 15px 20px; border-bottom: 1px solid var(--surface-border); display: flex; align-items: center; gap: 10px;">
                        <button onclick="switchToViewProfile('Desktop')" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; color: var(--sidebar-close-color);" title="Back">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                        <span style="font-size: 1rem; font-weight: 600; color: var(--text-ui);">Edit Profile</span>
                    </div>
                    <div style="padding: 15px;">
                        <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Name</label>
                        <input id="profileNameInputDesktop" type="text" maxlength="24" style="width: 100%; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.95rem; margin-bottom: 14px;" placeholder="Your name">
                        <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px;">Choose Avatar</label>
                        <div id="avatarGridDesktop" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px;"></div>
                        <button onclick="saveProfileEdit('Desktop')" style="width: 100%; padding: 9px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem;">Save</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mobile Profile Modal (Full modal style) -->
        <div id="profileModalMobile" class="modal">
            <div class="modal-content" style="max-width: 400px;">
                <!-- View Mode -->
                <div id="profileViewMobile">
                    <div class="modal-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span id="profileNameMobileTitle" class="modal-title">Profile</span>
                            <button onclick="switchToEditProfile('Mobile')" style="background: none; border: none; cursor: pointer; padding: 2px; display: flex; align-items: center; color: var(--sidebar-close-color);" title="Edit Profile">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                        </div>
                        <button class="close-btn" onclick="closeProfileModalMobile()">&times;</button>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <img id="profileAvatarMobile" src="res/avatar.svg" style="width: 64px; height: 64px; border-radius: 50%; border: 3px solid var(--avatar-border-idle);">
                        </div>
                        <div style="margin-bottom: 12px;">
                            <div class="progress-track" style="border-radius: 8px; height: 24px; position: relative; overflow: hidden;">
                                <div id="profileLearningProgressMobile" style="background: var(--bar-learning); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px; position: absolute; left: 0; top: 0;"></div>
                                <div id="profileLearnedProgressMobile" style="background: var(--bar-learned); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px; position: absolute; left: 0; top: 0; z-index: 1;"></div>
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding: 0 10px; justify-content: space-between; z-index: 2;">
                                    <span style="font-size: 0.75rem; color: var(--text-ui); font-weight: 600;">Learned</span>
                                    <span id="profileLearnedTextMobile" style="font-weight: 700; color: var(--text-ui); font-size: 0.8rem;">0/90</span>
                                </div>
                            </div>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <div class="progress-track" style="border-radius: 8px; height: 24px; position: relative; overflow: hidden;">
                                <div id="profileCoverageProgressMobile" style="background: var(--bar-coverage); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px;"></div>
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding: 0 10px; justify-content: space-between;">
                                    <span style="font-size: 0.75rem; color: var(--text-ui); font-weight: 600;">Coverage</span>
                                    <span id="profileCoverageTextMobile" style="font-weight: 700; color: var(--text-ui); font-size: 0.8rem;">0.0%</span>
                                </div>
                            </div>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <div class="progress-track" style="border-radius: 8px; height: 24px; position: relative; overflow: hidden;">
                                <div id="profileSafetyProgressMobile" style="background: var(--bar-safety); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px;"></div>
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding: 0 10px; justify-content: space-between;">
                                    <span style="font-size: 0.75rem; color: var(--text-ui); font-weight: 600;">Safety</span>
                                    <span id="profileSafetyTextMobile" style="font-weight: 700; color: var(--text-ui); font-size: 0.8rem;">0.0%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Edit Mode -->
                <div id="profileEditMobile" style="display: none;">
                    <div class="modal-header">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <button onclick="switchToViewProfile('Mobile')" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; color: var(--sidebar-close-color);" title="Back">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            </button>
                            <span class="modal-title">Edit Profile</span>
                        </div>
                        <button class="close-btn" onclick="closeProfileModalMobile()">&times;</button>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <label style="display: block; font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Name</label>
                        <input id="profileNameInputMobile" type="text" maxlength="24" style="width: 100%; padding: 9px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 1rem; margin-bottom: 16px;" placeholder="Your name">
                        <label style="display: block; font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px;">Choose Avatar</label>
                        <div id="avatarGridMobile" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;"></div>
                        <button onclick="saveProfileEdit('Mobile')" style="width: 100%; padding: 11px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 1rem;">Save</button>
                    </div>
                </div>
            </div>
        </div>

        <div id="aboutModal" class="modal">
            <div class="modal-content" style="
                max-width: 700px;
                border-radius: 14px;
                overflow: hidden;
                background: var(--surface);
            ">

            <!-- Header -->
            <div style="
                background: var(--about-header-bg);
                color: #ffffff;
                padding: 22px 26px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <span style="font-size: 1.5rem; font-weight: 600;">
                    About SquanGo CSP
                </span>
                <button class="close-btn" onclick="closeAboutModal()" style="
                    color: white;
                    font-size: 1.6rem;
                    opacity: 0.9;
                ">&times;</button>
            </div>

            <!-- Body -->
            <div style="
                padding: 28px 30px;
                color: var(--text-ui);
                line-height: 1.65;
                max-height: 70vh;
                overflow-y: auto;
                background: var(--surface2);
            ">

                <!-- Intro -->
                <section style="margin-bottom: 26px;">
                    <p style="margin: 0; font-size: 1rem; color: var(--text-secondary);">
                    SquanGo CSP is a focused Square-1 CSP training tool built for speedcubers
                    who want structure, repetition, and zero fluff.
                    It started as a personal motivation tool and slowly turned into something
                    worth sharing.
                    </p>
                </section>

                <!-- Developer -->
                <section style="
                    background: var(--surface);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 22px;
                ">
                    <p style="font-weight: 600; margin-bottom: 6px;">Developer</p>
                    <p style="margin: 0 0 10px 0; color: var(--text-secondary);">
                    Created by <strong>Abid Ibn Ashraf</strong>
                    </p>

                    <p style="margin: 0; font-size: 0.95rem; color: var(--text-secondary);">
                    Contact & feedback:
                    <strong>Discord — <span style="color: var(--text-ui);">abid_ibn_ashraf</span></strong>
                    </p>
                </section>

                <!-- Credits -->
                <section style="
                    background: var(--surface);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 22px;
                ">
                    <p style="font-weight: 600; margin-bottom: 10px;">Credits & Inspiration</p>

                    <p style="margin: 0 0 10px 0; font-size: 0.95rem; color: var(--text-secondary);">
                    Major credit goes to <strong>Eva Kato (Hashtag Cuber)</strong>.
                    The overall Homepage layout, case images and most of the alg data are based on her work.
                    </p>

                    <p style="margin: 0; font-size: 0.95rem; color: var(--text-secondary);">
                    Additional credit to my frind<strong>Matt</strong> — the Chinese NR holder for sq1 —
                    for helping me out in this project. Matt's preset is built solemnly by him, the dark mode is also his contribution alone, and he helped me refine the site further.
                    </p>
                </section>

                <!-- Scramble -->
                <section style="
                    background: var(--surface);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 22px;
                ">
                    <p style="font-weight: 600; margin-bottom: 8px;">Scramble Generator</p>
                    <p style="margin: 0 0 10px 0; font-size: 0.95rem; color: var(--text-secondary);">
                    Square-1 scrambles are generated using code from
                    <strong>csTimer</strong>, written by Shuang Chen (cs0x7f),
                    licensed under GPL-3.0.
                    </p>

                    <a href="https://github.com/cs0x7f/cstimer/blob/master/src/js/scramble/scramble_sq1_new.js"
                    target="_blank"
                    style="font-size: 0.95rem; font-weight: 500; color: var(--about-link-color); text-decoration: none;">
                    View source on GitHub →
                    </a>
                </section>

                <!-- Open Source -->
                <section style="
                    background: var(--surface);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    padding: 20px;
                ">
                    <p style="font-weight: 600; margin-bottom: 8px;">Open Source</p>
                    <p style="margin: 0 0 10px 0; font-size: 0.95rem; color: var(--text-secondary);">
                    SquanGo CSP is open source. You’re free to explore the code,
                    suggest improvements, or fork it for your own use.
                    </p>

                    <a href="https://github.com/Abid-speedcuber/CSP-squango"
                        target="_blank"
                        style="font-size: 0.95rem; font-weight: 500; color: var(--about-link-color); text-decoration: none;"
                    >
                        View repository on GitHub →
                    </a>
                </section>

            </div>
        </div>
        </div>
    `;

    document.body.appendChild(modalContainer);

    // Setup color button handlers after modals are created
    document.querySelectorAll('.color-btn').forEach(btn => {
        // Set contrast-aware text color on load
        const bg = btn.getAttribute('data-color');
        if (bg) {
            const r = parseInt(bg.substr(1,2),16), g = parseInt(bg.substr(3,2),16), b = parseInt(bg.substr(5,2),16);
            btn.style.color = (0.299*r + 0.587*g + 0.114*b) > 128 ? '#000000' : '#ffffff';
        }
        btn.addEventListener('click', function () {
            const face = this.getAttribute('data-face');
            const color = this.getAttribute('data-color');

            colorScheme[face + 'Color'] = color;

            const sameFaceButtons = document.querySelectorAll(`.color-btn[data-face="${face}"]`);
            sameFaceButtons.forEach(b => {
                b.classList.toggle('selected', b === this);
            });

            // Auto-save
            markParityAlgorithmsDirty();
            saveState();

            // Recalculate parity if needed
            if (needsParityRecalculation()) {
                calculateAndCacheAllParity();
                render();
            }
        });
    });
}

/*
╔════════════════════════════════════════════════════════════════════════════╗
║                               SETTINGS MODAL                               ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

window.openSettingsModal = function() {
    window.openUnifiedSettings('homescreen');
}

export function closeSettingsModal() {
    _closeSettingsModal();
}

export function handlePresetChange(presetName) {
    const isSamePreset = presetName === currentPreset;

    if (isSamePreset) {
        const reloadModal = document.createElement('div');
        reloadModal.className = 'modal active';
        reloadModal.style.zIndex = '10002';
        reloadModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header" style="background: var(--surface); border-bottom: 2px solid var(--border-color);">
                    <span class="modal-title">Reload ${presetName.replace(/_/g, ' ')}?</span>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="margin: 0 0 10px 0; font-size: 1rem; line-height: 1.6; color: var(--text-primary);">
                        Reloading will <strong>keep</strong> your learning progress (priority levels, learned, and learning) and personal preferences (font size, hints, etc.).<br><br>
                        It will <strong>replace</strong> your algs, color scheme, tracing guides, case display names, subtitles, and notes with what's in the newest version of this preset.
                    </p>
                    <p style="font-weight: 500;">
                        We recommend exporting your data before reloading.
                    </p> <br>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="exportData(); showToast('Data exported! You can now safely reload.', 3000, 'success');" style="padding: 10px 20px; background: transparent; color: var(--bar-learned); border: 2px solid var(--bar-learned); border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='var(--bar-learned)';this.style.color='#fff'" onmouseout="this.style.background='transparent';this.style.color='var(--bar-learned)'">Export First</button>
                        <button onclick="this.closest('.modal').remove(); document.documentElement.classList.remove('scroll-locked'); closeSidebar(); applyPreset(\`${presetName}\`, false, false).then(() => { if(typeof initializePresetSelector === 'function') initializePresetSelector(); });" style="padding: 10px 20px; background: transparent; color: var(--parity-invalid); border: 2px solid var(--parity-invalid); border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='var(--parity-invalid)';this.style.color='#fff'" onmouseout="this.style.background='transparent';this.style.color='var(--parity-invalid)'">Reload Anyway</button>
                        <button onclick="this.closest('.modal').remove();" style="padding: 10px 20px; background: transparent; color: var(--text-secondary); border: 2px solid var(--border-color); border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='var(--surface-border)'" onmouseout="this.style.background='transparent'">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        const close = () => {
            reloadModal.remove();
            removeCloseModalFromStack(close);
        }
        reloadModal.querySelector(".close-btn").onclick = close;
        pushModalState('reloadPresetModal', close);
        document.body.appendChild(reloadModal);
        return;
    }

    // Validate preset exists in config
    if (!PRESET_CONFIG[presetName]) {
        showToast('Invalid preset selected', 2000, 'error');
        document.getElementById('presetSelector').value = currentPreset;
        return;
    }

    // Create a custom warning modal with export option
    const warningModal = document.createElement('div');
    warningModal.className = 'modal active';
    warningModal.style.zIndex = '10002';
    warningModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header" style="background: var(--surface); border-bottom: 2px solid var(--border-color);">
                <span class="modal-title" style="color: var(--text-primary);">Warning: Data Loss</span>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <p style="margin: 0 0 15px 0; font-size: 1rem; line-height: 1.6; color: var(--text-primary);">
                    Switching to "<strong>${presetName.replaceAll("_", " ")}</strong>" will <strong>keep</strong> your learning progress (priority levels, learned, and learning) and personal preferences (font size, hints, etc.).<br><br>
                    It will <strong>replace</strong> your algs, color scheme, tracing guides, case display names, subtitles, and notes with what's in the preset.
                </p>
                <p style="font-weight: 500;">
                    We recommend exporting your data before reloading.
                </p> <br>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="exportData(); showToast('Data exported! You can now safely switch presets.', 3000, 'success');" style="padding: 10px 20px; background: transparent; color: var(--bar-learned); border: 2px solid var(--bar-learned); border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: all 0.2s;" onmouseover="this.style.background='var(--bar-learned)';this.style.color='#fff'" onmouseout="this.style.background='transparent';this.style.color='var(--bar-learned)'">
                        Export Data First
                    </button>
                    <button onclick="this.closest('.modal').remove(); document.documentElement.classList.remove('scroll-locked'); closeSidebar(); applyPreset(\`${presetName}\`, false, false).then(() => { if(typeof initializePresetSelector === 'function') initializePresetSelector(); setTimeout(() => openGeneralNotesModal(), 800); });" style="padding: 10px 20px; background: transparent; color: var(--parity-invalid); border: 2px solid var(--parity-invalid); border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: all 0.2s;" onmouseover="this.style.background='var(--parity-invalid)';this.style.color='#fff'" onmouseout="this.style.background='transparent';this.style.color='var(--parity-invalid)'">
                        Switch Anyway
                    </button>
                    <button onclick="this.closest('.modal').remove(); document.documentElement.classList.remove('scroll-locked');" style="padding: 10px 20px; background: transparent; color: var(--text-secondary); border: 2px solid var(--border-color); border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: all 0.2s;" onmouseover="this.style.background='var(--surface-border)'" onmouseout="this.style.background='transparent'">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;

    const close = () => {
        warningModal.remove();
        removeCloseModalFromStack(close);
    }
    warningModal.querySelector(".close-btn").onclick = close;
    pushModalState('presetWarningModal', close);
    document.body.appendChild(warningModal);
    document.documentElement.classList.add('scroll-locked');
}

window.toggleHints = function(isChecked) {
    updateAppState({ showHints: isChecked });
    localStorage.setItem('showHints', isChecked);
    applyHintVisibility();
}

export function applyHintVisibility() {
    if (showHints) {
        document.body.classList.remove('hide-hints');
    } else {
        document.body.classList.add('hide-hints');
    }
}

window.toggleHideInstructions = function(isChecked) {
    updateAppState({ hideInstructions: isChecked });
    saveState();
    applyInstructionVisibility();
}

export function applyInstructionVisibility() {
    const instructionBtns = document.querySelectorAll('.settings-info-btn, .homepage-info-btn, .training-info-btn, .case-detail-info-btn, .instruction-btn');
    instructionBtns.forEach(btn => {
        btn.style.display = hideInstructions ? 'none' : 'flex';
    });
}

window.toggleHideParenthesis = function(isChecked) {
    updateAppState({ hideParenthesis: isChecked });
    saveState();
    render();
}

window.toggleEnhancedAccess = function(isChecked) {
    setEnhancedAccess(isChecked);
}

// Populate preset dropdown dynamically
export function populatePresetDropdown(selectorId = 'presetSelector') {
    const presetSelector = document.getElementById(selectorId);
    if (!presetSelector) return;

    presetSelector.innerHTML = '';

    for (const presetName in PRESET_CONFIG) {
        const option = document.createElement('option');
        option.value = presetName;
        // Remove underscores and clean up display name
        option.textContent = presetName.replace(/_/g, ' ').replace(/'/g, "'");
        presetSelector.appendChild(option);
    }

    // Set current preset as selected
    if (typeof currentPreset !== 'undefined') {
        presetSelector.value = currentPreset;
    }
}

// Settings button click handler
document.addEventListener('DOMContentLoaded', () => {
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.onclick = () => window.openUnifiedSettings('homescreen');
});

// Color Scheme Modal Functions
window.openColorSchemeModal = function() {
    const modal = document.getElementById('colorSchemeModal');

    window.modalScrollY = window.scrollY;
    document.body.style.top = `-${window.modalScrollY}px`;
    document.documentElement.classList.add('scroll-locked');
    modal.style.zIndex = '10015';
    modal.classList.add('active');

    pushModalState('colorSchemeModal', closeColorSchemeModal);

    // Highlight currently selected colors
    document.querySelectorAll('.color-btn').forEach(btn => {
        const face = btn.getAttribute('data-face');
        const color = btn.getAttribute('data-color');
        const currentColor = colorScheme[face + 'Color'];
        btn.classList.toggle('selected', color === currentColor);
    });
}

export function closeColorSchemeModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('colorSchemeModal');
        modal.classList.remove('active');
        document.documentElement.classList.remove('scroll-locked');
    });
}

window.updateImageSizePreview = function(value) {
    document.getElementById('sizeValue').textContent = value;
    updateAppState({ scrambleImageSize: parseInt(value) });
    saveState();
}

window.updateAlgFontSizePreview = function(value) {
    document.getElementById('algFontSizeValue').textContent = value;
    updateAppState({ algorithmFontSize: parseInt(value) });
    localStorage.setItem('algorithmFontSize', value);
    applyAlgorithmFontSize();
}

export function applyAlgorithmFontSize() {
    const style = document.getElementById('algorithm-font-size-style') || document.createElement('style');
    style.id = 'algorithm-font-size-style';
    style.textContent = `
        .alg-line, .alg-interactive {
            font-size: ${algorithmFontSize}px !important;
        }
    `;
    if (!style.parentNode) {
        document.head.appendChild(style);
    }
}

// Apply initial hint visibility state on load
applyHintVisibility();

// New parity analysis using ParityTracerLibrary
export function openNewParityAnalysis(scramble) {
    if (!ParityTracerLibrary) {
        showToast('Parity Tracer library not loaded', 3000, 'error');
        return;
    }

    ParityTracerLibrary.createModal({
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#ffffff',
        hideInstructionButton: hideInstructions,
        instructionText1: 'Enter your scramble in the top input bar to trace parity using Cale\'s method.',
        instructionText2: 'You can change the color scheme from Color Scheme Settings in the main Settings menu.',
        instructionText3: 'Customize the tracing start point from the settings button at the bottom right.',
        topColor: colorScheme.topColor,
        topColorName: getColorName(colorScheme.topColor),
        topColorShort: getColorName(colorScheme.topColor).charAt(0),
        bottomColor: colorScheme.bottomColor,
        bottomColorName: getColorName(colorScheme.bottomColor),
        bottomColorShort: getColorName(colorScheme.bottomColor).charAt(0),
        frontColor: colorScheme.frontColor,
        rightColor: colorScheme.rightColor,
        backColor: colorScheme.backColor,
        leftColor: colorScheme.leftColor,
        scrambleText: scramble || '',
        generateImage: true,
        imageSize: scrambleImageSize || 200
    });
}

// Homepage Info Modal
window.showHomepageInfoModal = function() {
    pushModalState('homepageInfoModal', closeHomepageInfoModal);

    let infoModal = document.getElementById('homepageInfoModal');
    if (!infoModal) {
        infoModal = document.createElement('div');
        infoModal.id = 'homepageInfoModal';
        infoModal.className = 'training-info-modal';
        infoModal.innerHTML = `
            <div class="training-info-content">
                <div class="training-info-header">
                    <span class="training-info-title">App Guide</span>
                    <button class="training-info-close" onclick="closeHomepageInfoModal()">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text">Click on <strong>Profile</strong> in the top right corner to see your progress stats. The <strong style="color: var(--bar-learned);">green bar (Learned)</strong> shows how many cases out of 90 you have learned. The <strong style="color: var(--accent);">blue bar (Coverage)</strong> tells you how often you will get a CSP you know. The <strong style="color: var(--bar-learning);">orange bar (Safety)</strong> tells you how often you won't get parity (this is equal to Safety + 0.5 * (1 - Safety)).</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text">Click the <b>checkmark</b> on a case to mark it as <b>learning</b>; click again to mark it as <b>learned</b>. Right click to mark the case as learned; right click again to mark as learning.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text">The three dots menu of a case lets you<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;1. change the <b>priority state</b> of a case<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;2. <b>add notes</b> for the case<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;3. <b>train the case</b> (you can choose specific angles of the case to train if you want)<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;4. <b>edit case</b> (change case title, subtitles, and the algs if you have Enhanced Access on).</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text">Sort <strong>By Priority</strong> instead of by Highest Probability to organize cases by learning priority. <b>Learning Cases</b> sit above level 7, and <b>Learned Cases</b> sit below level 1. Adjust planned priorities via the three dots menu.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text"><strong>Hover</strong> over any alg to see its setup and shape path. <strong>Click on the alg</strong> to keep the popup open. Then, you can click the setup to <b>see the parity analysis</b> of the alg, or click on the shape path to <b>watch animation</b> of the alg.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text">Use <strong>Color Scheme Settings</strong> to change the color scheme of your squan. Impacts parity tracing and "draw scramble".</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">6</div>
                        <div class="training-info-text"><strong>Export/Import Data</strong> in Menu to backup your progress or transfer between devices. Exporting will download a JSON file to your device. To import, simply select that file in the file selector.</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }

    document.documentElement.classList.add('scroll-locked');
    infoModal.classList.add('active');
}

export function closeHomepageInfoModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('homepageInfoModal');
        if (modal) {
            modal.classList.remove('active');
        }
    });
}

export function openEditCaseModal(caseName) {
    const item = CSPData.getCase(caseName);
    if (!item) return;

    const allAlgs = getCaseAlgorithmList(item);

    const customName = displayNames[caseName] || '';
    const customSubtitle = perCaseSubtitles.get(caseName) || '';

    // Close any existing context menu
    const existingMenu = document.getElementById('caseContextMenu');
    if (existingMenu) existingMenu.remove();

    pushModalState('editCaseModal', closeEditCaseModal);

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'editCaseModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; max-height: 80vh; min-height: 20vh;">
            <div class="modal-header">
                <div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="modal-title" id="editCaseTitle">${getDisplayName(caseName)}</span>
                        <button onclick="openCaseRenameModal('${caseName.replace(/'/g, "\\'")}', '${customName.replace(/'/g, "\\'")}', '${customSubtitle.replace(/'/g, "\\'")}' )" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center;">
                            <img src="res/pen.svg" style="width: 20px; height: 20px;" alt="Edit name">
                        </button>
                        <button onclick="showEditCaseInfoModal()" style="background: var(--surface2); border: 1px solid var(--border-color); color: var(--text-secondary); cursor: pointer; padding: 6px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; width: 32px; height: 32px;" title="Help" onmouseover="this.style.background='var(--surface-border)'" onmouseout="this.style.background='var(--surface2)'">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </button>
                    </div>
                    ${perCaseSubtitles.has(caseName) ? `<div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;" id="editCaseSubtitle">${perCaseSubtitles.get(caseName)}</div>` : '<div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; display: none;" id="editCaseSubtitle"></div>'}
                </div>
                <button class="close-btn" onclick="attemptCloseEditCaseModal()">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                <div style="margin-bottom: 15px;" id="algorithmsSection">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-secondary);">Algs:</label>
                    <div id="editAlgsList" style="display: flex; flex-direction: column; gap: 10px;">
                        ${allAlgs.map((alg, idx) => `
                            <div style="display: flex; gap: 8px; align-items: center;" data-alg-index="${idx}">
                                <input type="text" class="alg-input" value="${alg}" data-original="${alg}" style="flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; font-family: monospace; font-size: 0.9rem; font-weight: 600; transition: color 0.15s;">
                                <button onclick="this.parentElement.remove()" style="padding: 6px; background: var(--delete-btn-bg); color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
                                    <img src="res/delete.svg" style="width: 16px; height: 16px;" alt="Delete">
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <button id="addAlgorithmBtn" onclick="addNewAlgorithmField()" style="margin-top: 10px; padding: 8px 16px; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">+ Add Algorithm</button>
                </div>

                ${evilnessFactor ? `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 16px; padding: 12px 0; border-top: 1px solid var(--surface-border);">
                    <label style="font-weight: 500; color: var(--text-secondary); font-size: 0.95rem;">Mark as Evil</label>
                    <label class="evil-switch" style="position:relative;display:inline-block;width:42px;height:24px;">
                        <input type="checkbox" id="evilCaseToggle" ${evilnessMap[caseName] ? 'checked' : ''} onchange="evilnessMap['${caseName.replace(/'/g, "\\'")}'] = this.checked; saveState();" style="opacity:0;width:0;height:0;">
                        <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${evilnessMap[caseName] ? 'var(--parity-invalid, #c00)' : 'var(--surface-border)'};border-radius:24px;transition:.3s;">
                            <span style="position:absolute;content:'';height:18px;width:18px;left:${evilnessMap[caseName] ? '21px' : '3px'};bottom:3px;background:white;border-radius:50%;transition:.3s;display:block;" id="evilSwitchKnob"></span>
                        </span>
                    </label>
                </div>
                ` : ''}
                <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--surface-border);">
                    <button onclick="saveEditedCase('${caseName.replace(/'/g, "\\'")}' )" style="padding: 10px 20px; background: var(--bar-learned); color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: 600;">Save Changes</button>
                    <button onclick="closeEditCaseModal()" style="padding: 10px 20px; background: var(--delete-btn-bg); color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.dataset.caseName = caseName;
    window.modalScrollY = window.scrollY;
    document.body.style.top = `-${window.modalScrollY}px`;
    document.documentElement.classList.add('scroll-locked');

    // Wire up evil switch live animation
    if (evilnessFactor) {
        const evilToggle = modal.querySelector('#evilCaseToggle');
        if (evilToggle) {
            evilToggle.addEventListener('change', function() {
                const span = this.nextElementSibling;
                const knob = document.getElementById('evilSwitchKnob');
                span.style.background = this.checked ? 'var(--parity-invalid, #c00)' : 'var(--surface-border)';
                if (knob) knob.style.left = this.checked ? '21px' : '3px';
            });
        }
    }


    // Apply enhanced access restrictions
    if (!enhancedAccess) {
        const algorithmsSection = document.getElementById('algorithmsSection');
        if (algorithmsSection) {
            algorithmsSection.style.opacity = '0.5';
            algorithmsSection.style.pointerEvents = 'none';
        }

        const addAlgorithmBtn = document.getElementById('addAlgorithmBtn');
        if (addAlgorithmBtn) {
            addAlgorithmBtn.disabled = true;
            addAlgorithmBtn.style.cursor = 'not-allowed';
        }

        const algInputs = modal.querySelectorAll('.alg-input');
        algInputs.forEach(input => {
            input.contentEditable = 'false';
            input.style.cursor = 'not-allowed';
        });

        const deleteButtons = modal.querySelectorAll('#editAlgsList button');
        deleteButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.cursor = 'not-allowed';
        });
    }

    // Setup parity detection for algorithm inputs
    setTimeout(() => {
        const inputs = modal.querySelectorAll('.alg-input');
        inputs.forEach(input => {
            // Initial color coding for pre-filled values
            if (document.activeElement !== input) {
                updateInputColor(input);
            }

            input.addEventListener('focus', () => {
                // color stays, just clear on empty
            });

            input.addEventListener('blur', () => {
                const rawText = input.value.trim();
                if (rawText && rawText !== 'Done!') {
                    input.value = typeof expandAndNormalize === 'function' ? expandAndNormalize(rawText) : window.ScrambleNormalizer.normalizeScramble(rawText);
                }
                updateInputColor(input);
            });

            input.addEventListener('input', () => {
                updateInputColor(input);
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text/plain');
                const start = input.selectionStart;
                const end = input.selectionEnd;
                const currentValue = input.value;
                input.value = currentValue.substring(0, start) + text + currentValue.substring(end);
                input.selectionStart = input.selectionEnd = start + text.length;
                updateInputColor(input);
            });
        });
    }, 200);
}

export function getModalCaseShapeData(caseName) {
    return CSPData.getShapeEntry(caseName);
}

export function updateInputColor(input) {
    const alg = input.value.trim();
    if (!alg || alg === 'Done!') { input.style.color = ''; input.style.fontWeight = ''; return; }
    if (!caleTracer) {
        input.style.color = '';
        input.style.fontWeight = '';
        return;
    }

    try {
        const modal = document.getElementById('editCaseModal');
        if (!modal) return;
        const caseName = _getEditModalCaseName(modal);
        const canonicalIdx = caseName ? CSPData.getCanonicalShapeIndex(caseName) : null;
        const caseShapeData = caseName ? getModalCaseShapeData(caseName) : null;
        const expanded = typeof expandForColorCheck === 'function' ? expandForColorCheck(alg) : alg;
        const normalized = normalizeScramble(expanded);
        const result = algToShapeIndex(normalized);
        const idx = result.shapeIndex;
        const isDirectMatch = canonicalIdx !== null && idx === canonicalIdx;
        const isInOrg = caseShapeData && caseShapeData.org && caseShapeData.org.includes(idx);
        const isInMir = caseShapeData && caseShapeData.mir && caseShapeData.mir.includes(idx);

        if (isDirectMatch || isInOrg || isInMir) {
            const setup = invertScramble(normalized);
            const parityText = caleTracer.getParityTextFromScramble(setup, {
                topColor: colorScheme.topColor,
                bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor,
                rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor,
                leftColor: colorScheme.leftColor
            }, cornerStickerMode);
            const oddColor = isInMir && !isDirectMatch && !isInOrg ? 'var(--parity-odd-mirror)' : 'var(--parity-odd)';
            const evenColor = isInMir && !isDirectMatch && !isInOrg ? 'var(--parity-even-mirror)' : 'var(--parity-even)';
            input.style.color = parityText === 'Odd' ? oddColor : evenColor;
        } else {
            input.style.color = 'var(--parity-invalid)';
        }
        input.style.fontWeight = '600';
    } catch {
        input.style.color = 'var(--parity-invalid)';
        input.style.fontWeight = '600';
    }
}

// Helper to get case name from the edit case modal
export function _getEditModalCaseName(modal) {
    if (!modal) return null;
    if (modal.dataset.caseName) return modal.dataset.caseName;
    const titleElement = modal.querySelector('.modal-title');
    if (!titleElement) return null;
    for (const dataItem of data) {
        if (getDisplayName(dataItem.name) === titleElement.textContent || dataItem.name === titleElement.textContent) return dataItem.name;
    }
    return null;
}

// Function to add new algorithm field
window.addNewAlgorithmField = function () {
    const algsList = document.getElementById('editAlgsList');
    if (!algsList) return;

    const newField = document.createElement('div');
    newField.style.cssText = 'display: flex; gap: 8px; align-items: center;';
    newField.innerHTML = `
        <input type="text" class="alg-input" value="" placeholder="Enter algorithm" data-original="" style="flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; font-family: monospace; font-size: 0.9rem; font-weight: 600; transition: color 0.15s;">
        <button onclick="this.parentElement.remove()" style="padding: 6px; background: var(--delete-btn-bg); color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
            <img src="res/delete.svg" style="width: 16px; height: 16px;" alt="Delete">
        </button>
    `;

    algsList.appendChild(newField);

    const input = newField.querySelector('.alg-input');
    input.addEventListener('blur', () => {
        const rawText = input.value.trim();
        if (rawText && rawText !== 'Done!') {
            input.value = typeof expandAndNormalize === 'function' ? expandAndNormalize(rawText) : window.ScrambleNormalizer.normalizeScramble(rawText);
        }
        updateInputColor(input);
    });

    input.addEventListener('input', () => {
        updateInputColor(input);
    });

    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const currentValue = input.value;
        input.value = currentValue.substring(0, start) + text + currentValue.substring(end);
        input.selectionStart = input.selectionEnd = start + text.length;
        updateInputColor(input);
    });

    input.focus();
};

// Function to open case rename modal
window.openCaseRenameModal = function (caseName, currentName, currentSubtitle = '') {
    const renameModal = document.createElement('div');
    renameModal.className = 'modal active';
    renameModal.id = 'caseRenameModal';
    renameModal.style.zIndex = '10002';
    renameModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;
        ">
            <div class="modal-header">
                <span class="modal-title">Edit Case Name & Subtitle</span>
                <button class="close-btn" onclick="closeCaseRenameModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Custom Name:</label>
                    <input type="text" id="caseRenameInput" value="${currentName}" placeholder="Leave empty for default name" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Subtitle (optional):</label>
                    <input type="text" id="caseSubtitleRenameInput" value="${currentSubtitle}" placeholder="Enter a subtitle for this case" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 1rem;">
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="applyCaseRename('${caseName.replace(/'/g, "\\'")}' )" style="padding: 10px 20px; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: 600;">OK</button>
                    <button onclick="closeCaseRenameModal()" style="padding: 10px 20px; background: var(--delete-btn-bg); color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(renameModal);

    setTimeout(() => {
        const input = document.getElementById('caseRenameInput');
        if (input) {
            input.focus();
            input.select();
        }
    }, 100);
};

window.closeCaseRenameModal = function () {
    const modal = document.getElementById('caseRenameModal');
    if (modal) modal.remove();
};

window.applyCaseRename = function (caseName) {
    const nameInput = document.getElementById('caseRenameInput');
    const subtitleInput = document.getElementById('caseSubtitleRenameInput');
    if (!nameInput || !subtitleInput) return;

    const newName = nameInput.value.trim();
    const newSubtitle = subtitleInput.value.trim();

    // Store in temporary variables for parent modal to use
    window.tempCaseRename = {
        caseName: caseName,
        newName: newName,
        newSubtitle: newSubtitle
    };

    // Update the title and subtitle in edit modal immediately
    const titleElement = document.getElementById('editCaseTitle');
    const subtitleElement = document.getElementById('editCaseSubtitle');

    if (titleElement) {
        titleElement.textContent = newName || defaultDisplayNames[caseName] || caseName;
    }

    if (subtitleElement) {
        if (newSubtitle) {
            subtitleElement.textContent = newSubtitle;
            subtitleElement.style.display = 'block';
        } else {
            subtitleElement.textContent = '';
            subtitleElement.style.display = 'none';
        }
    }

    closeCaseRenameModal();
};

window.saveCaseRename = function (caseName) {
    // This function is now called from saveEditedCase
    if (window.tempCaseRename && window.tempCaseRename.caseName === caseName) {
        const newName = window.tempCaseRename.newName;
        const newSubtitle = window.tempCaseRename.newSubtitle;

        if (newName) {
            displayNames[caseName] = newName;
        } else {
            displayNames[caseName] = defaultDisplayNames[caseName] || caseName;
        }

        if (newSubtitle) {
            perCaseSubtitles.set(caseName, newSubtitle);
        } else {
            perCaseSubtitles.delete(caseName);
        }

        window.tempCaseRename = null;
    }
};

export function closeEditCaseModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('editCaseModal');
        if (modal) {
            modal.remove();
            document.documentElement.classList.remove('scroll-locked');
        }
    });
}

window.attemptCloseEditCaseModal = function () {
    const algInputs = document.querySelectorAll('#editAlgsList .alg-input');
    const originalAlgs = [];
    const modal = document.getElementById('editCaseModal');
    if (!modal) return;

    const titleElement = modal.querySelector('.modal-title');
    if (!titleElement) {
        closeEditCaseModal();
        return;
    }

    // Find the actual case by searching through data
    let item = null;
    for (const dataItem of data) {
        if (getDisplayName(dataItem.name) === titleElement.textContent || dataItem.name === titleElement.textContent) {
            item = dataItem;
            break;
        }
    }

    if (!item) {
        closeEditCaseModal();
        return;
    }

    originalAlgs.push(...getCaseAlgorithmList(item));

    const currentAlgs = Array.from(algInputs).map(input => input.value.trim()).filter(v => v);

    // Check if algorithms changed
    let algsChanged = false;
    if (originalAlgs.length !== currentAlgs.length) {
        algsChanged = true;
    } else {
        for (let i = 0; i < originalAlgs.length; i++) {
            if (originalAlgs[i] !== currentAlgs[i]) {
                algsChanged = true;
                break;
            }
        }
    }

    // Check if name/subtitle changed (tempCaseRename exists means changes were made)
    const nameChanged = !!(window.tempCaseRename && window.tempCaseRename.caseName === item.name);

    if (algsChanged || nameChanged) {
        showSaveDiscardConfirmation(
            'You have unsaved changes. Do you want to save them?',
            () => saveEditedCase(item.name),
            () => {
                window.tempCaseRename = null;
                closeEditCaseModal();
            },
            null
        );
    } else {
        window.tempCaseRename = null;
        closeEditCaseModal();
    }
};

window.showEditCaseInfoModal = function () {
    let infoModal = document.getElementById('editCaseInfoModal');
    if (!infoModal) {
        infoModal = document.createElement('div');
        infoModal.id = 'editCaseInfoModal';
        infoModal.className = 'training-info-modal';
        infoModal.innerHTML = `
            <div class="training-info-content">
                <div class="training-info-header">
                    <span class="training-info-title">Edit Case Guide</span>
                    <button class="training-info-close" onclick="closeEditCaseInfoModal()">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text"><strong>Parity Labels:</strong> Each alg has a colored label to its right, indicating its parity. <span style="color: var(--parity-odd); font-weight: 600;">Green = Odd</span>, <span style="color: var(--parity-even); font-weight: 600;">Blue = Even</span>. <span style="color: var(--parity-invalid); font-weight: 600;">Red = Invalid</span>. (Your alg doesn't match this case at all. Double-check your input for typos or missing slices.) The label disappears while editing and reappears when you click away.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text"><strong>Auto-Normalization:</strong> When you finish editing an alg (click away from the input), it's automatically normalized to standard notation. Formatting will be standardized, and if your alg solves the z2 case, it will be marked with a "(mirrored)" tag.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text"><strong>Remember to Save:</strong> All changes (including name/subtitle edits) are only saved when you click "Save Changes" at the bottom.</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }

    pushModalState('editCaseInfoModal', closeEditCaseInfoModal);
    infoModal.classList.add('active');
};

window.closeEditCaseInfoModal = function () {
    closeModalWithHistory(() => {
        const modal = document.getElementById('editCaseInfoModal');
        if (modal) {
            modal.classList.remove('active');
        }
    });
};

export function saveEditedCase(caseName) {
    // Save name and subtitle from temp rename
    saveCaseRename(caseName);

    const algInputs = document.querySelectorAll('#editAlgsList .alg-input');

    // Collect all algorithms
    const allAlgs = Array.from(algInputs).map(input => input.value.trim()).filter(v => v);

    // Save custom algorithms
    if (allAlgs.length > 0) {
        customAlgorithms.set(caseName, allAlgs);
    } else {
        customAlgorithms.delete(caseName);
    }

    markParityAlgorithmsDirty();
    saveState();

    // Recalculate parity
    calculateAndCacheAllParity();

    render();
    closeEditCaseModal();
    showToast('Case updated successfully!', 2000, 'success');
}

export function openCustomizeSVGsModal() {
    closeSettingsModal();
    SVGEditor.open();
}

export function openNotesModal(caseName) {
    const comment = comments.get(caseName) || '';
    window.originalNoteContent = comment; // Store original for comparison

    // Close any existing context menu
    const existingMenu = document.getElementById('caseContextMenu');
    if (existingMenu) existingMenu.remove();

    pushModalState('notesModal', closeNotesModal);

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'notesModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; max-height: 80vh; min-height: 20vh;">
            <div class="modal-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="modal-title">Notes: ${getDisplayName(caseName)}</span>
                    <button onclick="showNotesInfoModal()" style="background: var(--surface2); border: 1px solid var(--border-color); color: var(--text-secondary); cursor: pointer; padding: 6px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; width: 32px; height: 32px;" title="Help" onmouseover="this.style.background='var(--surface-border)'" onmouseout="this.style.background='var(--surface2)'">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </button>
                </div>
                <button class="close-btn" onclick="attemptCloseNotesModal('${caseName.replace(/'/g, "\\'")}' )">&times;</button>
            </div>
            <div class="modal-body">
                <textarea id="notesTextarea" style="width: 100%; height: 200px; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; font-family: inherit; resize: vertical;">${comment}</textarea>
                <div style="text-align: center; margin-top: 15px;">
                    <button onclick="saveNotes('${caseName.replace(/'/g, "\\'")}' )" style="padding: 10px 20px; background: var(--bar-learned); color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: 600;">Save</button>
                    <button onclick="attemptCloseNotesModal('${caseName.replace(/'/g, "\\'")}' )" style="padding: 10px 20px; background: var(--delete-btn-bg); color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;

    // Cancel any pending render before locking scroll
    if (typeof renderTimeout !== 'undefined' && renderTimeout) {
        clearTimeout(renderTimeout);
        renderTimeout = null;
    }
    window.modalScrollY = window.scrollY;
    document.body.style.top = `-${window.modalScrollY}px`;
    document.documentElement.classList.add('scroll-locked');
    document.body.appendChild(modal);
}

window.attemptCloseNotesModal = function (caseName) {
    const textarea = document.getElementById('notesTextarea');
    const currentContent = textarea ? textarea.value.trim() : '';
    const originalContent = window.originalNoteContent || '';

    if (currentContent !== originalContent) {
        showSaveDiscardConfirmation(
            'You have unsaved changes. Do you want to save them?',
            () => saveNotes(caseName),
            () => {
                window.originalNoteContent = null;
                closeNotesModal();
            },
            null
        );
    } else {
        closeNotesModal();
    }
};

window.showNotesInfoModal = function () {
    let infoModal = document.getElementById('notesInfoModal');
    if (!infoModal) {
        infoModal = document.createElement('div');
        infoModal.id = 'notesInfoModal';
        infoModal.className = 'training-info-modal';
        infoModal.innerHTML = `
            <div class="training-info-content">
                <div class="training-info-header">
                    <span class="training-info-title">Notes Guide</span>
                    <button class="training-info-close" onclick="closeNotesInfoModal()">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text"><strong>Text Formatting:</strong> Notes support basic HTML formatting:<br>
                        • <b>Bold</b>: <code>&lt;b&gt;bold&lt;/b&gt;</code> or <code>&lt;strong&gt;bold&lt;/strong&gt;</code><br>
                        • <i>Italic</i>: <code>&lt;i&gt;italic&lt;/i&gt;</code> or <code>&lt;em&gt;italic&lt;/em&gt;</code><br>
                        • <u>Underline</u>: <code>&lt;u&gt;underline&lt;/u&gt;</code><br>
                        • <s>Strikethrough</s>: <code>&lt;s&gt;strikethrough&lt;/s&gt;</code><br>
                        • <span style="color:red;">Colored Text</span>: <code>&lt;font color="red"&gt;colored text&lt;/font&gt;</code><br>
                        • <code>&lt;br&gt;</code> for line breaks<br>
                        • <code>&lt;a href="url"&gt;link&lt;/a&gt;</code> for <span role="button" tabindex="0" onclick="return false" onkeydown="return false" onmousedown="this.style.color='purple'" onmouseup="this.style.color='#00f'" onmouseleave="this.style.color='#00f'" style="color:#00f;text-decoration:underline;cursor:pointer;user-select:none;">links</span><br> <br>
                    <strong>Preset makers, write notes with text formattings!! It's so much easier to read.</strong></div>

                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text">If you want to write notes that involve <b>more than one case</b>, consider using general notes (inside the menu bar) instead.</div>
                    </div>

                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text"><strong>Notes suggestions:</strong><br>
                        • Something short that reminds you of either the algs or the evilness.<br>
                        • Or you can write whatever floats your boat... have fun<br></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }

    pushModalState('notesInfoModal', closeNotesInfoModal);
    infoModal.classList.add('active');
};

window.closeNotesInfoModal = function () {
    closeModalWithHistory(() => {
        const modal = document.getElementById('notesInfoModal');
        if (modal) {
            modal.classList.remove('active');
        }
    });
};

export function closeNotesModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('notesModal');
        if (modal) {
            modal.remove();
            document.documentElement.classList.remove('scroll-locked');
        }
    });
}

export function saveNotes(caseName) {
    const textarea = document.getElementById('notesTextarea');
    const noteText = textarea.value.trim();

    if (noteText) {
        // Store raw HTML
        comments.set(caseName, noteText);
    } else {
        comments.delete(caseName);
    }

    saveState();
    render();
    closeNotesModal();
}

// General Notes Modal Functions
window.openGeneralNotesModal = function() {
    const existingMenu = document.getElementById('caseContextMenu');
    if (existingMenu) existingMenu.remove();

    pushModalState('generalNotesModal', closeGeneralNotesModal);

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'generalNotesModal';
    document.body.appendChild(modal);
    // Force reflow THEN activate to ensure fixed positioning is applied before any layout
    modal.getBoundingClientRect();
    modal.classList.add('active');
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px; max-height: 85vh; height: 85vh; display: flex; flex-direction: column;">
            <div class="modal-header" style="flex-shrink: 0;">
                <span class="modal-title">General Notes</span>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button id="editGeneralNotesBtn" onclick="toggleEditGeneralNotes()" style="padding: 6px 16px; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">Edit</button>
                    <button id="saveGeneralNotesBtn" onclick="saveGeneralNotes()" style="padding: 6px 16px; background: var(--bar-learned); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.9rem; display: none;">Save</button>
                    <button id="generalNotesInfoBtn" onclick="showGeneralNotesInfoModal()" style="background: var(--surface2); border: 1px solid var(--border-color); color: var(--text-secondary); cursor: pointer; padding: 6px; border-radius: 8px; display: none; align-items: center; justify-content: center; transition: all 0.2s; width: 32px; height: 32px;" title="Help" onmouseover="this.style.background='var(--surface-border)'" onmouseout="this.style.background='var(--surface2)'">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </button>
                    <button class="close-btn" onclick="attemptCloseGeneralNotesModal()">&times;</button>
                </div>
            </div>
            <div class="modal-body" style="flex: 1; overflow: hidden; display: flex; flex-direction: column; padding: 0;">
                <div id="generalNotesView" style="flex: 1; padding: 20px; overflow-y: auto;"></div>
                <div id="generalNotesEdit" style="flex: 1; display: none; flex-direction: column; padding: 20px; overflow: hidden;">
                    <textarea id="generalNotesTextarea" style="flex: 1; width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; font-family: 'Courier New', monospace; font-size: 0.9rem; resize: none; overflow-y: auto;"></textarea>
                </div>
            </div>
        </div>
    `;
    // Render the saved content
    renderGeneralNotes();
}

export function closeGeneralNotesModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('generalNotesModal');
        if (modal) {
            if (modal._resizeObserver) modal._resizeObserver.disconnect();
            modal.remove();
        }
    });
}

export function renderGeneralNotes() {
    const viewDiv = document.getElementById('generalNotesView');
    if (!viewDiv) return;

    if (generalNotes.trim()) {
        const isFullHTML = /<!DOCTYPE|<html/i.test(generalNotes);
        if (isFullHTML) {
            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'width: 100%; height: 100%; border: none; min-height: 400px;';
            iframe.sandbox = 'allow-same-origin allow-scripts';
            viewDiv.innerHTML = '';
            viewDiv.style.padding = '0';
            viewDiv.appendChild(iframe);
            iframe.contentDocument.open();
            iframe.contentDocument.write(generalNotes);
            iframe.contentDocument.close();

            // Stamp theme onto the iframe root and inject CSS vars
            const theme = document.documentElement.getAttribute('data-theme') || 'light';
            iframe.contentDocument.documentElement.setAttribute('data-theme', theme);

            const themeStyle = iframe.contentDocument.createElement('style');
            themeStyle.id = 'sqg-theme-vars';
            themeStyle.textContent = `
                :root {
                    --background: ${getComputedStyle(document.documentElement).getPropertyValue('--background')};
                    --surface:    ${getComputedStyle(document.documentElement).getPropertyValue('--surface')};
                    --text-primary:   ${getComputedStyle(document.documentElement).getPropertyValue('--text-primary')};
                    --text-secondary: ${getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')};
                    --accent:     ${getComputedStyle(document.documentElement).getPropertyValue('--accent')};
                    --border-color: ${getComputedStyle(document.documentElement).getPropertyValue('--border-color')};
                    --surface-border: ${getComputedStyle(document.documentElement).getPropertyValue('--surface-border')};
                }
                body {
                    background: var(--background);
                    color: var(--text-primary);
                }
                a { color: var(--accent); }
            `;
            iframe.contentDocument.head.appendChild(themeStyle);
        } else {
            viewDiv.innerHTML = generalNotes;
        }
    } else {
        viewDiv.innerHTML = '<p style="color: var(--text-muted); font-style: italic; text-align: center;">No notes yet. Click Edit to add your first note!</p>';
    }
}

window.toggleEditGeneralNotes = function() {
    const viewDiv = document.getElementById('generalNotesView');
    const editDiv = document.getElementById('generalNotesEdit');
    const textarea = document.getElementById('generalNotesTextarea');
    const editBtn = document.getElementById('editGeneralNotesBtn');
    const saveBtn = document.getElementById('saveGeneralNotesBtn');
    const infoBtn = document.getElementById('generalNotesInfoBtn');

    // Switch to edit mode
    viewDiv.style.display = 'none';
    editDiv.style.display = 'flex';
    textarea.value = generalNotes;
    window.originalGeneralNotes = generalNotes;
    editBtn.style.display = 'none';
    saveBtn.style.display = 'block';
    if (infoBtn) infoBtn.style.display = 'flex';
}

window.attemptSwitchToViewMode = function() {
    const textarea = document.getElementById('generalNotesTextarea');
    const currentContent = textarea ? textarea.value : '';
    const originalContent = window.originalGeneralNotes || '';

    if (currentContent !== originalContent) {
        showSaveDiscardConfirmation(
            'You have unsaved changes. Do you want to save them?',
            () => {
                saveGeneralNotes();
                switchToViewMode();
            },
            () => {
                window.originalGeneralNotes = null;
                switchToViewMode();
            },
            null
        );
    } else {
        switchToViewMode();
    }
}

export function switchToViewMode() {
    const viewDiv = document.getElementById('generalNotesView');
    const editDiv = document.getElementById('generalNotesEdit');
    const editBtn = document.getElementById('editGeneralNotesBtn');
    const saveBtn = document.getElementById('saveGeneralNotesBtn');
    const infoBtn = document.getElementById('generalNotesInfoBtn');

    viewDiv.style.display = 'block';
    editDiv.style.display = 'none';
    if (editBtn) { editBtn.style.display = 'block'; }
    saveBtn.style.display = 'none';
    if (infoBtn) infoBtn.style.display = 'none';
    renderGeneralNotes();
}

export function saveGeneralNotes() {
    const textarea = document.getElementById('generalNotesTextarea');
    updateAppState({ generalNotes: textarea.value });
    window.originalGeneralNotes = textarea.value;
    saveState();
    switchToViewMode();
    showToast('Notes saved!', 2000, 'success');
}

window.attemptCloseGeneralNotesModal = function () {
    const viewDiv = document.getElementById('generalNotesView');
    if (viewDiv && viewDiv.style.display === 'none') {
        // In edit mode
        const textarea = document.getElementById('generalNotesTextarea');
        const currentContent = textarea ? textarea.value : '';
        const originalContent = window.originalGeneralNotes || '';

        if (currentContent !== originalContent) {
            showSaveDiscardConfirmation(
                'You have unsaved changes. Do you want to save them?',
                () => {
                    saveGeneralNotes();
                    closeGeneralNotesModal();
                },
                () => {
                    window.originalGeneralNotes = null;
                    closeGeneralNotesModal();
                },
                null
            );
        } else {
            closeGeneralNotesModal();
        }
    } else {
        closeGeneralNotesModal();
    }
};

window.showGeneralNotesInfoModal = function () {
    let infoModal = document.getElementById('generalNotesInfoModal');
    if (!infoModal) {
        infoModal = document.createElement('div');
        infoModal.id = 'generalNotesInfoModal';
        infoModal.className = 'training-info-modal';
        infoModal.innerHTML = `
            <div class="training-info-content" style="max-width: 600px;">
                <div class="training-info-header">
                    <span class="training-info-title">General Notes Edit Guild</span>
                    <button class="training-info-close" onclick="closeGeneralNotesInfoModal()">&times;</button>
                </div>
                <div class="training-info-body" style="max-height: 70vh; overflow-y: auto;">
                    <p>This editor supports <strong>HTML, CSS, Javascript &amp; SVG</strong>. If you are not sure what you are doing, Write plain text instead.</p><br>
                    <h3>Here is a quick HTML formatting guide:</h3> <br>
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text"><strong>Bold Text:</strong> <code>&lt;strong&gt;Your text&lt;/strong&gt;</code> or <code>&lt;b&gt;Your text&lt;/b&gt;</code></div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text"><strong>Italic Text:</strong> <code>&lt;em&gt;Your text&lt;/em&gt;</code> or <code>&lt;i&gt;Your text&lt;/i&gt;</code></div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text"><strong>Headings:</strong> <code>&lt;h1&gt;Large Heading&lt;/h1&gt;</code>, <code>&lt;h2&gt;Medium Heading&lt;/h2&gt;</code>, <code>&lt;h3&gt;Small Heading&lt;/h3&gt;</code></div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text"><strong>Paragraphs:</strong> <code>&lt;p&gt;Your paragraph text&lt;/p&gt;</code></div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text"><strong>Line Break:</strong> <code>&lt;br&gt;</code> (no closing tag needed)</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">6</div>
                        <div class="training-info-text"><strong>Links:</strong> <code>&lt;a href="https://example.com"&gt;Link text&lt;/a&gt;</code></div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">7</div>
                        <div class="training-info-text"><strong>Lists:</strong> <code>&lt;ul&gt;&lt;li&gt;Item 1&lt;/li&gt;&lt;li&gt;Item 2&lt;/li&gt;&lt;/ul&gt;</code> for bullet points</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">8</div>
                        <div class="training-info-text"><strong>Colored Text:</strong> <code>&lt;span style="color: red;"&gt;Red text&lt;/span&gt;</code></div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">9</div>
                        <div class="training-info-text"><strong>Horizontal Line:</strong> <code>&lt;hr&gt;</code> (no closing tag needed)</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">10</div>
                        <div class="training-info-text"><strong>Code/Monospace:</strong> <code>&lt;code&gt;monospace text&lt;/code&gt;</code></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }

    pushModalState('generalNotesInfoModal', closeGeneralNotesInfoModal);
    infoModal.classList.add('active');
};

window.closeGeneralNotesInfoModal = function () {
    closeModalWithHistory(() => {
        const modal = document.getElementById('generalNotesInfoModal');
        if (modal) {
            modal.classList.remove('active');
        }
    });
};

// Info button click handlers with fixed positioning - use CAPTURE phase to intercept before parent buttons
document.addEventListener("mousedown", (e) => {
    // Check if clicking on info button or its child
    const infoBtn = e.target.closest(".settings-info-btn");

    if (infoBtn) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    }
}, true); // TRUE = capture phase

document.addEventListener("click", (e) => {
    // If clicking on info button or its child img, handle info display
    const infoBtn = e.target.closest(".settings-info-btn");

    if (infoBtn) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Find the info box - check wrapper structure
        const wrapper = infoBtn.closest('.info-wrapper');
        let infoBox = wrapper ? wrapper.querySelector('.info-box') : infoBtn.nextElementSibling;

        if (!infoBox || !infoBox.classList.contains("info-box")) {
            return false;
        }

        // Check if this specific info box is already showing
        const isAlreadyShowing = infoBox.classList.contains("show");

        // Close all info boxes and restore them first
        document.querySelectorAll(".info-box.show").forEach(box => {
            box.classList.remove("show");

            // Restore to original parent
            if (box.dataset.originalParentId) {
                const originalParent = document.getElementById(box.dataset.originalParentId);
                if (originalParent && box.parentElement !== originalParent) {
                    originalParent.appendChild(box);
                }
            }
        });

        // If it was already showing, we're done (toggle off)
        if (isAlreadyShowing) {
            return false;
        }

        // Store original parent if not already stored
        if (!infoBox.dataset.originalParent) {
            infoBox.dataset.originalParentId = infoBox.parentElement.id || 'wrapper_' + Math.random().toString(36).substr(2, 9);
            if (!infoBox.parentElement.id) {
                infoBox.parentElement.id = infoBox.dataset.originalParentId;
            }
        }

        // Move info box to body for proper fixed positioning
        document.body.appendChild(infoBox);

        infoBox.classList.add("show");

        // Position the info box
        requestAnimationFrame(() => {
            const buttonRect = infoBtn.getBoundingClientRect();
            const infoBoxRect = infoBox.getBoundingClientRect();

            let top = buttonRect.top - infoBoxRect.height - 5;
            let left = buttonRect.right - infoBoxRect.width;

            // Adjust if goes off top of screen
            if (top < 10) {
                top = buttonRect.bottom + 5;
            }

            // Adjust if goes off left of screen
            if (left < 10) {
                left = 10;
            }

            // Adjust if goes off right of screen
            if (left + infoBoxRect.width > window.innerWidth - 10) {
                left = window.innerWidth - infoBoxRect.width - 10;
            }

            // Adjust if goes off bottom of screen
            if (top + infoBoxRect.height > window.innerHeight - 10) {
                top = window.innerHeight - infoBoxRect.height - 10;
            }

            infoBox.style.top = top + 'px';
            infoBox.style.left = left + 'px';
        });

        return false;
    }

    // If clicking on info box itself, don't close it
    if (e.target.classList.contains("info-box") || e.target.closest(".info-box")) {
        e.stopPropagation();
        return;
    }

    // Close all info boxes and restore them to original positions
    document.querySelectorAll(".info-box.show").forEach(box => {
        box.classList.remove("show");

        // Restore to original parent
        if (box.dataset.originalParentId) {
            const originalParent = document.getElementById(box.dataset.originalParentId);
            if (originalParent && box.parentElement !== originalParent) {
                originalParent.appendChild(box);
            }
        }
    });
}, true); // TRUE = capture phase

// Toast notification system
export function showToast(message, duration = 3000, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-notification--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('toast-notification--visible'), 10);

    setTimeout(() => {
        toast.classList.remove('toast-notification--visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

window.showToast = showToast;

// Confirmation modal
window.showConfirmation = function (message, onConfirm, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.cssText = 'z-index: 10001; display: flex; align-items: center; justify-content: center;';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; margin: 0;">
            <div class="modal-header">
                <span class="modal-title">Confirm Action</span>
            </div>
            <div class="modal-body">
                <p style="margin: 0; font-size: 1rem; line-height: 1.6;">${message}</p>
                <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
                    <button id="confirmCancel" class="confirm-btn confirm-btn--neutral">Cancel</button>
                    <button id="confirmOk" class="confirm-btn confirm-btn--primary">OK</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.documentElement.classList.add('scroll-locked');

    document.getElementById('confirmOk').onclick = () => {
        modal.remove();
        document.documentElement.classList.remove('scroll-locked');
        if (onConfirm) onConfirm();
    };

    document.getElementById('confirmCancel').onclick = () => {
        modal.remove();
        document.documentElement.classList.remove('scroll-locked');
        if (onCancel) onCancel();
    };
};

// Three-button confirmation modal (Save/Discard/Cancel)
window.showSaveDiscardConfirmation = function (message, onSave, onDiscard, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.cssText = 'z-index: 10001; display: flex; align-items: center; justify-content: center;';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; margin: 0;">
            <div class="modal-header">
                <span class="modal-title">Unsaved Changes</span>
            </div>
            <div class="modal-body">
                <p style="margin: 0; font-size: 1rem; line-height: 1.6;">${message}</p>
                <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
                    <button id="confirmCancel"  class="confirm-btn confirm-btn--neutral">Cancel</button>
                    <button id="confirmDiscard" class="confirm-btn confirm-btn--neutral">Discard</button>
                    <button id="confirmSave"    class="confirm-btn confirm-btn--neutral">Save</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.documentElement.classList.add('scroll-locked');

    document.getElementById('confirmSave').onclick = () => {
        modal.remove();
        document.documentElement.classList.remove('scroll-locked');
        if (onSave) onSave();
    };

    document.getElementById('confirmDiscard').onclick = () => {
        modal.remove();
        document.documentElement.classList.remove('scroll-locked');
        if (onDiscard) onDiscard();
    };

    document.getElementById('confirmCancel').onclick = () => {
        modal.remove();
        document.documentElement.classList.remove('scroll-locked');
        if (onCancel) onCancel();
    };
};

// Desktop Profile Modal Functions (Popup style - same logic as algorithm popup)
export let activeProfilePopup = null;
export let activeProfilePopupElement = null;

export function showProfilePopup(isPermanent) {
    const profileBtn = document.getElementById('profileBtn');
    const popup = document.getElementById('profileModalDesktop');
    if (!profileBtn || !popup) return;

    // If clicking on already active popup element, close it
    if (isPermanent && activeProfilePopupElement === profileBtn) {
        hideProfilePopup(true);
        return;
    }

    // Close any existing popup if opening a new permanent one
    if (isPermanent && activeProfilePopup) {
        activeProfilePopup.classList.remove('active');
        activeProfilePopup = null;
        activeProfilePopupElement = null;
    }

    // Don't show hover popup if there's already a permanent popup
    if (!isPermanent && activeProfilePopup && activeProfilePopupElement !== profileBtn) {
        return;
    }

    popup.classList.remove('active'); // Reset first
    popup.className = 'profile-popup-desktop' + (isPermanent ? ' permanent' : '');
    popup.classList.add('active');

    // Position the popup
    const rect = profileBtn.getBoundingClientRect();
    const popupContent = popup.querySelector('.profile-popup-content');

    setTimeout(() => {
        const popupRect = popupContent.getBoundingClientRect();

        let top = rect.bottom + 15;
        let left = window.innerWidth - popupRect.width - 20;

        if (top + popupRect.height > window.innerHeight - 10) {
            top = rect.top - popupRect.height - 15;
        }
        if (top < 10) top = 10;
        if (left < 10) left = 10;

        popupContent.style.top = top + 'px';
        popupContent.style.left = left + 'px';
    }, 0);

    updateProfileStats();
    applyProfileUI();

    const scrollHandler = () => {
        hideProfilePopup(isPermanent);
        window.removeEventListener('scroll', scrollHandler, true);
    };
    window.addEventListener('scroll', scrollHandler, true);

    if (isPermanent) {
        activeProfilePopup = popup;
        activeProfilePopupElement = profileBtn;

        setTimeout(() => {
            const clickHandler = (e) => {
                const popupContent = popup.querySelector('.profile-popup-content');
                if (!popupContent.contains(e.target) && e.target !== profileBtn) {
                    hideProfilePopup(true);
                    document.removeEventListener('mousedown', clickHandler);
                }
            };
            document.addEventListener('mousedown', clickHandler);
        }, 100);
    }
}

export function hideProfilePopup(isPermanent) {
    const popup = document.getElementById('profileModalDesktop');
    if (!popup) return;

    if (isPermanent) {
        if (activeProfilePopup) {
            popup.classList.remove('active');
            activeProfilePopup = null;
            activeProfilePopupElement = null;
        }
    } else {
        if (!popup.classList.contains('permanent')) {
            popup.classList.remove('active');
        }
    }
}

// Wrapper functions for compatibility
export function openProfileModalDesktop(isPermanent = false) {
    showProfilePopup(isPermanent);
}

export function closeProfileModalDesktop(isPermanent = false) {
    hideProfilePopup(isPermanent);
}

// Mobile Profile Modal Functions (Full modal style)
export function openProfileModalMobile() {
    const modal = document.getElementById('profileModalMobile');
    if (!modal) return;

    pushModalState('profileModalMobile', closeProfileModalMobile);

    window.modalScrollY = window.scrollY;
    document.body.style.top = `-${window.modalScrollY}px`;
    document.documentElement.classList.add('scroll-locked');
    modal.classList.add('active');

    updateProfileStats();
    applyProfileUI();
}

export function closeProfileModalMobile() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('profileModalMobile');
        if (modal) {
            modal.classList.remove('active');
            document.documentElement.classList.remove('scroll-locked');
        }
    });
}

// Unified function that detects device type
export function openProfileModal() {
    const isMobile = window.innerWidth <= 620;
    if (isMobile) {
        openProfileModalMobile();
    } else {
        openProfileModalDesktop(true); // Open as permanent (clicked)
    }
}

// Make functions globally accessible
window.openProfileModal = openProfileModal;
window.openProfileModalDesktop = openProfileModalDesktop;
window.closeProfileModalDesktop = closeProfileModalDesktop;
window.openProfileModalMobile = openProfileModalMobile;
window.closeProfileModalMobile = closeProfileModalMobile;

export const AVATARS = [
    'res/avatar.svg',
    'res/avatar/1.svg',
    'res/avatar/2.svg',
    'res/avatar/3.svg',
    'res/avatar/4.svg',
    'res/avatar/5.svg',
    'res/avatar/6.svg',
    'res/avatar/7.svg',
    'res/avatar/8.svg',
];

export let tempSelectedAvatar = null;

export function applyProfileUI() {
    // Update floating button
    const btnAvatar = document.getElementById('profileBtnAvatar');
    if (btnAvatar) btnAvatar.src = profileAvatar;
    // Update desktop view
    const deskAvatar = document.getElementById('profileAvatarDesktop');
    if (deskAvatar) deskAvatar.src = profileAvatar;
    const deskName = document.getElementById('profileNameDesktop');
    if (deskName) deskName.textContent = profileName;
    // Update mobile view
    const mobAvatar = document.getElementById('profileAvatarMobile');
    if (mobAvatar) mobAvatar.src = profileAvatar;
    const mobTitle = document.getElementById('profileNameMobileTitle');
    if (mobTitle) mobTitle.textContent = profileName;
}

export function buildAvatarGrid(mode) {
    const grid = document.getElementById(`avatarGrid${mode}`);
    if (!grid) return;
    grid.innerHTML = '';
    AVATARS.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'avatar-option' + ((tempSelectedAvatar || profileAvatar) === src ? ' selected' : '');
        img.onclick = () => {
            tempSelectedAvatar = src;
            grid.querySelectorAll('img').forEach(i => i.classList.remove('selected'));
            img.classList.add('selected');
        };
        grid.appendChild(img);
    });
}

window.switchToEditProfile = function(mode) {
    tempSelectedAvatar = profileAvatar;
    document.getElementById(`profileView${mode}`).style.display = 'none';
    document.getElementById(`profileEdit${mode}`).style.display = 'block';
    const nameInput = document.getElementById(`profileNameInput${mode}`);
    if (nameInput) nameInput.value = profileName === 'Profile' ? '' : profileName;
    buildAvatarGrid(mode);
};

window.switchToViewProfile = function(mode) {
    tempSelectedAvatar = null;
    document.getElementById(`profileEdit${mode}`).style.display = 'none';
    document.getElementById(`profileView${mode}`).style.display = 'block';
};

window.saveProfileEdit = function(mode) {
    const nameInput = document.getElementById(`profileNameInput${mode}`);
    const newName = nameInput ? nameInput.value.trim() : '';
    const nextProfileName = newName || 'Profile';
    const nextProfileAvatar = tempSelectedAvatar || profileAvatar;
    updateAppState({
        profileName: nextProfileName,
        profileAvatar: nextProfileAvatar
    });
    localStorage.setItem('profileName', nextProfileName);
    localStorage.setItem('profileAvatar', nextProfileAvatar);
    tempSelectedAvatar = null;
    applyProfileUI();
    switchToViewProfile(mode);
    showToast('Profile saved!', 2000, 'success');
};

export function updateProfileStats() {
    const totalCases = data.length;
    const learnedCount = data.filter(item => isCaseLearned(item.name)).length;
    const learningCount = data.filter(item => isCaseLearning(item.name)).length;
    const learnedPercent = (learnedCount / totalCases) * 100;
    const learningPercent = (learningCount / totalCases) * 100;

    const totalProbability = data.reduce((sum, item) => sum + item.probability, 0);
    const learnedProbability = data
        .filter(item => isCaseLearned(item.name))
        .reduce((sum, item) => sum + item.probability, 0);

    const coverage = Math.round((learnedProbability / totalProbability) * 100 * 2) / 2;
    const safety = 50 + (coverage / 2);

    // Update both desktop and mobile modals
    const modes = ['Desktop', 'Mobile'];
    modes.forEach(mode => {
        const learningBar = document.getElementById(`profileLearningProgress${mode}`);
        const learnedBar = document.getElementById(`profileLearnedProgress${mode}`);
        const learnedText = document.getElementById(`profileLearnedText${mode}`);
        const coverageProgress = document.getElementById(`profileCoverageProgress${mode}`);
        const coverageText = document.getElementById(`profileCoverageText${mode}`);
        const safetyProgress = document.getElementById(`profileSafetyProgress${mode}`);
        const safetyText = document.getElementById(`profileSafetyText${mode}`);

        if (learningBar) {
            learningBar.style.width = (learnedPercent + learningPercent) + '%';
        }

        if (learnedBar) {
            learnedBar.style.width = learnedPercent + '%';
        }

        if (learnedText) {
            learnedText.textContent = learnedCount + '/' + totalCases;
        }

        if (coverageProgress) {
            coverageProgress.style.width = coverage + '%';
        }

        if (coverageText) {
            coverageText.textContent = coverage.toFixed(1) + '%';
        }

        if (safetyProgress) {
            safetyProgress.style.width = safety + '%';
        }

        if (safetyText) {
            safetyText.textContent = safety.toFixed(1) + '%';
        }
    });
}

// About Modal Functions
window.openAboutModal = function() {
    const modal = document.getElementById('aboutModal');

    window.modalScrollY = window.scrollY;
    document.body.style.top = `-${window.modalScrollY}px`;
    document.documentElement.classList.add('scroll-locked');
    modal.classList.add('active');

    pushModalState('aboutModal', closeAboutModal);
}

export function closeAboutModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('aboutModal');
        modal.classList.remove('active');
        document.documentElement.classList.remove('scroll-locked');
    });
}

// Function to open parity tracing personalization from settings
export function openParityTracingPersonalization() {
    closeSettingsModal();

    // Call the config modal directly via the exported library function
    if (!ParityTracerLibrary || !ParityTracerLibrary.openConfigModal) {
        showToast('Configuration modal not available', 3000, 'error');
        return;
    }

    const config = {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#ffffff',
        hideInstructionButton: hideInstructions,
        instructionText1: 'Enter your scramble in the top input bar and press Analyze to trace parity using Cale\'s method.',
        instructionText2: 'You can change the color scheme from Color Scheme Settings in the main Settings menu.',
        instructionText3: 'Customize the tracing start point from the settings button at the bottom right.',
        tlMainCol: colorScheme.topColor,
        tlColName: getColorName(colorScheme.topColor),
        tlColAbb: getColorName(colorScheme.topColor).charAt(0),
        blMainCol: colorScheme.bottomColor,
        blColName: getColorName(colorScheme.bottomColor),
        blColAbb: getColorName(colorScheme.bottomColor).charAt(0),
        frontCol: colorScheme.frontColor,
        rightCol: colorScheme.rightColor,
        backCol: colorScheme.backColor,
        leftCol: colorScheme.leftColor
    };

    ParityTracerLibrary.openConfigModal(null, config, null, null, null);
}

// Sidebar functions
export function generateSidebarHTML() {
    let sidebar = document.getElementById('appSidebar');
    if (sidebar) return; // Already exists

    sidebar = document.createElement('div');
    sidebar.id = 'appSidebar';
    sidebar.className = 'app-sidebar';
    sidebar.innerHTML = `
        <div class="sidebar-overlay" onclick="closeSidebar()"></div>
        <div class="sidebar-content">
            <div class="sidebar-header">
                <h2 style="margin: 0; font-size: 1.3rem; font-weight: 700; color: var(--text-ui);">Menu</h2>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button class="sidebar-close-btn instruction-btn" onclick="event.stopPropagation(); showHomepageInfoModal();" aria-label="Instructions" style="color: var(--text-secondary);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </button>
                    <button class="sidebar-close-btn" onclick="closeSidebar()" aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="sidebar-body">
                <button class="sidebar-item sidebar-mobile-only" onclick="openProfileModal(); closeSidebar();">
                    <img src="res/avatar.svg" alt="Profile">
                    <span>Profile</span>
                </button>
                <button class="sidebar-item" onclick="closeSidebar(); setTimeout(() => openGeneralNotesModal(), 350);">
                    <img src="res/notes.svg" alt="Notes">
                    <span>General Notes</span>
                </button>
                <button class="sidebar-item" onclick="closeSidebar(); setTimeout(() => openTrainerPickerModal(), 350);">
                    <img src="res/training.svg" alt="Trainer">
                    <span>Trainer</span>
                </button>
                <button class="sidebar-item" onclick="openNewParityAnalysis(null); closeSidebar();">
                    <img src="res/tracing.svg" alt="Parity Tracer">
                    <span>Parity Tracer</span>
                </button>
                <button class="sidebar-item" onclick="closeSidebar(); setTimeout(()=>window.openUnifiedSettings('homescreen'),350);">
                    <img src="res/training-settings.svg" alt="Settings">
                    <span>Settings</span>
                </button>
                <div class="sidebar-divider"></div>
                <div style="padding: 0;">
                    <div id="presetExpandBtn" onclick="togglePresetExpand()" style="padding: 14px 20px; background: transparent; border: none; width: 100%; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: background 0.2s; font-size: 0.95rem; color: var(--text-ui); font-weight: 500;" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background='transparent'">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px; flex-shrink: 0;">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        </svg>
                        <span style="flex: 1; text-align: left;" id="currentPresetName"></span>
                        <svg id="presetExpandIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; transition: transform 0.3s; flex-shrink: 0;">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                    <div id="presetOptions" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease;"></div>
                </div>
                <div class="sidebar-divider"></div>
                <button class="sidebar-item" onclick="exportData(); closeSidebar();">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Export Data</span>
                </button>
                <label class="sidebar-item" style="cursor: pointer;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span>Import Data</span>
                    <input type="file" id="sidebarImportFile" accept=".json" style="display: none;" onchange="handleFileImport(this.files[0]); closeSidebar();">
                </label>
                <button class="sidebar-item" onclick="openAboutModal(); closeSidebar();">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span>About</span>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(sidebar);

    // Populate preset dropdown
    populatePresetDropdown('sidebarPresetSelector');

    // Apply instruction visibility
    applyInstructionVisibility();

    // Initialize preset selector
    initializePresetSelector();
}

export function initializePresetSelector() {
    const currentPresetName = document.getElementById('currentPresetName');
    const presetOptions = document.getElementById('presetOptions');

    if (!currentPresetName || !presetOptions) return;

    currentPresetName.textContent = currentPreset.replace(/_/g, ' ').replace(/'/g, "'");

    presetOptions.innerHTML = '';
    for (const presetName in PRESET_CONFIG) {
        const displayName = presetName.replace(/_/g, ' ').replace(/'/g, "'");
        const isActive = presetName === currentPreset;

        const optionDiv = document.createElement('div');
        optionDiv.className = 'preset-option' + (isActive ? ' active' : '');
        optionDiv.textContent = displayName;

        optionDiv.addEventListener('click', () => handlePresetChange(presetName));
        optionDiv.addEventListener('mouseover', () => {
            if (!isActive) optionDiv.classList.add('preset-option--hover');
        });
        optionDiv.addEventListener('mouseout', () => {
            optionDiv.classList.remove('preset-option--hover');
        });

        presetOptions.appendChild(optionDiv);
    }
}

registerAction('initializePresetSelector', initializePresetSelector);

window.togglePresetExpand = function () {
    const presetOptions = document.getElementById('presetOptions');
    const expandIcon = document.getElementById('presetExpandIcon');

    if (!presetOptions || !expandIcon) return;

    if (presetOptions.style.maxHeight === '0px' || presetOptions.style.maxHeight === '') {
        // Calculate height based on number of presets
        const numPresets = Object.keys(PRESET_CONFIG).length;
        const height = numPresets * 48; // 48px per option
        presetOptions.style.maxHeight = height + 'px';
        expandIcon.style.transform = 'rotate(180deg)';
    } else {
        presetOptions.style.maxHeight = '0px';
        expandIcon.style.transform = 'rotate(0deg)';
    }
};

export function toggleSidebar() {
    generateSidebarHTML();
    const sidebar = document.getElementById('appSidebar');
    if (sidebar) {
        const isOpening = !sidebar.classList.contains('active');

        if (isOpening) {
            // Opening sidebar - lock scroll
            window.sidebarScrollY = window.scrollY;
            document.documentElement.classList.add('scroll-locked');
        }

        sidebar.classList.toggle('active');
    }
}

window.toggleSidebar = toggleSidebar;

window.closeSidebar = function () {
    const sidebar = document.getElementById('appSidebar');
    if (sidebar) {
        sidebar.classList.remove('active');

        // Unlock scroll
        document.documentElement.classList.remove('scroll-locked');

        // Collapse preset dropdown silently while sidebar slides out
        const presetOptions = document.getElementById('presetOptions');
        const expandIcon = document.getElementById('presetExpandIcon');
        if (presetOptions) presetOptions.style.maxHeight = '0px';
        if (expandIcon) expandIcon.style.transform = 'rotate(0deg)';
    }
};

// Quick info popup function
window.showQuickInfo = function (message) {
    const existing = document.getElementById('quickInfoPopup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'quickInfoPopup';
    popup.className = 'quick-info-overlay';
    popup.innerHTML = `
        <div class="quick-info-box">
            <div>${message}</div>
            <button class="quick-info-btn" onclick="document.getElementById('quickInfoPopup').remove()">Got it</button>
        </div>
    `;

    popup.onclick = (e) => { if (e.target === popup) popup.remove(); };

    const escHandler = (e) => {
        if (e.key === 'Escape') {
            popup.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    document.body.appendChild(popup);
};

// Handle outside clicks for all modals
document.addEventListener('click', (e) => {
    // Training info modals
    const infoModals = ['settingsInfoModal', 'homepageInfoModal', 'editCaseInfoModal', 'notesInfoModal', 'generalNotesInfoModal'];
    infoModals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal && modal.classList.contains('active') && e.target === modal) {
            const closeFunc = window[`close${modalId.charAt(0).toUpperCase() + modalId.slice(1).replace('Modal', '')}Modal`];
            if (closeFunc) closeFunc();
        }
    });

    // Notes modal
    const notesModal = document.getElementById('notesModal');
    if (notesModal && notesModal.classList.contains('active') && e.target === notesModal) {
        const caseName = notesModal.querySelector('.modal-title').textContent.replace('Notes: ', '');
        attemptCloseNotesModal(caseName);
    }

    // General notes modal
    const generalNotesModal = document.getElementById('generalNotesModal');
    if (generalNotesModal && generalNotesModal.classList.contains('active') && e.target === generalNotesModal) {
        attemptCloseGeneralNotesModal();
    }
});

// Close info boxes on scroll
window.addEventListener('scroll', () => {
    document.querySelectorAll(".info-box.show").forEach(box => box.classList.remove("show"));
}, true);

// ESM live global compatibility bridge
for (const [name, descriptor] of Object.entries({
    "getColorName": { get: () => getColorName, set: value => { Object.defineProperty(window, "getColorName", { configurable: true, enumerable: true, writable: true, value }); } },
    "generateModalHTML": { get: () => generateModalHTML, set: value => { Object.defineProperty(window, "generateModalHTML", { configurable: true, enumerable: true, writable: true, value }); } },
    "closeSettingsModal": { get: () => closeSettingsModal, set: value => { Object.defineProperty(window, "closeSettingsModal", { configurable: true, enumerable: true, writable: true, value }); } },
    "handlePresetChange": { get: () => handlePresetChange, set: value => { Object.defineProperty(window, "handlePresetChange", { configurable: true, enumerable: true, writable: true, value }); } },
    "applyHintVisibility": { get: () => applyHintVisibility, set: value => { Object.defineProperty(window, "applyHintVisibility", { configurable: true, enumerable: true, writable: true, value }); } },
    "applyInstructionVisibility": { get: () => applyInstructionVisibility, set: value => { Object.defineProperty(window, "applyInstructionVisibility", { configurable: true, enumerable: true, writable: true, value }); } },
    "populatePresetDropdown": { get: () => populatePresetDropdown, set: value => { Object.defineProperty(window, "populatePresetDropdown", { configurable: true, enumerable: true, writable: true, value }); } },
    "closeColorSchemeModal": { get: () => closeColorSchemeModal, set: value => { Object.defineProperty(window, "closeColorSchemeModal", { configurable: true, enumerable: true, writable: true, value }); } },
    "applyAlgorithmFontSize": { get: () => applyAlgorithmFontSize, set: value => { Object.defineProperty(window, "applyAlgorithmFontSize", { configurable: true, enumerable: true, writable: true, value }); } },
    "openNewParityAnalysis": { get: () => openNewParityAnalysis, set: value => { Object.defineProperty(window, "openNewParityAnalysis", { configurable: true, enumerable: true, writable: true, value }); } },
    "closeHomepageInfoModal": { get: () => closeHomepageInfoModal, set: value => { Object.defineProperty(window, "closeHomepageInfoModal", { configurable: true, enumerable: true, writable: true, value }); } },
    "openEditCaseModal": { get: () => openEditCaseModal, set: value => { Object.defineProperty(window, "openEditCaseModal", { configurable: true, enumerable: true, writable: true, value }); } },
    "getModalCaseShapeData": { get: () => getModalCaseShapeData, set: value => { Object.defineProperty(window, "getModalCaseShapeData", { configurable: true, enumerable: true, writable: true, value }); } },
    "updateInputColor": { get: () => updateInputColor, set: value => { Object.defineProperty(window, "updateInputColor", { configurable: true, enumerable: true, writable: true, value }); } },
    "_getEditModalCaseName": { get: () => _getEditModalCaseName, set: value => { Object.defineProperty(window, "_getEditModalCaseName", { configurable: true, enumerable: true, writable: true, value }); } },
    "closeEditCaseModal": { get: () => closeEditCaseModal, set: value => { Object.defineProperty(window, "closeEditCaseModal", { configurable: true, enumerable: true, writable: true, value }); } },
    "saveEditedCase": { get: () => saveEditedCase, set: value => { Object.defineProperty(window, "saveEditedCase", { configurable: true, enumerable: true, writable: true, value }); } },
    "openCustomizeSVGsModal": { get: () => openCustomizeSVGsModal, set: value => { Object.defineProperty(window, "openCustomizeSVGsModal", { configurable: true, enumerable: true, writable: true, value }); } },
    "openNotesModal": { get: () => openNotesModal, set: value => { Object.defineProperty(window, "openNotesModal", { configurable: true, enumerable: true, writable: true, value }); } },
    "closeNotesModal": { get: () => closeNotesModal, set: value => { Object.defineProperty(window, "closeNotesModal", { configurable: true, enumerable: true, writable: true, value }); } },
    "saveNotes": { get: () => saveNotes, set: value => { Object.defineProperty(window, "saveNotes", { configurable: true, enumerable: true, writable: true, value }); } },
    "closeGeneralNotesModal": { get: () => closeGeneralNotesModal, set: value => { Object.defineProperty(window, "closeGeneralNotesModal", { configurable: true, enumerable: true, writable: true, value }); } },
    "renderGeneralNotes": { get: () => renderGeneralNotes, set: value => { Object.defineProperty(window, "renderGeneralNotes", { configurable: true, enumerable: true, writable: true, value }); } },
    "switchToViewMode": { get: () => switchToViewMode, set: value => { Object.defineProperty(window, "switchToViewMode", { configurable: true, enumerable: true, writable: true, value }); } },
    "saveGeneralNotes": { get: () => saveGeneralNotes, set: value => { Object.defineProperty(window, "saveGeneralNotes", { configurable: true, enumerable: true, writable: true, value }); } },
    "activeProfilePopup": { get: () => activeProfilePopup, set: value => { activeProfilePopup = value; } },
    "activeProfilePopupElement": { get: () => activeProfilePopupElement, set: value => { activeProfilePopupElement = value; } },
    "showProfilePopup": { get: () => showProfilePopup, set: value => { Object.defineProperty(window, "showProfilePopup", { configurable: true, enumerable: true, writable: true, value }); } },
    "hideProfilePopup": { get: () => hideProfilePopup, set: value => { Object.defineProperty(window, "hideProfilePopup", { configurable: true, enumerable: true, writable: true, value }); } },
    "openProfileModalDesktop": { get: () => openProfileModalDesktop, set: value => { Object.defineProperty(window, "openProfileModalDesktop", { configurable: true, enumerable: true, writable: true, value }); } },
    "closeProfileModalDesktop": { get: () => closeProfileModalDesktop, set: value => { Object.defineProperty(window, "closeProfileModalDesktop", { configurable: true, enumerable: true, writable: true, value }); } },
    "openProfileModalMobile": { get: () => openProfileModalMobile, set: value => { Object.defineProperty(window, "openProfileModalMobile", { configurable: true, enumerable: true, writable: true, value }); } },
    "closeProfileModalMobile": { get: () => closeProfileModalMobile, set: value => { Object.defineProperty(window, "closeProfileModalMobile", { configurable: true, enumerable: true, writable: true, value }); } },
    "openProfileModal": { get: () => openProfileModal, set: value => { Object.defineProperty(window, "openProfileModal", { configurable: true, enumerable: true, writable: true, value }); } },
    "AVATARS": { get: () => AVATARS, set: value => { Object.defineProperty(window, "AVATARS", { configurable: true, enumerable: true, writable: true, value }); } },
    "tempSelectedAvatar": { get: () => tempSelectedAvatar, set: value => { tempSelectedAvatar = value; } },
    "applyProfileUI": { get: () => applyProfileUI, set: value => { Object.defineProperty(window, "applyProfileUI", { configurable: true, enumerable: true, writable: true, value }); } },
    "buildAvatarGrid": { get: () => buildAvatarGrid, set: value => { Object.defineProperty(window, "buildAvatarGrid", { configurable: true, enumerable: true, writable: true, value }); } },
    "updateProfileStats": { get: () => updateProfileStats, set: value => { Object.defineProperty(window, "updateProfileStats", { configurable: true, enumerable: true, writable: true, value }); } },
    "closeAboutModal": { get: () => closeAboutModal, set: value => { Object.defineProperty(window, "closeAboutModal", { configurable: true, enumerable: true, writable: true, value }); } },
    "openParityTracingPersonalization": { get: () => openParityTracingPersonalization, set: value => { Object.defineProperty(window, "openParityTracingPersonalization", { configurable: true, enumerable: true, writable: true, value }); } },
    "generateSidebarHTML": { get: () => generateSidebarHTML, set: value => { Object.defineProperty(window, "generateSidebarHTML", { configurable: true, enumerable: true, writable: true, value }); } },
    "initializePresetSelector": { get: () => initializePresetSelector, set: value => { Object.defineProperty(window, "initializePresetSelector", { configurable: true, enumerable: true, writable: true, value }); } },
})) {
    Object.defineProperty(window, name, {
        configurable: true,
        enumerable: true,
        get: descriptor.get,
        set: descriptor.set
    });
}

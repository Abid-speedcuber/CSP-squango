/*
╔═══════════════════════════════════════════════════════════════════════════╗
║                          DYNAMIC MODAL GENERATION                         ║
╚═══════════════════════════════════════════════════════════════════════════╝
*/

// Helper function for color names
function getColorName(hexColor) {
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
function generateModalHTML() {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'dynamicModals';

    modalContainer.innerHTML = `
        <div id="settingsModal" class="modal">
            <div class="modal-content" style="max-width: 480px; max-height: 80vh; min-height: 20vh; display: flex; flex-direction: column; border-radius: 16px; overflow: hidden; background: var(--surface);">
                <div class="modal-header" style="flex-shrink: 0; background: var(--surface); color: var(--text-ui); padding: 24px 28px; border-bottom: 2px solid var(--surface-border);">
                    <span class="modal-title" style="font-size: 1.5rem; font-weight: 700; color: var(--text-ui);">Personalization</span>
                    <button class="close-btn" onclick="closeSettingsModal()" style="color: var(--sidebar-close-color); opacity: 1;">&times;</button>
                </div>
                <div class="modal-body" style="overflow-y: auto; flex: 1; padding: 24px 28px; background: var(--surface);">

                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <label for="hintToggle" style="color: var(--text-secondary); font-weight: 500; font-size: 0.95rem;">Show Tracing Guides</label>
                                <span class="info-wrapper">
                                    <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                                    <span class="info-box">Show/hide the blue and red numbers in the case images. An edge labeled with 1, for example, means it's the first to be traced. (these do not update if you change your tracing positions, you'll have to go to Set Tracing Positions)<br><br><strong>Keyboard shortcut:</strong> Alt+T</span>
                                </span>
                            </div>
                            <input type="checkbox" id="hintToggle" onchange="toggleHints(this.checked)" style="transform: scale(1.3); cursor: pointer;">
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <label for="hideInstructionsToggle" style="color: var(--text-secondary); font-weight: 500; font-size: 0.95rem;">Hide Instruction Buttons</label>
                                <span class="info-wrapper">
                                    <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                                    <span class="info-box">Hide instruction buttons across the app. But why would you do that.<br><br><strong>Keyboard shortcut:</strong> Alt+H</span>
                                </span>
                            </div>
                            <input type="checkbox" id="hideInstructionsToggle" onchange="toggleHideInstructions(this.checked)" style="transform: scale(1.3); cursor: pointer;">
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <label for="hideParenthesisToggle" style="color: var(--text-secondary); font-weight: 500; font-size: 0.95rem;">Hide Parentheses</label>
                                <span class="info-wrapper">
                                    <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                                    <span class="info-box">Removes parentheses and changes the font from monospace to Arial for a more modern alg display.<br><br><strong>Keyboard shortcut:</strong> Alt+P</span>
                                </span>
                            </div>
                            <input type="checkbox" id="hideParenthesisToggle" onchange="toggleHideParenthesis(this.checked)" style="transform: scale(1.3); cursor: pointer;">
                        </div>

                        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--surface-border);">
                            <label style="display: block; font-weight: 500; margin-bottom: 8px; color: var(--text-secondary); font-size: 0.95rem;">Alg Font Size: <span id="algFontSizeValue">14</span>px</label>
                            <input type="range" id="algFontSizeSlider" min="10" max="20" step="1" value="14" style="width: 100%; cursor: pointer;" oninput="updateAlgFontSizePreview(this.value)">
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">
                                <span>Small (10px)</span>
                                <span>Large (20px)</span>
                            </div>
                        </div>

                        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--surface-border);">
                            <div onclick="if(event.target === this || event.target.closest('span:not(.info-wrapper)')) openColorSchemeModal()" class="settings-action-btn" style="padding: 12px 20px; border-radius: 10px; cursor: pointer; width: 100%; margin-bottom: 10px; font-weight: 600; font-size: 0.95rem; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; display: flex; align-items: center; justify-content: space-between;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.1)'; this.style.borderColor='var(--border-color)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'; this.style.borderColor='var(--border-color)'">
                                <span>Color Scheme Settings</span>
                                <span class="info-wrapper">
                                    <button class="settings-info-btn" aria-label="More info" onclick="event.stopPropagation();"><img src="res/info.svg"></button>
                                    <span class="info-box">Changes the color scheme of your squan. Impacts parity tracing and draw scramble.</span>
                                </span>
                            </div>
                            <div onclick="if(event.target === this || event.target.closest('span:not(.info-wrapper)')) openParityTracingPersonalization()" class="settings-action-btn" style="padding: 12px 20px; border-radius: 10px; cursor: pointer; width: 100%; margin-bottom: 10px; font-weight: 600; font-size: 0.95rem; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; display: flex; align-items: center; justify-content: space-between;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.1)'; this.style.borderColor='var(--border-color)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'; this.style.borderColor='var(--border-color)'">
                                <span>Set Tracing Positions</span>
                                <span class="info-wrapper">
                                    <button class="settings-info-btn" aria-label="More info" onclick="event.stopPropagation();"><img src="res/info.svg"></button>
                                    <span class="info-box">Change your tracing positions here. They will be used to calculate whether an alg is odd or even for a given case.<br><br><strong>Keyboard shortcut:</strong> Alt+W</span>
                                </span>
                            </div>
                            <div onclick="if(event.target === this || event.target.closest('span:not(.info-wrapper)')) openQuickEditModal()" class="settings-action-btn" style="padding: 12px 20px; border-radius: 10px; cursor: pointer; width: 100%; margin-bottom: 10px; font-weight: 600; font-size: 0.95rem; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; display: flex; align-items: center; justify-content: space-between;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.1)'; this.style.borderColor='var(--border-color)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'; this.style.borderColor='var(--border-color)'">
                                <span>Quick Edit</span>
                                <span class="info-wrapper">
                                    <button class="settings-info-btn" aria-label="More info" onclick="event.stopPropagation();"><img src="res/info.svg"></button>
                                    <span class="info-box">A place for preset creators to bulk edit cases.<br><br><strong>Keyboard shortcut:</strong> Alt+Q</span>
                                </span>
                            </div>
                            <div onclick="if(event.target === this || event.target.closest('span:not(.info-wrapper)')) openCustomizeSVGsModal()" class="settings-action-btn" style="padding: 12px 20px; border-radius: 10px; cursor: pointer; width: 100%; margin-bottom: 10px; font-weight: 600; font-size: 0.95rem; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; display: flex; align-items: center; justify-content: space-between;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.1)'; this.style.borderColor='var(--border-color)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'; this.style.borderColor='var(--border-color)'">
                                <span>Customize Tracing Guides</span>
                                <span class="info-wrapper">
                                    <button class="settings-info-btn" aria-label="More info" onclick="event.stopPropagation();"><img src="res/info.svg"></button>
                                    <span class="info-box">Lets you move the little numbers around to set your tracing guide for each image .<br><br><strong>Keyboard shortcut:</strong> Alt+G</span>
                                </span>
                            </div>

                            <hr style="border: none; border-top: 1px solid var(--surface-border); margin: 12px 0;">

                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <label for="enhancedAccessToggle" style="color: var(--text-secondary); font-weight: 500; font-size: 0.95rem;">Enable Enhanced Access</label>
                                    <span class="info-wrapper">
                                        <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                                        <span class="info-box">This lets you change the algs of a case in Edit Case and Quick Edit.</span>
                                    </span>
                                </div>
                                <input type="checkbox" id="enhancedAccessToggle" onchange="toggleEnhancedAccess(this.checked)" style="transform: scale(1.3); cursor: pointer;">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="colorSchemeModal" class="modal">
            <div class="modal-content" style="max-width: 500px; max-height: 80vh; min-height: 20vh;">
                <div class="modal-header">
                    <span class="modal-title">Color Scheme Settings</span>
                    <button class="close-btn" onclick="closeColorSchemeModal()">&times;</button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">Top Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="top" data-color="#FFFF00" style="background: #FFFF00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Yellow</button>
                            <button class="color-btn" data-face="top" data-color="#000000" style="background: #000000; color: white; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Black</button>
                            <button class="color-btn" data-face="top" data-color="#FFFFFF" style="background: #FFFFFF; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">White</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">Bottom Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="bottom" data-color="#FFFF00" style="background: #FFFF00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Yellow</button>
                            <button class="color-btn" data-face="bottom" data-color="#000000" style="background: #000000; color: white; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Black</button>
                            <button class="color-btn" data-face="bottom" data-color="#FFFFFF" style="background: #FFFFFF; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">White</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">Front Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="front" data-color="#CC0000" style="background: #CC0000; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Red</button>
                            <button class="color-btn" data-face="front" data-color="#00AA00" style="background: #00AA00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Green</button>
                            <button class="color-btn" data-face="front" data-color="#0066CC" style="background: #0066CC; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Blue</button>
                            <button class="color-btn" data-face="front" data-color="#FF8C00" style="background: #FF8C00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Orange</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">Right Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="right" data-color="#CC0000" style="background: #CC0000; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Red</button>
                            <button class="color-btn" data-face="right" data-color="#00AA00" style="background: #00AA00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Green</button>
                            <button class="color-btn" data-face="right" data-color="#0066CC" style="background: #0066CC; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Blue</button>
                            <button class="color-btn" data-face="right" data-color="#FF8C00" style="background: #FF8C00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Orange</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">Back Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="back" data-color="#CC0000" style="background: #CC0000; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Red</button>
                            <button class="color-btn" data-face="back" data-color="#00AA00" style="background: #00AA00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Green</button>
                            <button class="color-btn" data-face="back" data-color="#0066CC" style="background: #0066CC; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Blue</button>
                            <button class="color-btn" data-face="back" data-color="#FF8C00" style="background: #FF8C00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Orange</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">Left Color:</label>
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
          Additional credit to <strong>Matt Mao</strong> — the inventor of Matt Tracing for OBLP —
          for helping me out in various way in this project. Matt's preset is built solemnly by him, and he helped me refine the site further.
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

        <a href="https://github.com/Abid-speedcuber/sq1-csparity-algs"
           target="_blank"
           style="font-size: 0.95rem; font-weight: 500; color: var(--about-link-color); text-decoration: none;">
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
        btn.addEventListener('click', function () {
            const face = this.getAttribute('data-face');
            const color = this.getAttribute('data-color');

            colorScheme[face + 'Color'] = color;

            const sameFaceButtons = document.querySelectorAll(`.color-btn[data-face="${face}"]`);
            sameFaceButtons.forEach(b => {
                b.classList.toggle('selected', b === this);
            });

            // Auto-save
            saveState();

            // Recalculate parity if needed
            if (needsParityRecalculation()) {
                calculateAndCacheAllParity();
                render();
            }
        });
    });
}

// Render loading screen
function showRenderLoader() {
    let loader = document.getElementById('renderLoader');
    if (loader) return;
    loader = document.createElement('div');
    loader.id = 'renderLoader';
    loader.className = 'render-loader';
    loader.innerHTML = `
        <h1 class="render-loader__title">SquanGo CSP</h1>
        <p class="render-loader__subtitle">by Abid Ibn Ashraf</p>
        <div class="render-loader__bar-wrap">
            <div id="renderLoaderBar" class="render-loader__bar"></div>
        </div>
    `;
    document.body.appendChild(loader);
    let p = 0;
    loader._interval = setInterval(() => {
        p += Math.random() * 25;
        if (p > 85) p = 85;
        const bar = document.getElementById('renderLoaderBar');
        if (bar) bar.style.width = p + '%';
    }, 120);
}

function hideRenderLoader() {
    const loader = document.getElementById('renderLoader');
    if (!loader) return;
    clearInterval(loader._interval);
    const bar = document.getElementById('renderLoaderBar');
    if (bar) bar.style.width = '100%';
    setTimeout(() => {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.25s ease';
        setTimeout(() => loader.remove(), 260);
    }, 150);
}

function toggleCaseSwapLR(name) {
    const currentSwap = perCaseSwapLR.get(name) || false;
    perCaseSwapLR.set(name, !currentSwap);
    saveState();
    closeModal();
    openModal(name);
}

function saveModalData(name) {
    const commentBox = document.getElementById('commentBox');
    if (commentBox) {
        const commentText = commentBox.value.trim();
        if (commentText) {
            comments.set(name, commentText);
        } else {
            comments.delete(name);
        }
    }

    saveState();
    render();
    closeModal();
}


/*
╔════════════════════════════════════════════════════════════════════════════╗
║                               SETTINGS MODAL                               ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

function openSettingsModal() {
    window.openUnifiedSettings('homescreen');
}

function closeSettingsModal() {
    _closeSettingsModal();
}

function handlePresetChange(presetName) {
    const isSamePreset = presetName === currentPreset;

    if (isSamePreset) {
        const reloadModal = document.createElement('div');
        reloadModal.className = 'modal active';
        reloadModal.style.zIndex = '10002';
        reloadModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header" style="background: var(--surface); border-bottom: 2px solid var(--border-color);">
                    <span class="modal-title">Reload ${presetName.replace(/_/g, ' ')}?</span>
                    <button class="close-btn" onclick="this.closest('.modal').remove();">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="margin: 0 0 10px 0; font-size: 1rem; line-height: 1.6; color: var(--text-primary);">
                        Reloading will <strong>keep</strong> your learning progress (learned/learning/planned states) and personal preferences (font size, hints, etc.).<br><br>
                        It will <strong>replace</strong> your algs, color scheme, tracing guides, case display names, subtitles, and notes with what's in the newest version of this preset.
                    </p>
                    <p style="font-weight: 500;">
                        We recommend exporting your data before reloading.
                    </p> <br>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="exportData(); showToast('Data exported! You can now safely reload.', 3000, 'success');" style="padding: 10px 20px; background: var(--btn-safe); color: var(--text-primary); border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Export First</button>
                        <button onclick="this.closest('.modal').remove(); document.documentElement.classList.remove('scroll-locked'); closeSidebar(); applyPreset(\`${presetName}\`, false, false).then(() => { if(typeof initializePresetSelector === 'function') initializePresetSelector(); });" style="padding: 10px 20px; background: var(--btn-danger-soft); color: black; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Reload Anyway</button>
                        <button onclick="this.closest('.modal').remove();" style="padding: 10px 20px; background: var(--delete-btn-bg); color: var(--text-primary); border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(reloadModal);
        return;
    }

    // Validate preset exists in config
    if (typeof window.PRESET_CONFIG === 'undefined' || !window.PRESET_CONFIG[presetName]) {
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
                <button class="close-btn" onclick="this.closest('.modal').remove(); document.getElementById('presetSelector').value = \`${currentPreset}\`;">&times;</button>
            </div>
            <div class="modal-body">
                <p style="margin: 0 0 15px 0; font-size: 1rem; line-height: 1.6; color: var(--text-primary);">
                    Switching to "<strong>${presetName.replaceAll("_", " ")}</strong>" will <strong>keep</strong> your learning progress (learned/learning/planned states) and personal preferences (font size, hints, etc.).<br><br>
                    It will <strong>replace</strong> your algs, color scheme, tracing guides, case display names, subtitles, and notes with what's in the preset.
                </p>
                <p style="font-weight: 500;">
                    We recommend exporting your data before reloading.
                </p> <br>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="exportData(); showToast('Data exported! You can now safely switch presets.', 3000, 'success');" style="padding: 10px 20px; background: var(--btn-safe); color: var(--text-primary); border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem;">
                        Export Data First
                    </button>
                    <button onclick="this.closest('.modal').remove(); document.documentElement.classList.remove('scroll-locked'); closeSidebar(); applyPreset(\`${presetName}\`, false, false).then(() => { if(typeof initializePresetSelector === 'function') initializePresetSelector(); setTimeout(() => openGeneralNotesModal(), 800); });" style="padding: 10px 20px; background: var(--btn-danger-soft); color: var(--text-primary); border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem;">
                        Switch Anyway
                    </button>
                    <button onclick="this.closest('.modal').remove(); document.documentElement.classList.remove('scroll-locked'); document.getElementById('presetSelector').value = \`${currentPreset}\`;" style="padding: 10px 20px; background: var(--delete-btn-bg); color: var(--text-primary); border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem;">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(warningModal);
    document.documentElement.classList.add('scroll-locked');
}

function toggleHints(isChecked) {
    showHints = isChecked;
    localStorage.setItem('showHints', showHints);
    applyHintVisibility();
}

function applyHintVisibility() {
    if (showHints) {
        document.body.classList.remove('hide-hints');
    } else {
        document.body.classList.add('hide-hints');
    }
}

function toggleShowPaths(isChecked) {
    // Shape paths always shown now
    return;
}

function toggleHideInstructions(isChecked) {
    hideInstructions = isChecked;
    saveState();
    applyInstructionVisibility();
}

function applyInstructionVisibility() {
    const instructionBtns = document.querySelectorAll('.settings-info-btn, .homepage-info-btn, .training-info-btn, .case-detail-info-btn, .instruction-btn');
    instructionBtns.forEach(btn => {
        btn.style.display = hideInstructions ? 'none' : 'flex';
    });
}

function togglePriorityLearning(isChecked) {
    // Priority learning is always enabled now
    return;
}

function toggleHideParenthesis(isChecked) {
    hideParenthesis = isChecked;
    saveState();
    render();
}

function toggleEnhancedAccess(isChecked) {
    window.enhancedAccess = isChecked;
    localStorage.setItem('enhancedAccess', isChecked.toString());
}

// Populate preset dropdown dynamically
function populatePresetDropdown(selectorId = 'presetSelector') {
    const presetSelector = document.getElementById(selectorId);
    if (!presetSelector || typeof window.PRESET_CONFIG === 'undefined') return;

    presetSelector.innerHTML = '';

    for (const presetName in window.PRESET_CONFIG) {
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
function openColorSchemeModal() {
    const modal = document.getElementById('colorSchemeModal');

    window.modalScrollY = window.scrollY;
    document.body.style.top = `-${window.modalScrollY}px`;
    document.documentElement.classList.add('scroll-locked');
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

function closeColorSchemeModal() {
    const modal = document.getElementById('colorSchemeModal');
    modal.classList.remove('active');
    document.documentElement.classList.remove('scroll-locked');
}

function updateImageSizePreview(value) {
    document.getElementById('sizeValue').textContent = value;
    scrambleImageSize = parseInt(value);
    saveState();
}

function updateAlgFontSizePreview(value) {
    document.getElementById('algFontSizeValue').textContent = value;
    algorithmFontSize = parseInt(value);
    localStorage.setItem('algorithmFontSize', value);
    applyAlgorithmFontSize();
}

function applyAlgorithmFontSize() {
    const style = document.getElementById('algorithm-font-size-style') || document.createElement('style');
    style.id = 'algorithm-font-size-style';
    style.textContent = `
        .algo-line, .algo-interactive {
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
function openNewParityAnalysis(scramble) {
    if (typeof window.ParityTracerLibrary === 'undefined') {
        showToast('Parity Tracer library not loaded', 3000, 'error');
        return;
    }

    window.ParityTracerLibrary.createModal({
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
function showHomepageInfoModal() {
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
                        <div class="training-info-text">Sort <strong>By Priority</strong> instead of by Highest Probability to organize cases by learning priority (1-7). Adjust priorities via the three dots menu.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text"><strong>Hover</strong> over any alg to see its setup and shape path. <strong>Click on the alg</strong> to keep the popup open. Then, you can click the setup to <b>analyze the parity</b> of the alg, or click on the shape path to <b>animate</b> the alg.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text">Use <strong>Color Scheme Settings</strong> to change the color scheme of your squan. Impacts parity tracing and draw scramble.</div>
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

function closeHomepageInfoModal() {
    const modal = document.getElementById('homepageInfoModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function openEditCaseModal(caseName) {
    const item = data.find(d => d.name === caseName);
    if (!item) return;

    const customAlgs = customAlgorithms.get(caseName);
    const allAlgs = [];
    if (customAlgs) {
        allAlgs.push(...(customAlgs.odd || []), ...(customAlgs.even || []));
    } else {
        allAlgs.push(...(item.odd || []), ...(item.even || []));
    }

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
                                <input type="text" class="alg-input" value="${alg}" data-original="${alg}" style="flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; font-family: monospace; font-size: 0.9rem;">
                                <span class="parity-label" style="min-width: 40px; font-size: 0.8rem; color: var(--text-secondary); font-style: italic;"></span>
                                <button onclick="this.parentElement.remove()" style="padding: 6px; background: var(--delete-btn-bg); color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
                                    <img src="res/delete.svg" style="width: 16px; height: 16px;" alt="Delete">
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <button id="addAlgorithmBtn" onclick="addNewAlgorithmField()" style="margin-top: 10px; padding: 8px 16px; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">+ Add Algorithm</button>
                </div>

                <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--surface-border);">
                    <button onclick="saveEditedCase('${caseName.replace(/'/g, "\\'")}', '${item.name.replace(/'/g, "\\'")}')" style="padding: 10px 20px; background: var(--bar-learned); color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: 600;">Save Changes</button>
                    <button onclick="closeEditCaseModal()" style="padding: 10px 20px; background: var(--delete-btn-bg); color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    window.modalScrollY = window.scrollY;
    document.body.style.top = `-${window.modalScrollY}px`;
    document.documentElement.classList.add('scroll-locked');

    // Apply enhanced access restrictions
    if (!window.enhancedAccess) {
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
            // Initial update
            if (document.activeElement !== input) {
                updateParityLabel(input);
            }

            input.addEventListener('focus', () => {
                const parityLabel = input.parentElement.querySelector('.parity-label');
                if (parityLabel) parityLabel.textContent = '';
            });

            input.addEventListener('blur', () => {
                const rawText = input.value.trim();
                if (rawText && rawText !== 'Done!') {
                    const normalized = window.ScrambleNormalizer.normalizeScramble(rawText);
                    input.value = normalized;
                }
                updateParityLabel(input);
            });

            input.addEventListener('input', () => {
                if (input.parityTimeout) {
                    clearTimeout(input.parityTimeout);
                }
                input.parityTimeout = setTimeout(() => {
                    if (document.activeElement !== input) {
                        updateParityLabel(input);
                    }
                }, 300);
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text/plain');
                const start = input.selectionStart;
                const end = input.selectionEnd;
                const currentValue = input.value;
                input.value = currentValue.substring(0, start) + text + currentValue.substring(end);
                input.selectionStart = input.selectionEnd = start + text.length;
            });
        });
    }, 200);
}

function getModalCaseShapeData(caseName) {
    const canonicalIdx = parseInt(shapeIndexMap[caseName]);
    if (isNaN(canonicalIdx)) return null;
    for (const shapeData of shapeIndex) {
        if (shapeData.org && shapeData.org.includes(canonicalIdx)) return shapeData;
    }
    return null;
}

const MODAL_LEGAL_TOPS = [0,1,2,3,4,5,-1,-2,-3,-4,-5,-6];
const MODAL_LEGAL_BOTTOMS = [0,1,2,3,4,5,-1,-2,-3,-4,-5,-6];

function modalTryFixAngle(algBody, canonicalShapeIdx) {
    for (const t of MODAL_LEGAL_TOPS) {
        for (const b of MODAL_LEGAL_BOTTOMS) {
            const candidate = `(${t},${b})` + algBody;
            try {
                const result = window.algToShapeIndex(candidate);
                if (result.shapeIndex === canonicalShapeIdx) return candidate;
            } catch(e) {}
        }
    }
    return null;
}

function modalTryFixMirroredAngle(algBody, canonicalShapeIdx) {
    for (const t of MODAL_LEGAL_TOPS) {
        for (const b of MODAL_LEGAL_BOTTOMS) {
            const candidate = `/(6,6)/(${t},${b})` + algBody;
            try {
                const result = window.algToShapeIndex(candidate);
                if (result.shapeIndex === canonicalShapeIdx) return `(${t},${b})` + algBody;
            } catch(e) {}
        }
    }
    return null;
}

function modalStripBeforeFirstSlash(alg) {
    const firstSlash = alg.indexOf('/');
    if (firstSlash <= 0) return alg;
    return alg.slice(firstSlash);
}

// Helper function to update parity label
function updateParityLabel(input) {
    const parityLabel = input.parentElement.querySelector('.parity-label');
    if (!parityLabel) return;

    let alg = input.value.trim();
    if (!alg || alg === 'Done!') {
        parityLabel.textContent = '';
        parityLabel.style.color = '';
        parityLabel.style.fontWeight = '';
        return;
    }

    if (typeof window.algToShapeIndex === 'undefined' ||
        typeof window.Square1ParityAnalyzerLibraryWithSillyNames === 'undefined') {
        parityLabel.textContent = '';
        parityLabel.style.color = '';
        parityLabel.style.fontWeight = '';
        return;
    }

    try {
        // Get the case name from the modal title
        const modal = document.getElementById('editCaseModal');
        if (!modal) return;
        const titleElement = modal.querySelector('.modal-title');
        if (!titleElement) return;

        // Find the actual caseName key
        let caseName = null;
        for (const dataItem of data) {
            if (getDisplayName(dataItem.name) === titleElement.textContent || dataItem.name === titleElement.textContent) {
                caseName = dataItem.name;
                break;
            }
        }

        const canonicalIdxStr = caseName ? shapeIndexMap[caseName] : null;
        const canonicalIdx = canonicalIdxStr !== undefined ? parseInt(canonicalIdxStr) : null;
        const caseShapeData = caseName ? getModalCaseShapeData(caseName) : null;

        let result
        try {
            result = window.algToShapeIndex(alg);
        } catch (error) {
            // try again with double misalign end
            result = window.algToShapeIndex(alg + "(-1,1)");
            alg += "(-1,1)";
        }
        const resultShapeIndex = result.shapeIndex;

        const isDirectMatch = canonicalIdx !== null && resultShapeIndex === canonicalIdx;
        const isInOrg = caseShapeData && caseShapeData.org && caseShapeData.org.includes(resultShapeIndex);
        const isInMir = caseShapeData && caseShapeData.mir && caseShapeData.mir.includes(resultShapeIndex);

        if (isDirectMatch || isInOrg) {
            const setup = invertScramble(alg);
            const parityText = window.Square1ParityAnalyzerLibraryWithSillyNames.getParityTextFromScramblePlease(setup, {
                topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor, leftColor: colorScheme.leftColor
            }, cornerStickerMode);

            if (isInOrg && !isDirectMatch && canonicalIdx !== null) {
                // Auto-fix angle on blur
                const algBody = modalStripBeforeFirstSlash(alg);
                const fixed = modalTryFixAngle(algBody, canonicalIdx);
                if (fixed) {
                    input.value = window.ScrambleNormalizer.normalizeScramble(fixed);
                }
            }

            parityLabel.textContent = parityText.toLowerCase();
            parityLabel.style.color = parityText === 'Odd' ? 'var(--parity-odd)' : 'var(--parity-even)';
            parityLabel.style.fontWeight = '600';

        } else if (isInMir) {
            const setup = invertScramble(alg);
            const parityText = window.Square1ParityAnalyzerLibraryWithSillyNames.getParityTextFromScramblePlease(setup, {
                topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor, leftColor: colorScheme.leftColor
            }, cornerStickerMode);

            if (canonicalIdx !== null) {
                const algBody = modalStripBeforeFirstSlash(alg);
                const fixed = modalTryFixMirroredAngle(algBody, canonicalIdx);
                if (fixed) {
                    input.value = window.ScrambleNormalizer.normalizeScramble(fixed);
                }
            }

            parityLabel.textContent = parityText.toLowerCase() + ' (z2)';
            parityLabel.style.color = parityText === 'Odd' ? 'var(--parity-odd-mirror)' : 'var(--parity-even-mirror)';
            parityLabel.style.fontWeight = '600';

        } else {
            parityLabel.textContent = 'invalid';
            parityLabel.style.color = 'var(--parity-invalid)';
            parityLabel.style.fontWeight = '600';
        }
    } catch (error) {
        parityLabel.textContent = 'invalid';
        parityLabel.style.color = 'var(--parity-invalid)';
        parityLabel.style.fontWeight = '600';
    }
}

// Function to add new algorithm field
window.addNewAlgorithmField = function () {
    const algsList = document.getElementById('editAlgsList');
    if (!algsList) return;

    const newField = document.createElement('div');
    newField.style.cssText = 'display: flex; gap: 8px; align-items: center;';
    newField.innerHTML = `
        <input type="text" class="alg-input" value="" placeholder="Enter algorithm" data-original="" style="flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; font-family: monospace; font-size: 0.9rem;">
        <span class="parity-label" style="min-width: 40px; font-size: 0.8rem; color: var(--text-secondary); font-style: italic;"></span>
        <button onclick="this.parentElement.remove()" style="padding: 6px; background: var(--delete-btn-bg); color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
            <img src="res/delete.svg" style="width: 16px; height: 16px;" alt="Delete">
        </button>
    `;

    algsList.appendChild(newField);

    const input = newField.querySelector('.alg-input');
    input.addEventListener('focus', () => {
        const parityLabel = input.parentElement.querySelector('.parity-label');
        if (parityLabel) parityLabel.textContent = '';
    });

    input.addEventListener('blur', () => {
        const rawText = input.value.trim();
        if (rawText && rawText !== 'Done!') {
            const normalized = window.ScrambleNormalizer.normalizeScramble(rawText);
            input.value = normalized;
        }
        updateParityLabel(input);
    });

    input.addEventListener('input', () => {
        if (input.parityTimeout) {
            clearTimeout(input.parityTimeout);
        }
        input.parityTimeout = setTimeout(() => {
            if (document.activeElement !== input) {
                updateParityLabel(input);
            }
        }, 300);
    });

    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const currentValue = input.value;
        input.value = currentValue.substring(0, start) + text + currentValue.substring(end);
        input.selectionStart = input.selectionEnd = start + text.length;
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

function closeEditCaseModal() {
    const modal = document.getElementById('editCaseModal');
    if (modal) {
        modal.remove();
        document.documentElement.classList.remove('scroll-locked');
    }
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

    const customAlgs = customAlgorithms.get(item.name);
    if (customAlgs) {
        originalAlgs.push(...(customAlgs.odd || []), ...(customAlgs.even || []));
    } else {
        originalAlgs.push(...(item.odd || []), ...(item.even || []));
    }

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
            () => saveEditedCase(item.name, item.name),
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

    infoModal.classList.add('active');
};

window.closeEditCaseInfoModal = function () {
    const modal = document.getElementById('editCaseInfoModal');
    if (modal) {
        modal.classList.remove('active');
    }
};

function saveEditedCase(caseName, originalName) {
    // Save name and subtitle from temp rename
    saveCaseRename(caseName);

    const algInputs = document.querySelectorAll('#editAlgsList .alg-input');

    // Collect all algorithms
    const allAlgs = Array.from(algInputs).map(input => input.value.trim()).filter(v => v);

    // Save custom algorithms
    if (allAlgs.length > 0) {
        customAlgorithms.set(caseName, {
            odd: [],
            even: allAlgs
        });
    } else {
        customAlgorithms.delete(caseName);
    }

    saveState();

    // Recalculate parity
    calculateAndCacheAllParity();

    render();
    closeEditCaseModal();
    showToast('Case updated successfully!', 2000, 'success');
}

function openCustomizeSVGsModal() {
    closeSettingsModal();
    SVGEditor.open();
}

function openNotesModal(caseName) {
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

    infoModal.classList.add('active');
};

window.closeNotesInfoModal = function () {
    const modal = document.getElementById('notesInfoModal');
    if (modal) {
        modal.classList.remove('active');
    }
};

function closeNotesModal() {
    const modal = document.getElementById('notesModal');
    if (modal) {
        modal.remove();
        document.documentElement.classList.remove('scroll-locked');
    }
}

function saveNotes(caseName) {
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
function openGeneralNotesModal() {
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
                    <div style="margin-bottom: 10px; padding: 10px; background: var(--warning-bg); border: 1px solid var(--warning-border); border-radius: 4px; font-size: 0.9rem; color: var(--warning-color);">
                        <strong>⚠️ Warning:</strong> This editor supports HTML, CSS, SVG, and JavaScript. Code will execute when you save and view. Use with caution!
                    </div>
                    <textarea id="generalNotesTextarea" style="flex: 1; width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; font-family: 'Courier New', monospace; font-size: 0.9rem; resize: none; overflow-y: auto;"></textarea>
                </div>
            </div>
        </div>
    `;

    // Debug: watch for card size changes
    const firstCard = document.querySelector('.card');
    if (firstCard) {
        const ro = new ResizeObserver(entries => {
            for (const entry of entries) {
            }
        });
        ro.observe(firstCard);
        modal._resizeObserver = ro;
    }

    // Render the saved content
    renderGeneralNotes();
}

function closeGeneralNotesModal() {
    const modal = document.getElementById('generalNotesModal');
    if (modal) {
        if (modal._resizeObserver) modal._resizeObserver.disconnect();
        modal.remove();
    }
}

function renderGeneralNotes() {
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

function toggleEditGeneralNotes() {
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

function attemptSwitchToViewMode() {
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

function switchToViewMode() {
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

function saveGeneralNotes() {
    const textarea = document.getElementById('generalNotesTextarea');
    generalNotes = textarea.value;
    window.originalGeneralNotes = generalNotes;
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
                    <span class="training-info-title">HTML Formatting Guide</span>
                    <button class="training-info-close" onclick="closeGeneralNotesInfoModal()">&times;</button>
                </div>
                <div class="training-info-body" style="max-height: 70vh; overflow-y: auto;">
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

    infoModal.classList.add('active');
};

window.closeGeneralNotesInfoModal = function () {
    const modal = document.getElementById('generalNotesInfoModal');
    if (modal) {
        modal.classList.remove('active');
    }
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
window.showToast = function (message, duration = 3000, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-notification--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('toast-notification--visible'), 10);

    setTimeout(() => {
        toast.classList.remove('toast-notification--visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

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
let activeProfilePopup = null;
let activeProfilePopupElement = null;

function showProfilePopup(isPermanent) {
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

function hideProfilePopup(isPermanent) {
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
function openProfileModalDesktop(isPermanent = false) {
    showProfilePopup(isPermanent);
}

function closeProfileModalDesktop(isPermanent = false) {
    hideProfilePopup(isPermanent);
}

// Mobile Profile Modal Functions (Full modal style)
function openProfileModalMobile() {
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

function closeProfileModalMobile() {
    const modal = document.getElementById('profileModalMobile');
    if (modal) {
        modal.classList.remove('active');
        document.documentElement.classList.remove('scroll-locked');
    }
}

// Unified function that detects device type
function openProfileModal() {
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

const AVATARS = [
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

let tempSelectedAvatar = null;

function applyProfileUI() {
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

function buildAvatarGrid(mode) {
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
    profileName = newName || 'Profile';
    profileAvatar = tempSelectedAvatar || profileAvatar;
    localStorage.setItem('profileName', profileName);
    localStorage.setItem('profileAvatar', profileAvatar);
    tempSelectedAvatar = null;
    applyProfileUI();
    switchToViewProfile(mode);
    showToast('Profile saved!', 2000, 'success');
};

function updateProfileStats() {
    const totalCases = data.length;
    const learnedCount = learnedCases.size;
    const learningCount = learningCases.size;
    const learnedPercent = (learnedCount / totalCases) * 100;
    const learningPercent = (learningCount / totalCases) * 100;

    const totalProbability = data.reduce((sum, item) => sum + item.probability, 0);
    const learnedProbability = data
        .filter(item => learnedCases.has(item.name))
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
            learnedText.textContent = learnedCount + '/90';
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
function openAboutModal() {
    const modal = document.getElementById('aboutModal');

    window.modalScrollY = window.scrollY;
    document.body.style.top = `-${window.modalScrollY}px`;
    document.documentElement.classList.add('scroll-locked');
    modal.classList.add('active');

    pushModalState('aboutModal', closeAboutModal);
}

function closeAboutModal() {
    const modal = document.getElementById('aboutModal');
    modal.classList.remove('active');
    document.documentElement.classList.remove('scroll-locked');
}

// Function to open parity tracing personalization from settings
function openParityTracingPersonalization() {
    closeSettingsModal();

    // Call the config modal directly via the exported library function
    if (typeof window.ParityTracerLibrary === 'undefined' || !window.ParityTracerLibrary.openConfigModal) {
        showToast('Configuration modal not available', 3000, 'error');
        return;
    }

    const config = {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#ffffff',
        hideInstructionButton: hideInstructions,
        instructionText1: 'Enter your scramble in the top input bar and press Analyze to trace parity using Cale\'s method.',
        instructionText2: 'You can change the color scheme from Color Scheme Settings in the main Settings menu.',
        instructionText3: 'Customize the tracing start point from the settings button at the bottom right.',
        topLayerMainColor: colorScheme.topColor,
        topLayerColorFullName: getColorName(colorScheme.topColor),
        topLayerColorAbbreviation: getColorName(colorScheme.topColor).charAt(0),
        bottomLayerMainColor: colorScheme.bottomColor,
        bottomLayerColorFullName: getColorName(colorScheme.bottomColor),
        bottomLayerColorAbbreviation: getColorName(colorScheme.bottomColor).charAt(0),
        frontFaceColorForVisualization: colorScheme.frontColor,
        rightFaceColorForVisualization: colorScheme.rightColor,
        backFaceColorForVisualization: colorScheme.backColor,
        leftFaceColorForVisualization: colorScheme.leftColor
    };

    window.ParityTracerLibrary.openConfigModal(null, config, null, null, null);
}

// Sidebar functions
function generateSidebarHTML() {
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
                    <img src="res/settings.svg" alt="Settings">
                    <span>Personalization</span>
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

function initializePresetSelector() {
    const currentPresetName = document.getElementById('currentPresetName');
    const presetOptions = document.getElementById('presetOptions');

    if (!currentPresetName || !presetOptions) return;

    currentPresetName.textContent = currentPreset.replace(/_/g, ' ').replace(/'/g, "'");

    presetOptions.innerHTML = '';
    for (const presetName in window.PRESET_CONFIG) {
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

// Make it globally accessible
window.initializePresetSelector = initializePresetSelector;

window.togglePresetExpand = function () {
    const presetOptions = document.getElementById('presetOptions');
    const expandIcon = document.getElementById('presetExpandIcon');

    if (!presetOptions || !expandIcon) return;

    if (presetOptions.style.maxHeight === '0px' || presetOptions.style.maxHeight === '') {
        // Calculate height based on number of presets
        const numPresets = Object.keys(window.PRESET_CONFIG).length;
        const height = numPresets * 48; // 48px per option
        presetOptions.style.maxHeight = height + 'px';
        expandIcon.style.transform = 'rotate(180deg)';
    } else {
        presetOptions.style.maxHeight = '0px';
        expandIcon.style.transform = 'rotate(0deg)';
    }
};

window.toggleSidebar = function () {
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
};

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

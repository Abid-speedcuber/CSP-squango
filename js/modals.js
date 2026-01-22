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
            <div class="modal-content" style="max-width: 480px; margin-top: 50px; max-height: 85vh; display: flex; flex-direction: column; border-radius: 16px; overflow: hidden; background: white;">
                <div class="modal-header" style="flex-shrink: 0; background: white; color: #2d3748; padding: 24px 28px; border-bottom: 2px solid #e9ecef;">
                    <span class="modal-title" style="font-size: 1.5rem; font-weight: 700; color: #2d3748;">Personalization</span>
                    <button class="close-btn" onclick="closeSettingsModal()" style="color: #6c757d; opacity: 1;">&times;</button>
                </div>
                <div class="modal-body" style="overflow-y: auto; flex: 1; padding: 24px 28px; background: white;">
                    
                    <!-- Basic Personalization Section -->
                    <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 16px 0; font-size: 1rem; color: #2d3748; font-weight: 700;">Basic Personalization</h3>
                        
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <label for="hintToggle" style="color: #495057; font-weight: 500; font-size: 0.95rem;">Show Tracing Guides</label>
                                <span class="info-wrapper">
                                    <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                                    <span class="info-box">Show/hide the blue and green numbers from the case images to help you trace parity using Kale's method.<br><br><strong>Keyboard shortcut:</strong> Alt+T</span>
                                </span>
                            </div>
                            <input type="checkbox" id="hintToggle" onchange="toggleHints(this.checked)" style="transform: scale(1.3); cursor: pointer;">
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <label for="hideInstructionsToggle" style="color: #495057; font-weight: 500; font-size: 0.95rem;">Hide Instruction Buttons</label>
                                <span class="info-wrapper">
                                    <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                                    <span class="info-box">Hide instruction buttons (â"˜) across the app. The irony: pressing this will eventually hide this instruction button too!<br><br><strong>Keyboard shortcut:</strong> Alt+H</span>
                                </span>
                            </div>
                            <input type="checkbox" id="hideInstructionsToggle" onchange="toggleHideInstructions(this.checked)" style="transform: scale(1.3); cursor: pointer;">
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <label for="hideParenthesisToggle" style="color: #495057; font-weight: 500; font-size: 0.95rem;">Hide Parenthesis</label>
                                <span class="info-wrapper">
                                    <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                                    <span class="info-box">Removes parenthesis and changes the font from monospace to proportional (Arial) for a more modern algorithm display.<br><br><strong>Keyboard shortcut:</strong> Alt+P</span>
                                </span>
                            </div>
                            <input type="checkbox" id="hideParenthesisToggle" onchange="toggleHideParenthesis(this.checked)" style="transform: scale(1.3); cursor: pointer;">
                        </div>
                        
                        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e9ecef;">
                            <label style="display: block; font-weight: 500; margin-bottom: 8px; color: #495057; font-size: 0.95rem;">Algorithm Font Size: <span id="algFontSizeValue">14</span>px</label>
                            <input type="range" id="algFontSizeSlider" min="10" max="20" step="1" value="14" style="width: 100%; cursor: pointer;" oninput="updateAlgFontSizePreview(this.value)">
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #666; margin-top: 5px;">
                                <span>Small (10px)</span>
                                <span>Large (20px)</span>
                            </div>
                        </div>
                        
                                                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e9ecef;">
                            <label style="display: block; font-weight: 500; margin-bottom: 8px; color: #495057; font-size: 0.95rem;">Scramble Image Size: <span id="sizeValue">200</span>px</label>
                            <input type="range" id="imageSizeSlider" min="100" max="400" step="10" value="200" style="width: 100%; cursor: pointer;" oninput="updateImageSizePreview(this.value)">
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #666; margin-top: 5px;">
                                <span>Small (100px)</span>
                                <span>Large (400px)</span>
                            </div>
                        </div>
                        
                        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e9ecef;">
                            <div onclick="openColorSchemeModal()" style="padding: 12px 20px; background: white; color: #2d3748; border: 1px solid #dee2e6; border-radius: 10px; cursor: pointer; width: 100%; margin-bottom: 10px; font-weight: 600; font-size: 0.95rem; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; display: flex; align-items: center; justify-content: space-between;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.1)'; this.style.borderColor='#adb5bd'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'; this.style.borderColor='#dee2e6'">
                                <span>Color Scheme Settings</span>
                                <span class="info-wrapper">
                                    <button class="settings-info-btn" aria-label="More info" onclick="event.stopPropagation();"><img src="res/info.svg"></button>
                                    <span class="info-box">Your color scheme will be used in parity tracing and training.</span>
                                </span>
                            </div>
                            <div onclick="openParityTracingPersonalization()" style="padding: 12px 20px; background: white; color: #2d3748; border: 1px solid #dee2e6; border-radius: 10px; cursor: pointer; width: 100%; margin-bottom: 10px; font-weight: 600; font-size: 0.95rem; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; display: flex; align-items: center; justify-content: space-between;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.1)'; this.style.borderColor='#adb5bd'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'; this.style.borderColor='#dee2e6'">
                                <span>Parity Tracing Personalization</span>
                                <span class="info-wrapper">
                                    <button class="settings-info-btn" aria-label="More info" onclick="event.stopPropagation();"><img src="res/info.svg"></button>
                                    <span class="info-box">Select your parity tracing scheme. It will be used throughout the app to organize your algorithms and in the tracing guides.<br><br><strong>Keyboard shortcut:</strong> Alt+W</span>
                                </span>
                            </div>
                            <div onclick="openQuickEditModal()" style="padding: 12px 20px; background: white; color: #2d3748; border: 1px solid #dee2e6; border-radius: 10px; cursor: pointer; width: 100%; margin-bottom: 10px; font-weight: 600; font-size: 0.95rem; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; display: flex; align-items: center; justify-content: space-between;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.1)'; this.style.borderColor='#adb5bd'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'; this.style.borderColor='#dee2e6'">
                                <span>Quick Edit</span>
                                <span class="info-wrapper">
                                    <button class="settings-info-btn" aria-label="More info" onclick="event.stopPropagation();"><img src="res/info.svg"></button>
                                    <span class="info-box">A table for preset creators to bulk edit the cases.<br><br><strong>Keyboard shortcut:</strong> Alt+Q</span>
                                </span>
                            </div>
                            <div onclick="openCustomizeSVGsModal()" style="padding: 12px 20px; background: white; color: #2d3748; border: 1px solid #dee2e6; border-radius: 10px; cursor: pointer; width: 100%; margin-bottom: 10px; font-weight: 600; font-size: 0.95rem; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; display: flex; align-items: center; justify-content: space-between;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.1)'; this.style.borderColor='#adb5bd'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'; this.style.borderColor='#dee2e6'">
                                <span>Customize Tracing Guides</span>
                                <span class="info-wrapper">
                                    <button class="settings-info-btn" aria-label="More info" onclick="event.stopPropagation();"><img src="res/info.svg"></button>
                                    <span class="info-box">Lets you move the little numbers around for each image to set your tracing guide.<br><br><strong>Keyboard shortcut:</strong> Alt+G</span>
                                </span>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <label for="allowCaseEditToggle" style="color: #495057; font-weight: 500; font-size: 0.95rem;">Allow Case Edits</label>
                                <input type="checkbox" id="allowCaseEditToggle" onchange="toggleAllowCaseEdit(this.checked)" style="transform: scale(1.3); cursor: pointer;">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="colorSchemeModal" class="modal">
            <div class="modal-content" style="max-width: 500px; margin-top: 50px;">
                <div class="modal-header">
                    <span class="modal-title">Color Scheme Settings</span>
                    <button class="close-btn" onclick="closeColorSchemeModal()">&times;</button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">Top Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="top" data-color="#FFFF00" style="background: #FFFF00; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Yellow</button>
                            <button class="color-btn" data-face="top" data-color="#000000" style="background: #000000; color: white; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Black</button>
                            <button class="color-btn" data-face="top" data-color="#FFFFFF" style="background: #FFFFFF; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">White</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">Bottom Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="bottom" data-color="#FFFF00" style="background: #FFFF00; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Yellow</button>
                            <button class="color-btn" data-face="bottom" data-color="#000000" style="background: #000000; color: white; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Black</button>
                            <button class="color-btn" data-face="bottom" data-color="#FFFFFF" style="background: #FFFFFF; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">White</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">Front Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="front" data-color="#CC0000" style="background: #CC0000; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Red</button>
                            <button class="color-btn" data-face="front" data-color="#00AA00" style="background: #00AA00; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Green</button>
                            <button class="color-btn" data-face="front" data-color="#0066CC" style="background: #0066CC; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Blue</button>
                            <button class="color-btn" data-face="front" data-color="#FF8C00" style="background: #FF8C00; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Orange</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">Right Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="right" data-color="#CC0000" style="background: #CC0000; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Red</button>
                            <button class="color-btn" data-face="right" data-color="#00AA00" style="background: #00AA00; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Green</button>
                            <button class="color-btn" data-face="right" data-color="#0066CC" style="background: #0066CC; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Blue</button>
                            <button class="color-btn" data-face="right" data-color="#FF8C00" style="background: #FF8C00; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Orange</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">Back Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="back" data-color="#CC0000" style="background: #CC0000; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Red</button>
                            <button class="color-btn" data-face="back" data-color="#00AA00" style="background: #00AA00; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Green</button>
                            <button class="color-btn" data-face="back" data-color="#0066CC" style="background: #0066CC; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Blue</button>
                            <button class="color-btn" data-face="back" data-color="#FF8C00" style="background: #FF8C00; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Orange</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">Left Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="left" data-color="#CC0000" style="background: #CC0000; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Red</button>
                            <button class="color-btn" data-face="left" data-color="#00AA00" style="background: #00AA00; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Green</button>
                            <button class="color-btn" data-face="left" data-color="#0066CC" style="background: #0066CC; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Blue</button>
                            <button class="color-btn" data-face="left" data-color="#FF8C00" style="background: #FF8C00; width: 60px; height: 40px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer;">Orange</button>
                        </div>
                    </div>          
                </div>
            </div>
        </div>

        <div id="profileModal" class="modal" style="background: transparent;">
            <div class="modal-content" style="max-width: 300px; margin: 70px 20px 20px auto; margin-right: 20px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.2);">
                <div class="modal-body" style="padding: 0; background: white; border-radius: 16px;">
                    <!-- Profile Header -->
                    <div style="text-align: center; padding: 20px 20px 15px; border-bottom: 1px solid #e9ecef;">
                        <img src="res/avatar.svg" style="width: 56px; height: 56px; margin-bottom: 10px;">
                        <h3 style="margin: 0; font-size: 1.2rem; color: #2d3748; font-weight: 600;">Profile</h3>
                    </div>
                    
                    <!-- Progress Stats -->
                    <div style="padding: 15px;">
                        <!-- Cases Learned Progress -->
                        <div style="margin-bottom: 12px;">
                            <div style="background: #e9ecef; border-radius: 8px; height: 24px; position: relative; overflow: hidden;">
                                <div id="profileLearnedProgress" style="background: linear-gradient(90deg, #28a745, #20c997); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px;"></div>
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding: 0 10px; justify-content: space-between;">
                                    <span style="font-size: 0.75rem; color: #2d3748; font-weight: 600;">Learned</span>
                                    <span id="profileLearnedText" style="font-weight: 700; color: #2d3748; font-size: 0.8rem;">0/90</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Coverage Progress -->
                        <div style="margin-bottom: 12px;">
                            <div style="background: #e9ecef; border-radius: 8px; height: 24px; position: relative; overflow: hidden;">
                                <div id="profileCoverageProgress" style="background: linear-gradient(90deg, #007bff, #0056b3); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px;"></div>
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding: 0 10px; justify-content: space-between;">
                                    <span style="font-size: 0.75rem; color: #2d3748; font-weight: 600;">Coverage</span>
                                    <span id="profileCoverageText" style="font-weight: 700; color: #2d3748; font-size: 0.8rem;">0.0%</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Safety Progress -->
                        <div style="margin-bottom: 12px;">
                            <div style="background: #e9ecef; border-radius: 8px; height: 24px; position: relative; overflow: hidden;">
                                <div id="profileSafetyProgress" style="background: linear-gradient(90deg, #ffc107, #ff8c00); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px;"></div>
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding: 0 10px; justify-content: space-between;">
                                    <span style="font-size: 0.75rem; color: #2d3748; font-weight: 600;">Safety</span>
                                    <span id="profileSafetyText" style="font-weight: 700; color: #2d3748; font-size: 0.8rem;">0.0%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="aboutModal" class="modal">
  <div class="modal-content" style="
      max-width: 700px;
      margin-top: 60px;
      border-radius: 14px;
      overflow: hidden;
      background: #ffffff;
  ">

    <!-- Header -->
    <div style="
        background: #1f2933;
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
        color: #2d3748;
        line-height: 1.65;
        max-height: 70vh;
        overflow-y: auto;
        background: #f8f9fa;
    ">

      <!-- Intro -->
      <section style="margin-bottom: 26px;">
        <p style="margin: 0; font-size: 1rem; color: #4a5568;">
          SquanGo CSP is a focused Square-1 CSP training tool built for speedcubers
          who want structure, repetition, and zero fluff.  
          It started as a personal motivation tool and slowly turned into something
          worth sharing.
        </p>
      </section>

      <!-- Developer -->
      <section style="
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 22px;
      ">
        <p style="font-weight: 600; margin-bottom: 6px;">Developer</p>
        <p style="margin: 0 0 10px 0; color: #6b7280;">
          Created by <strong>Abid Ibn Ashraf</strong>
        </p>

        <p style="margin: 0; font-size: 0.95rem; color: #6b7280;">
          Contact & feedback:
          <strong>Discord — <span style="color:#1f2933;">abid_ibn_ashraf</span></strong>
        </p>
      </section>

      <!-- Credits -->
      <section style="
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 22px;
      ">
        <p style="font-weight: 600; margin-bottom: 10px;">Credits & Inspiration</p>

        <p style="margin: 0 0 10px 0; font-size: 0.95rem; color: #6b7280;">
          Major credit goes to <strong>Eva Kato (Hashtag Cuber)</strong>.
          The overall Homepage layout, case images and most of the algorithm data are based on her work.
        </p>

        <p style="margin: 0; font-size: 0.95rem; color: #6b7280;">
          Additional credit to <strong>Matt Mao</strong> — Square-1 NR average holder from China —
          for helping me out in various way in this project. Matt's preset is built solemnly by him, and he helped me refine the site further.
        </p>
      </section>

      <!-- Scramble -->
      <section style="
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 22px;
      ">
        <p style="font-weight: 600; margin-bottom: 8px;">Scramble Generator</p>
        <p style="margin: 0 0 10px 0; font-size: 0.95rem; color: #6b7280;">
          Square-1 scrambles are generated using code from
          <strong>csTimer</strong>, written by Shuang Chen (cs0x7f),
          licensed under GPL-3.0.
        </p>

        <a href="https://github.com/cs0x7f/cstimer/blob/master/src/js/scramble/scramble_sq1_new.js"
           target="_blank"
           style="font-size: 0.95rem; font-weight: 500; color: #2563eb; text-decoration: none;">
          View source on GitHub →
        </a>
      </section>

      <!-- Open Source -->
      <section style="
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 20px;
      ">
        <p style="font-weight: 600; margin-bottom: 8px;">Open Source</p>
        <p style="margin: 0 0 10px 0; font-size: 0.95rem; color: #6b7280;">
          SquanGo CSP is open source. You’re free to explore the code,
          suggest improvements, or fork it for your own use.
        </p>

        <a href="https://github.com/Abid-speedcuber/sq1-csparity-algs"
           target="_blank"
           style="font-size: 0.95rem; font-weight: 500; color: #2563eb; text-decoration: none;">
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
        btn.addEventListener('click', function() {
            const face = this.getAttribute('data-face');
            const color = this.getAttribute('data-color');
            
            colorScheme[face + 'Color'] = color;
            
            const sameFaceButtons = document.querySelectorAll(`.color-btn[data-face="${face}"]`);
            sameFaceButtons.forEach(b => {
                if (b === this) {
                    b.style.border = '3px solid #007bff';
                    b.style.fontWeight = 'bold';
                } else {
                    b.style.border = '2px solid #ddd';
                    b.style.fontWeight = 'normal';
                }
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

/*
╔════════════════════════════════════════════════════════════════════════════╗
║                             CASE DETAILS MODAL                             ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

function openModal(name) {
    // Case modal removed - functionality moved to context menu and algorithm popups
    return;
}

function closeModal() {
    // Case modal removed
    return;
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
    const settingsModal = document.getElementById('settingsModal');
    if (!settingsModal) return;
    document.body.classList.add('modal-open');
    settingsModal.style.display = 'block';
    
    const hintToggleCheckbox = document.getElementById('hintToggle');
    if (hintToggleCheckbox) hintToggleCheckbox.checked = showHints;
    
    const showPathsToggle = document.getElementById('showPathsToggle');
    if (showPathsToggle) showPathsToggle.checked = showPaths;
    
    const dynamicParityToggle = document.getElementById('dynamicParityToggle');
    if (dynamicParityToggle) dynamicParityToggle.checked = useDynamicParity;
    
    const priorityLearningToggle = document.getElementById('priorityLearningToggle');
    if (priorityLearningToggle) priorityLearningToggle.checked = enablePriorityLearning;
    
    const hideInstructionsToggle = document.getElementById('hideInstructionsToggle');
if (hideInstructionsToggle) hideInstructionsToggle.checked = hideInstructions;
const hideParenthesisToggle = document.getElementById('hideParenthesisToggle');
if (hideParenthesisToggle) hideParenthesisToggle.checked = hideParenthesis;

const algFontSizeSlider = document.getElementById('algFontSizeSlider');
if (algFontSizeSlider) {
    algFontSizeSlider.value = algorithmFontSize;
    document.getElementById('algFontSizeValue').textContent = algorithmFontSize;
}

const allowCaseEditToggle = document.getElementById('allowCaseEditToggle');
if (allowCaseEditToggle) allowCaseEditToggle.checked = allowCaseEdit;

    populatePresetDropdown();

pushModalState('settingsModal', closeSettingsModal);
}

function handlePresetChange(presetName) {
    if (presetName === currentPreset) return;
    
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
        <div class="modal-content" style="max-width: 500px; margin-top: 80px;">
            <div class="modal-header" style="background: #fff3cd; border-bottom: 2px solid #fff3cd;">
                <span class="modal-title" style="color: #856404;">Warning: Data Loss</span>
                <button class="close-btn" onclick="this.closest('.modal').remove(); document.getElementById('presetSelector').value = \`${currentPreset}\`;">&times;</button>
            </div>
            <div class="modal-body">
                <p style="margin: 0 0 15px 0; font-size: 1rem; line-height: 1.6; color: #333;">
                    Switching to "<strong>${presetName}</strong>" preset will <strong>replace ALL your current data.</strong> We strongly recommend exporting your current data first.
                </p>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="exportData(); showToast('Data exported! You can now safely switch presets.', 3000, 'success');" style="padding: 10px 20px; background: #abd7b5ff; color: black; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem;">
                        Export Data First
                    </button>
                    <button onclick="this.closest('.modal').remove(); applyPreset(\`${presetName}\`, false, false);" style="padding: 10px 20px; background: #e8b1b6ff; color: black; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem;">
                        Switch Anyway
                    </button>
                    <button onclick="this.closest('.modal').remove(); document.getElementById('presetSelector').value = \`${currentPreset}\`;" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem;">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(warningModal);
    document.body.classList.add('modal-open');
}

function closeSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    if (!settingsModal) return;
    settingsModal.style.display = 'none';
    document.body.classList.remove('modal-open');
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
    const instructionBtns = document.querySelectorAll('.settings-info-btn, .homepage-info-btn, .training-info-btn, .case-detail-info-btn');
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

function toggleAllowCaseEdit(isChecked) {
    window.allowCaseEdit = isChecked;
    localStorage.setItem('allowCaseEdit', isChecked.toString());
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
    if (settingsBtn) {
        settingsBtn.onclick = openSettingsModal;
    }
});

// Color Scheme Modal Functions
function openColorSchemeModal() {
    const modal = document.getElementById('colorSchemeModal');
    modal.style.display = 'block';
    
    pushModalState('colorSchemeModal', closeColorSchemeModal);
    
    // Highlight currently selected colors
    document.querySelectorAll('.color-btn').forEach(btn => {
        const face = btn.getAttribute('data-face');
        const color = btn.getAttribute('data-color');
        const currentColor = colorScheme[face + 'Color'];
        
        if (color === currentColor) {
            btn.style.border = '3px solid #007bff';
            btn.style.fontWeight = 'bold';
        } else {
            btn.style.border = '2px solid #ddd';
            btn.style.fontWeight = 'normal';
        }
    });
}

function closeColorSchemeModal() {
    const modal = document.getElementById('colorSchemeModal');
    modal.style.display = 'none';
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
        backgroundColor: '#ffffff',
        hideInstructionButton: hideInstructions,
        instructionText1: 'Enter your scramble in the top input bar and press Analyze to trace parity using Kale\'s method.',
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
        scrambleText: scramble,
        generateImage: true,
        imageSize: scrambleImageSize || 200
    });
}

// Settings Info Modal
function showSettingsInfoModal() {
    pushModalState('settingsInfoModal', closeSettingsInfoModal);
    
    let infoModal = document.getElementById('settingsInfoModal');
    if (!infoModal) {
        infoModal = document.createElement('div');
        infoModal.id = 'settingsInfoModal';
        infoModal.className = 'training-info-modal';
        infoModal.innerHTML = `
            <div class="training-info-content">
                <div class="training-info-header">
                    <span class="training-info-title">Personalization Guide</span>
                    <button class="training-info-close" onclick="closeSettingsInfoModal()">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text"><strong>"Show Tracing Guides"</strong> displays visual tracing paths on cubeshape images to help you learn Kale's parity tracing method.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text"><strong>"Hide Instruction Buttons"</strong> removes all help buttons (ⓘ) throughout the app once you're familiar with the features.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text"><strong>"Color Scheme Settings"</strong> customizes your cube's colors for parity analysis and scramble images. Changing colors will recalculate all parity determinations to match your scheme.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text"><strong>"Case Name Settings"</strong> lets you rename cases with custom names or choose from preset alternatives (e.g., "Pair" instead of "Paired Edges", "L-Shape" instead of "Perpendicular Edges").</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text"><strong>"Customize Tracing Guides"</strong> allows you to edit the appearance of tracing paths, including colors, line styles, and starting positions for each cubeshape.</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }
    
    infoModal.classList.add('active');
}

function closeSettingsInfoModal() {
    const modal = document.getElementById('settingsInfoModal');
    if (modal) {
        modal.classList.remove('active');
    }
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
                        <div class="training-info-text">Click the <strong>profile button</strong> (top right) to view your progress stats, export/import data, and access the About page. Click other menu buttons for Personalization, Parity Tracer, and Notes.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text">Click the <strong>checkmark</strong> to cycle: Unlearned → Learning → Learned. Right-click to reverse: Learned → Learning → Unlearned.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text">Click the <strong>three dots menu</strong> on any case to adjust priority, add notes, train the case, or edit algorithms.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text"><strong>Hover</strong> over any algorithm to see its setup and shape path. <strong>Click</strong> to keep the popup open, then click the setup to analyze parity.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text">The <strong style="color: #007bff;">blue percentage</strong> shows your coverage - the probability of encountering a known parity case.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">6</div>
                        <div class="training-info-text">The <strong style="color: #28a745;">green percentage</strong> shows your safety - accounting for both known cases and the 50% chance of avoiding parity on unknown cases.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">7</div>
                        <div class="training-info-text">Use <strong>Priority</strong> sorting to organize cases by learning priority (1-7). Adjust priorities via the three dots menu.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">8</div>
                        <div class="training-info-text">Use <strong>Color Scheme Settings</strong> to customize cube colors for parity tracing and scramble images to match your preferences.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">9</div>
                        <div class="training-info-text"><strong>Export/Import Data</strong> in Settings to backup your progress or transfer between devices.</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }
    
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
        <div class="modal-content" style="max-width: 600px; margin-top: 50px;">
            <div class="modal-header">
                <div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="modal-title" id="editCaseTitle">${getDisplayName(caseName)}</span>
                        <button onclick="openCaseRenameModal('${caseName.replace(/'/g, "\\'")}', '${customName.replace(/'/g, "\\'")}', '${customSubtitle.replace(/'/g, "\\'")}' )" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center;">
                            <img src="res/pen.svg" style="width: 20px; height: 20px;" alt="Edit name">
                        </button>
                        <button onclick="showEditCaseInfoModal()" style="background: #f8f9fa; border: 1px solid #dee2e6; color: #495057; cursor: pointer; padding: 6px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; width: 32px; height: 32px;" title="Help" onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='#f8f9fa'">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </button>
                    </div>
                    ${perCaseSubtitles.has(caseName) ? `<div style="font-size: 0.85rem; color: #888; margin-top: 4px;" id="editCaseSubtitle">${perCaseSubtitles.get(caseName)}</div>` : '<div style="font-size: 0.85rem; color: #888; margin-top: 4px; display: none;" id="editCaseSubtitle"></div>'}
                </div>
                <button class="close-btn" onclick="attemptCloseEditCaseModal()">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #666;">Algorithms:</label>
                    <div id="editAlgsList" style="display: flex; flex-direction: column; gap: 10px;">
                        ${allAlgs.map((alg, idx) => `
                            <div style="display: flex; gap: 8px; align-items: center;" data-alg-index="${idx}">
                                <input type="text" class="alg-input" value="${alg}" data-original="${alg}" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 0.9rem;">
                                <span class="parity-label" style="min-width: 40px; font-size: 0.8rem; color: #666; font-style: italic;"></span>
                                <button onclick="this.parentElement.remove()" style="padding: 6px; background: #d0d0d0ff; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
                                    <img src="res/delete.svg" style="width: 16px; height: 16px;" alt="Delete">
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <button onclick="addNewAlgorithmField()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">+ Add Algorithm</button>
                </div>
                
                <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                    <button onclick="saveEditedCase('${caseName.replace(/'/g, "\\'")}', '${item.name.replace(/'/g, "\\'")}')" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: 600;">Save Changes</button>
                    <button onclick="closeEditCaseModal()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    
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

// Helper function to update parity label
function updateParityLabel(input) {
    const parityLabel = input.parentElement.querySelector('.parity-label');
    if (!parityLabel) return;
    
    const alg = input.value.trim();
    if (!alg || alg === 'Done!') {
        parityLabel.textContent = '';
        parityLabel.style.color = '';
        parityLabel.style.fontWeight = '';
        return;
    }
    
    // Check if required functions exist
    if (typeof window.algToShapeIndex === 'undefined' || 
        typeof window.Square1ParityAnalyzerLibraryWithSillyNames === 'undefined') {
        parityLabel.textContent = '';
        parityLabel.style.color = '';
        parityLabel.style.fontWeight = '';
        return;
    }
    
    try {
        // Get the current case being edited
        const modal = document.getElementById('editCaseModal');
        const caseName = modal ? modal.querySelector('.modal-title').textContent : '';
        
        // Get shape index from algorithm
        const result = window.algToShapeIndex(alg);
        const resultShapeIndex = result.shapeIndex;
        
        // Find matching case in shapeIndexMap
        let matchedCaseName = null;
        for (const [name, indexStr] of Object.entries(shapeIndexMap)) {
            if (parseInt(indexStr) === resultShapeIndex) {
                matchedCaseName = name;
                break;
            }
        }
        
        if (matchedCaseName) {
            // Direct match - test parity
            const setup = invertScramble(alg);
            const parityText = window.Square1ParityAnalyzerLibraryWithSillyNames.getParityTextFromScramblePlease(setup, {
                topColor: colorScheme.topColor,
                bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor,
                rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor,
                leftColor: colorScheme.leftColor
            }, cornerStickerMode);
            
            parityLabel.textContent = parityText.toLowerCase();
            parityLabel.style.color = parityText === 'Odd' ? '#00a126ff' : '#0069d9ff'; // Green for odd, blue for even
            parityLabel.style.fontWeight = '600';
        } else {
            // No direct match - check shapeIndex array for org/mir
            let foundInOrg = false;
            let foundInMir = false;
            
            for (const shapeData of shapeIndex) {
                if (shapeData.org && shapeData.org.includes(resultShapeIndex)) {
                    foundInOrg = true;
                    break;
                }
                if (shapeData.mir && shapeData.mir.includes(resultShapeIndex)) {
                    foundInMir = true;
                    break;
                }
            }
            
            if (foundInOrg) {
                parityLabel.textContent = 'angle mismatch';
                parityLabel.style.color = '#ca9b0dff'; // Yellow
                parityLabel.style.fontWeight = '600';
            } else if (foundInMir) {
                parityLabel.textContent = 'mirrored';
                parityLabel.style.color = '#c05c0aff'; // Orange
                parityLabel.style.fontWeight = '600';
            } else {
                parityLabel.textContent = 'invalid';
                parityLabel.style.color = '#71000bff'; // Red
                parityLabel.style.fontWeight = '600';
            }
        }
    } catch (error) {
        parityLabel.textContent = 'invalid';
        parityLabel.style.color = '#71000bff'; // Red
        parityLabel.style.fontWeight = '600';
    }
}

// Function to add new algorithm field
window.addNewAlgorithmField = function() {
    const algsList = document.getElementById('editAlgsList');
    if (!algsList) return;
    
    const newField = document.createElement('div');
    newField.style.cssText = 'display: flex; gap: 8px; align-items: center;';
    newField.innerHTML = `
        <input type="text" class="alg-input" value="" placeholder="Enter algorithm" data-original="" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 0.9rem;">
        <span class="parity-label" style="min-width: 40px; font-size: 0.8rem; color: #666; font-style: italic;"></span>
        <button onclick="this.parentElement.remove()" style="padding: 6px; background: #d0d0d0; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
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
window.openCaseRenameModal = function(caseName, currentName, currentSubtitle = '') {
    const renameModal = document.createElement('div');
    renameModal.className = 'modal active';
    renameModal.id = 'caseRenameModal';
    renameModal.style.zIndex = '10002';
    renameModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; margin-top: 100px;">
            <div class="modal-header">
                <span class="modal-title">Edit Case Name & Subtitle</span>
                <button class="close-btn" onclick="closeCaseRenameModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Custom Name:</label>
                    <input type="text" id="caseRenameInput" value="${currentName}" placeholder="Leave empty for default name" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Subtitle (optional):</label>
                    <input type="text" id="caseSubtitleRenameInput" value="${currentSubtitle}" placeholder="Enter a subtitle for this case" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="applyCaseRename('${caseName.replace(/'/g, "\\'")}' )" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: 600;">OK</button>
                    <button onclick="closeCaseRenameModal()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
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

window.closeCaseRenameModal = function() {
    const modal = document.getElementById('caseRenameModal');
    if (modal) modal.remove();
};

window.applyCaseRename = function(caseName) {
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

window.saveCaseRename = function(caseName) {
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
        document.body.classList.remove('modal-open');
    }
}

window.attemptCloseEditCaseModal = function() {
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

window.showEditCaseInfoModal = function() {
    let infoModal = document.getElementById('editCaseInfoModal');
    if (!infoModal) {
        infoModal = document.createElement('div');
        infoModal.id = 'editCaseInfoModal';
        infoModal.className = 'training-info-modal';
        infoModal.innerHTML = `
            <div class="training-info-content">
                <div class="training-info-header">
                    <span class="training-info-title">Algorithm Editor Guide</span>
                    <button class="training-info-close" onclick="closeEditCaseInfoModal()">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text"><strong>Parity Labels:</strong> Each algorithm input shows a colored label indicating its parity. <span style="color: #00a126ff; font-weight: 600;">Green = Odd</span>, <span style="color: #0069d9ff; font-weight: 600;">Blue = Even</span>. The label disappears while editing and reappears when you click away.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text"><strong>Angle Mismatch:</strong> If you see <span style="color: #ca9b0dff; font-weight: 600;">yellow "angle mismatch"</span>, the algorithm reaches the correct shape but from the wrong angle. You may need to add cube rotations (z, z', z2) to fix it.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text"><strong>Mirrored Cases:</strong> <span style="color: #c05c0aff; font-weight: 600;">Orange "mirrored"</span> means your algorithm solves the mirror of this case. Check if you're using the correct case or if the algorithm needs adjustment.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text"><strong>Invalid Algorithms:</strong> <span style="color: #71000bff; font-weight: 600;">Red "invalid"</span> indicates the algorithm doesn't match this case at all. Double-check your input for typos or incorrect moves.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text"><strong>Auto-Normalization:</strong> When you finish editing an algorithm (click away from the input), it's automatically normalized to standard Square-1 notation. Spaces, case variations, and formatting are corrected automatically.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">6</div>
                        <div class="training-info-text"><strong>Remember to Save:</strong> All changes (including name/subtitle edits) are only saved when you click "Save Changes" at the bottom. Closing without saving will prompt you to confirm.</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }
    
    infoModal.classList.add('active');
};

window.closeEditCaseInfoModal = function() {
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
        <div class="modal-content" style="max-width: 600px; margin-top: 50px;">
            <div class="modal-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="modal-title">Notes: ${getDisplayName(caseName)}</span>
                    <button onclick="showNotesInfoModal()" style="background: #f8f9fa; border: 1px solid #dee2e6; color: #495057; cursor: pointer; padding: 6px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; width: 32px; height: 32px;" title="Help" onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='#f8f9fa'">
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
                <textarea id="notesTextarea" style="width: 100%; height: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; resize: vertical;">${comment}</textarea>
                <div style="text-align: center; margin-top: 15px;">
                    <button onclick="saveNotes('${caseName.replace(/'/g, "\\'")}' )" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: 600;">Save</button>
                    <button onclick="attemptCloseNotesModal('${caseName.replace(/'/g, "\\'")}' )" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
}

window.attemptCloseNotesModal = function(caseName) {
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

window.showNotesInfoModal = function() {
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
                        <div class="training-info-number">📝</div>
                        <div class="training-info-text"><strong>What are Notes?</strong> Notes are personal reminders attached to specific cases. Use them to remember recognition tricks, finger tricks, or anything that helps you learn the case better.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">💡</div>
                        <div class="training-info-text"><strong>Good Examples:</strong><br>
                        • "Look for the bar on front-left"<br>
                        • "Use right thumb for the (3,0) move"<br>
                        • "Similar to case X but with flipped edges"<br>
                        • "Practice slow first, speed comes later"</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">✏️</div>
                        <div class="training-info-text"><strong>Text Formatting:</strong> Notes support basic HTML formatting:<br>
                        • <code>&lt;b&gt;bold&lt;/b&gt;</code> or <code>&lt;strong&gt;bold&lt;/strong&gt;</code><br>
                        • <code>&lt;i&gt;italic&lt;/i&gt;</code> or <code>&lt;em&gt;italic&lt;/em&gt;</code><br>
                        • <code>&lt;u&gt;underline&lt;/u&gt;</code><br>
                        • <code>&lt;s&gt;strikethrough&lt;/s&gt;</code><br>
                        • <code>&lt;font color="red"&gt;colored text&lt;/font&gt;</code><br>
                        • <code>&lt;br&gt;</code> for line breaks<br>
                        • <code>&lt;a href="url"&gt;link&lt;/a&gt;</code> for links</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">🎯</div>
                        <div class="training-info-text"><strong>Keep it Simple:</strong> Short, focused notes work best. If you find yourself writing paragraphs, consider using the General Notes feature instead (accessible from the menu).</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }
    
    infoModal.classList.add('active');
};

window.closeNotesInfoModal = function() {
    const modal = document.getElementById('notesInfoModal');
    if (modal) {
        modal.classList.remove('active');
    }
};

function closeNotesModal() {
    const modal = document.getElementById('notesModal');
    if (modal) {
        modal.remove();
        document.body.classList.remove('modal-open');
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
    // Close any existing modals
    const existingMenu = document.getElementById('caseContextMenu');
    if (existingMenu) existingMenu.remove();
    
    pushModalState('generalNotesModal', closeGeneralNotesModal);
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'generalNotesModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px; height: 90vh; margin-top: 30px; display: flex; flex-direction: column;">
            <div class="modal-header" style="flex-shrink: 0;">
                <span class="modal-title">General Notes</span>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button id="editGeneralNotesBtn" onclick="toggleEditGeneralNotes()" style="padding: 6px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">Edit</button>
                    <button id="saveGeneralNotesBtn" onclick="saveGeneralNotes()" style="padding: 6px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.9rem; display: none;">Save</button>
                    <button id="generalNotesInfoBtn" onclick="showGeneralNotesInfoModal()" style="background: #f8f9fa; border: 1px solid #dee2e6; color: #495057; cursor: pointer; padding: 6px; border-radius: 8px; display: none; align-items: center; justify-content: center; transition: all 0.2s; width: 32px; height: 32px;" title="Help" onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='#f8f9fa'">
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
                    <div style="margin-bottom: 10px; padding: 10px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; font-size: 0.9rem; color: #856404;">
                        <strong>⚠️ Warning:</strong> This editor supports HTML, CSS, SVG, and JavaScript. Code will execute when you save and view. Use with caution!
                    </div>
                    <textarea id="generalNotesTextarea" style="flex: 1; width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 0.9rem; resize: none; overflow-y: auto;"></textarea>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    
    // Render the saved content
    renderGeneralNotes();
}

function closeGeneralNotesModal() {
    const modal = document.getElementById('generalNotesModal');
    if (modal) {
        modal.remove();
        document.body.classList.remove('modal-open');
    }
}

function renderGeneralNotes() {
    const viewDiv = document.getElementById('generalNotesView');
    if (viewDiv) {
        if (generalNotes.trim()) {
            viewDiv.innerHTML = generalNotes;
            
            // Execute any script tags in the content
            const scripts = viewDiv.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                if (script.src) {
                    newScript.src = script.src;
                } else {
                    newScript.textContent = script.textContent;
                }
                script.parentNode.replaceChild(newScript, script);
            });
        } else {
            viewDiv.innerHTML = '<p style="color: #999; font-style: italic; text-align: center; margin-top: 50px;">No notes yet. Click Edit to add your first note!</p>';
        }
    }
}

function toggleEditGeneralNotes() {
    const viewDiv = document.getElementById('generalNotesView');
    const editDiv = document.getElementById('generalNotesEdit');
    const textarea = document.getElementById('generalNotesTextarea');
    const editBtn = document.getElementById('editGeneralNotesBtn');
    const saveBtn = document.getElementById('saveGeneralNotesBtn');
    const infoBtn = document.getElementById('generalNotesInfoBtn');
    
    if (viewDiv.style.display !== 'none') {
        // Switch to edit mode
        viewDiv.style.display = 'none';
        editDiv.style.display = 'flex';
        textarea.value = generalNotes;
        window.originalGeneralNotes = generalNotes; // Store original for comparison
        editBtn.textContent = 'View';
        editBtn.style.background = '#6c757d';
        saveBtn.style.display = 'block';
        if (infoBtn) infoBtn.style.display = 'flex';
    } else {
        // Attempt to switch to view mode (with unsaved changes check)
        attemptSwitchToViewMode();
    }
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
    editBtn.textContent = 'Edit';
    editBtn.style.background = '#007bff';
    saveBtn.style.display = 'none';
    if (infoBtn) infoBtn.style.display = 'none';
    renderGeneralNotes();
}

function saveGeneralNotes() {
    const textarea = document.getElementById('generalNotesTextarea');
    generalNotes = textarea.value;
    window.originalGeneralNotes = generalNotes;
    saveState();
}

window.attemptCloseGeneralNotesModal = function() {
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

window.showGeneralNotesInfoModal = function() {
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
window.closeGeneralNotesInfoModal = function() {
const modal = document.getElementById('generalNotesInfoModal');
if (modal) {
modal.classList.remove('active');
}
};

// Info button click handlers with fixed positioning
document.addEventListener("click", (e) => {
    // If clicking on info button, handle info display
    if (e.target.classList.contains("settings-info-btn")) {
        e.preventDefault();
        e.stopPropagation();
        
        // Close all info boxes first
        document.querySelectorAll(".info-box").forEach(box =>
            box.classList.remove("show")
        );
        
        // Open only the clicked one
        const infoBox = e.target.nextElementSibling;
        infoBox.classList.add("show");
        
        // Position the info box near the button
        const buttonRect = e.target.getBoundingClientRect();
        let top = buttonRect.top - infoBox.offsetHeight - 5;
        let left = buttonRect.right - infoBox.offsetWidth;
        
        // Adjust if goes off top of screen
        if (top < 10) {
            top = buttonRect.bottom + 5;
        }
        
        // Adjust if goes off left of screen
        if (left < 10) {
            left = 10;
        }
        
        // Adjust if goes off right of screen
        if (left + infoBox.offsetWidth > window.innerWidth - 10) {
            left = window.innerWidth - infoBox.offsetWidth - 10;
        }
        
        infoBox.style.top = top + 'px';
        infoBox.style.left = left + 'px';
        
        return;
    }
    
    // If clicking on info box itself, don't close it
    if (e.target.classList.contains("info-box") || e.target.closest(".info-box")) {
        e.stopPropagation();
            return;
}

// Close all info boxes when clicking elsewhere
document.querySelectorAll(".info-box").forEach(box =>
    box.classList.remove("show")
);
});

// Toast notification system
window.showToast = function(message, duration = 3000, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#c9ffd6ff' : type === 'error' ? '#ffd7dbff' : '#d1d1d1ff'};
        color: Black;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 100000;
        font-size: 0.95rem;
        font-weight: 500;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.style.opacity = '1', 10);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

// Confirmation modal
window.showConfirmation = function(message, onConfirm, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.cssText = 'z-index: 10001; display: flex; align-items: center; justify-content: center;';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; margin: 0;">
            <div class="modal-header" style="background: #f8f9fa;">
                <span class="modal-title">Confirm Action</span>
            </div>
            <div class="modal-body">
                <p style="margin: 0; font-size: 1rem; line-height: 1.6;">${message}</p>
                <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
                    <button id="confirmCancel" style="padding: 8px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Cancel</button>
                    <button id="confirmOk" style="padding: 8px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">OK</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    
    document.getElementById('confirmOk').onclick = () => {
        modal.remove();
        document.body.classList.remove('modal-open');
        if (onConfirm) onConfirm();
    };
    
    document.getElementById('confirmCancel').onclick = () => {
        modal.remove();
        document.body.classList.remove('modal-open');
        if (onCancel) onCancel();
    };
};

// Three-button confirmation modal (Save/Discard/Cancel)
window.showSaveDiscardConfirmation = function(message, onSave, onDiscard, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.cssText = 'z-index: 10001; display: flex; align-items: center; justify-content: center;';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; margin: 0;">
            <div class="modal-header" style="background: #f8f9fa;">
                <span class="modal-title">Unsaved Changes</span>
            </div>
            <div class="modal-body">
                <p style="margin: 0; font-size: 1rem; line-height: 1.6;">${message}</p>
                <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
                    <button id="confirmCancel" style="padding: 8px 20px; background: #bababaff; color: black; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Cancel</button>
                    <button id="confirmDiscard" style="padding: 8px 20px; background: #bababaff; color: black; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Discard</button>
                    <button id="confirmSave" style="padding: 8px 20px; background: #bababaff; color: black; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Save</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    
    document.getElementById('confirmSave').onclick = () => {
        modal.remove();
        document.body.classList.remove('modal-open');
        if (onSave) onSave();
    };
    
    document.getElementById('confirmDiscard').onclick = () => {
        modal.remove();
        document.body.classList.remove('modal-open');
        if (onDiscard) onDiscard();
    };
    
    document.getElementById('confirmCancel').onclick = () => {
        modal.remove();
        document.body.classList.remove('modal-open');
        if (onCancel) onCancel();
    };
};

// Profile Modal Functions
function openProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.style.display = 'block';
    
    // Update progress bars
    updateProfileStats();
    
    // Close the floating menu
    collapseProfileMenu();
    
    // Add click outside handler
    setTimeout(() => {
        const clickHandler = (e) => {
            const modalContent = modal.querySelector('.modal-content');
            if (!modalContent.contains(e.target)) {
                closeProfileModal();
                document.removeEventListener('mousedown', clickHandler);
                window.removeEventListener('scroll', scrollHandler, true);
            }
        };
        
        const scrollHandler = () => {
            closeProfileModal();
            document.removeEventListener('mousedown', clickHandler);
            window.removeEventListener('scroll', scrollHandler, true);
        };
        
        document.addEventListener('mousedown', clickHandler);
        window.addEventListener('scroll', scrollHandler, true);
    }, 100);
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateProfileStats() {
    const totalCases = data.length;
    const learnedCount = learnedCases.size;
    const learnedPercent = (learnedCount / totalCases) * 100;
    
    const totalProbability = data.reduce((sum, item) => sum + item.probability, 0);
    const learnedProbability = data
        .filter(item => learnedCases.has(item.name))
        .reduce((sum, item) => sum + item.probability, 0);
    
    const coverage = Math.round((learnedProbability / totalProbability) * 100 * 2) / 2;
    
    const x = learnedCount;
    const exp = Math.exp;
    const numerator = 1 / (1 + exp(-12 * ((x - 1) / 89 - 0.4170435672))) - 1 / (1 + exp(-12 * (0 - 0.4170435672)));
    const denominator = 1 / (1 + exp(-12 * (1 - 0.4170435672))) - 1 / (1 + exp(-12 * (0 - 0.4170435672)));
    const c = 80 + 14 * (numerator / denominator);
    const safety = coverage * c / 100 + 0.5 * (100 - coverage);
    
    // Update learned progress
    document.getElementById('profileLearnedProgress').style.width = learnedPercent + '%';
    document.getElementById('profileLearnedText').textContent = learnedCount + '/90';
    
    // Update coverage progress
    document.getElementById('profileCoverageProgress').style.width = coverage + '%';
    document.getElementById('profileCoverageText').textContent = coverage.toFixed(1) + '%';
    
    // Update safety progress
    document.getElementById('profileSafetyProgress').style.width = (Math.round(safety * 2) / 2) + '%';
    document.getElementById('profileSafetyText').textContent = (Math.round(safety * 2) / 2).toFixed(1) + '%';
}

// About Modal Functions
function openAboutModal() {
    const modal = document.getElementById('aboutModal');
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    pushModalState('aboutModal', closeAboutModal);
}

function closeAboutModal() {
    const modal = document.getElementById('aboutModal');
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
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
        backgroundColor: '#ffffff',
        hideInstructionButton: hideInstructions,
        instructionText1: 'Enter your scramble in the top input bar and press Analyze to trace parity using Kale\'s method.',
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
                <h2 style="margin: 0; font-size: 1.3rem; font-weight: 700; color: #2d3748;">Menu</h2>
                <button class="sidebar-close-btn" onclick="closeSidebar()" aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="sidebar-body">
                <button class="sidebar-item" onclick="openTrainingSelector(); closeSidebar();">
                    <img src="res/training.svg" alt="Trainer">
                    <span>Trainer</span>
                </button>
                <button class="sidebar-item" onclick="openNewParityAnalysis(''); closeSidebar();">
                    <img src="res/tracing.svg" alt="Parity Tracer">
                    <span>Parity Tracer</span>
                </button>
                <button class="sidebar-item" onclick="openSettingsModal(); closeSidebar();">
                    <img src="res/settings.svg" alt="Settings">
                    <span>Personalization</span>
                </button>
                <button class="sidebar-item sidebar-mobile-only" onclick="openProfileModal(); closeSidebar();">
                    <img src="res/avatar.svg" alt="Profile">
                    <span>Profile</span>
                </button>
                <button class="sidebar-item sidebar-mobile-only" onclick="openGeneralNotesModal(); closeSidebar();">
                    <img src="res/notes.svg" alt="Notes">
                    <span>Notes</span>
                </button>
                <div class="sidebar-divider sidebar-mobile-only"></div>
                <div style="padding: 0;">
                    <div id="presetExpandBtn" onclick="togglePresetExpand()" style="padding: 14px 20px; background: transparent; border: none; width: 100%; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='transparent'">
                        <div style="display: flex; flex-direction: column; align-items: flex-start;">
<span style="font-size: 0.8rem; color: #6c757d; font-weight: 500;">Preset</span>
<span id="currentPresetName" style="font-size: 0.95rem; color: #2d3748; font-weight: 600;"></span>
</div>
<svg id="presetExpandIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; transition: transform 0.3s;">
<polyline points="6 9 12 15 18 9"></polyline>
</svg>
</div>
<div id="presetOptions" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease;"></div>
</div>
                <button class="sidebar-item instruction-btn" onclick="showHomepageInfoModal(); closeSidebar();">
                    <img src="res/info.svg" alt="Instructions">
                    <span>Instructions</span>
                </button>
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
    if (hideInstructions) {
        const instructionBtn = sidebar.querySelector('.instruction-btn');
        if (instructionBtn) instructionBtn.style.display = 'none';
    }
    
    // Initialize preset selector
    initializePresetSelector();
}

function initializePresetSelector() {
    const currentPresetName = document.getElementById('currentPresetName');
    const presetOptions = document.getElementById('presetOptions');
    
    if (!currentPresetName || !presetOptions) return;
    
    // Set current preset name
    currentPresetName.textContent = currentPreset.replace(/_/g, ' ').replace(/'/g, "'");
    
    // Populate preset options
    let optionsHTML = '';
    for (const presetName in window.PRESET_CONFIG) {
        const displayName = presetName.replace(/_/g, ' ').replace(/'/g, "'");
        const isActive = presetName === currentPreset;
        optionsHTML += `
            <div onclick="handlePresetChange('${presetName}')" style="padding: 12px 20px; cursor: pointer; background: ${isActive ? '#e3f2fd' : 'transparent'}; color: ${isActive ? '#007bff' : '#2d3748'}; font-weight: ${isActive ? '600' : '500'}; font-size: 0.9rem; transition: background 0.2s;" onmouseover="if (!${isActive}) this.style.background='#f8f9fa'" onmouseout="if (!${isActive}) this.style.background='transparent'">
                ${displayName}
            </div>
        `;
    }
    presetOptions.innerHTML = optionsHTML;
}

window.togglePresetExpand = function() {
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

window.toggleSidebar = function() {
    generateSidebarHTML();
    const sidebar = document.getElementById('appSidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
        if (sidebar.classList.contains('active')) {
            document.body.classList.add('sidebar-open');
        } else {
            document.body.classList.remove('sidebar-open');
        }
    }
};

window.closeSidebar = function() {
    const sidebar = document.getElementById('appSidebar');
    if (sidebar) {
        sidebar.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    }
};

// Quick info popup function
window.showQuickInfo = function(message) {
    // Remove any existing quick info
    const existing = document.getElementById('quickInfoPopup');
    if (existing) existing.remove();
    
    const popup = document.createElement('div');
    popup.id = 'quickInfoPopup';
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    popup.innerHTML = `
        <div style="background: white; padding: 24px; border-radius: 12px; max-width: 500px; width: 100%; box-shadow: 0 8px 24px rgba(0,0,0,0.3);">
            <div style="font-size: 1rem; line-height: 1.6; color: #333;">${message}</div>
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="document.getElementById('quickInfoPopup').remove()" style="padding: 10px 24px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem;">Got it</button>
            </div>
        </div>
    `;
    
    // Close on background click
    popup.onclick = (e) => {
        if (e.target === popup) {
            popup.remove();
        }
    };
    
    // Close on Escape key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            popup.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    document.body.appendChild(popup);
};
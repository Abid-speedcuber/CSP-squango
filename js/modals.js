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
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="modal-title" style="font-size: 1.5rem; font-weight: 700; color: #2d3748;">Personalization</span>
                        <button onclick="showSettingsInfoModal()" class="settings-info-btn" style="background: #f8f9fa; border: 1px solid #dee2e6; color: #495057; cursor: pointer; padding: 6px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; width: 32px; height: 32px;" title="Personalization Guide" onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='#f8f9fa'">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </button>
                    </div>
                    <button class="close-btn" onclick="closeSettingsModal()" style="color: #6c757d; opacity: 1;">&times;</button>
                </div>
                <div class="modal-body" style="overflow-y: auto; flex: 1; padding: 24px 28px; background: white;">
                    
                    <!-- Basic Personalization Section -->
                    <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 16px 0; font-size: 1rem; color: #2d3748; font-weight: 700;">Basic Personalization</h3>
                        
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                            <label for="hintToggle" style="color: #495057; font-weight: 500; font-size: 0.95rem;">Show Tracing Guides</label>
                            <input type="checkbox" id="hintToggle" onchange="toggleHints(this.checked)" style="transform: scale(1.3); cursor: pointer;">
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                            <label for="hideInstructionsToggle" style="color: #495057; font-weight: 500; font-size: 0.95rem;">Hide Instruction Buttons</label>
                            <input type="checkbox" id="hideInstructionsToggle" onchange="toggleHideInstructions(this.checked)" style="transform: scale(1.3); cursor: pointer;">
                        </div>
                        
                        <div style="border-top: 1px solid #e9ecef; margin: 16px 0; padding-top: 16px;">
                            <button onclick="openColorSchemeModal()" style="padding: 12px 20px; background: white; color: #2d3748; border: 1px solid #dee2e6; border-radius: 10px; cursor: pointer; width: 100%; margin-bottom: 10px; font-weight: 600; font-size: 0.95rem; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.1)'; this.style.borderColor='#adb5bd'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'; this.style.borderColor='#dee2e6'">Color Scheme Settings</button>
                            <button onclick="openParityTracingPersonalization()" style="padding: 12px 20px; background: white; color: #2d3748; border: 1px solid #dee2e6; border-radius: 10px; cursor: pointer; width: 100%; font-weight: 600; font-size: 0.95rem; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.1)'; this.style.borderColor='#adb5bd'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'; this.style.borderColor='#dee2e6'">Parity Tracing Personalization</button>
                        </div>
                    </div>

                    <!-- Advanced Personalization Section -->
                    <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px; padding: 20px;">
                        <h3 style="margin: 0 0 16px 0; font-size: 1rem; color: #2d3748; font-weight: 700;">Advanced Personalization</h3>
                        
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                            <label for="allowCaseEditToggle" style="color: #495057; font-weight: 500; font-size: 0.95rem;">Allow Case Edits</label>
                            <input type="checkbox" id="allowCaseEditToggle" onchange="toggleAllowCaseEdit(this.checked)" style="transform: scale(1.3); cursor: pointer;">
                        </div>
                        
                        <div style="border-top: 1px solid #e9ecef; margin: 16px 0; padding-top: 16px;">
                            <button onclick="openCustomizeSVGsModal()" style="padding: 12px 20px; background: white; color: #2d3748; border: 1px solid #dee2e6; border-radius: 10px; cursor: pointer; width: 100%; margin-bottom: 10px; font-weight: 600; font-size: 0.95rem; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.1)'; this.style.borderColor='#adb5bd'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'; this.style.borderColor='#dee2e6'">Customize Tracing Guides</button>
                            <button onclick="openQuickEditModal()" style="padding: 12px 20px; background: white; color: #2d3748; border: 1px solid #dee2e6; border-radius: 10px; cursor: pointer; width: 100%; font-weight: 600; font-size: 0.95rem; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.1)'; this.style.borderColor='#adb5bd'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'; this.style.borderColor='#dee2e6'">Quick Edit</button>
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
                    <div style="margin-bottom: 20px; margin-top: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">Scramble Image Size: <span id="sizeValue">200</span>px</label>
                        <input type="range" id="imageSizeSlider" min="100" max="400" step="10" value="200" style="width: 100%; cursor: pointer;" oninput="updateImageSizePreview(this.value)">
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #666; margin-top: 5px;">
                            <span>Small (100px)</span>
                            <span>Large (400px)</span>
                        </div>
                    </div>
                    <div style="margin-top: 20px; text-align: center;">
                        <button onclick="saveColorScheme()" style="padding: 10px 30px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; font-weight: 600;">Save Color Scheme</button>
                        <button onclick="resetColorScheme()" style="padding: 10px 30px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; font-weight: 600; margin-left: 10px;">Reset to Default</button>
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
                    
                    <!-- Data Management -->
                    <div style="padding: 0 15px 15px; border-top: 1px solid #e9ecef; padding-top: 15px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                            <button onclick="exportData(); closeProfileModal();" style="padding: 8px; background: #f8f9fa; color: #2d3748; border: 1px solid #dee2e6; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='#f8f9fa'">Export</button>
                            <label style="padding: 8px; background: #f8f9fa; color: #2d3748; border: 1px solid #dee2e6; border-radius: 6px; cursor: pointer; text-align: center; font-size: 0.8rem; font-weight: 600; margin: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='#f8f9fa'">
                                Import
                                <input type="file" id="profileImportFile" accept=".json" style="display: none;" onchange="handleFileImport(this.files[0]); closeProfileModal();">
                            </label>
                        </div>
                        <button onclick="openAboutModal(); closeProfileModal();" style="padding: 8px 16px; background: #f8f9fa; color: #2d3748; border: 1px solid #dee2e6; border-radius: 6px; cursor: pointer; width: 100%; font-weight: 600; font-size: 0.85rem; transition: all 0.2s;" onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='#f8f9fa'">About</button>
                    </div>
                </div>
            </div>
        </div>

        <div id="aboutModal" class="modal">
            <div class="modal-content" style="max-width: 650px; margin-top: 60px; border-radius: 12px; overflow: hidden;">
                <div class="modal-header" style="background: #2d3748; color: white; padding: 20px 25px;">
                    <span class="modal-title" style="font-size: 1.4rem; font-weight: 600;">About SquanGo CSP</span>
                    <button class="close-btn" onclick="closeAboutModal()" style="color: white; opacity: 0.9;">&times;</button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto; background: #fafafa; padding: 25px 30px; color: #2d3748; line-height: 1.6;">
                    
                    <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <p style="margin: 0 0 8px 0; font-weight: 600; color: #495057;">Developer</p>
                        <p style="margin: 0 0 12px 0; font-size: 0.95rem; color: #6c757d;">Created by <strong>Abid Ibn Ashraf</strong></p>
                        <a href="mailto:abidashrafkhulna@gmail.com?subject=%5BSquare-1%20Parity%20App%5D%20General%20Inquiry&body=Hey!%0D%0A%0D%0AI%20wanted%20to%20reach%20out%20about%20the%20Square-1%20Parity%20app.%0D%0A" 
                          style="display: inline-block; background: #6c757d; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-weight: 500; font-size: 0.9rem; transition: background 0.2s;" 
                          onmouseover="this.style.background='#5a6268'" 
                          onmouseout="this.style.background='#6c757d'">Contact Me</a>
                    </div>

                    <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <p style="margin: 0 0 8px 0; font-weight: 600; color: #495057;">How This Was Built</p>
                        <p style="margin: 0; font-size: 0.95rem; color: #6c757d;">Full transparency: this app is built almost entirely with AI. I probably manually wrote like 60 lines of code myself. The AI I mainly used was Claude Sonnet 4.5 and a bit of ChatGPT o1. Turns out with enough willpower, you can build pretty much anything with AI these days.</p>
                    </div>

                    <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <p style="margin: 0 0 8px 0; font-weight: 600; color: #495057;">Main Credit</p>
                        <p style="margin: 0 0 12px 0; font-size: 0.95rem; color: #6c757d;">Most of the credit goes to <strong>Eva Kato (Hashtag Cuber)</strong> and her CSP website. This started as a personal tool to keep me motivated while learning CSP, so I borrowed the layout and algorithm data from her GitHub repo. When I realized the community might find it useful, I reached out to Eva and she was super chill about letting me publish it. Big W for Hashtag Cuber.</p>
                        <a href="https://hashtagcuber.com/csp/" target="_blank" style="color: #007bff; text-decoration: none; font-weight: 500; font-size: 0.95rem;">Check out her CSP website →</a>
                    </div>

                    <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <p style="margin: 0 0 8px 0; font-weight: 600; color: #495057;">Scramble Generator</p>
                        <p style="margin: 0 0 12px 0; font-size: 0.95rem; color: #6c757d;">The Square-1 scramble generator code is from csTimer's GitHub, written by Shuang Chen (cs0x7f) under GPL-3.0 license.</p>
                        <a href="https://github.com/cs0x7f/cstimer/blob/master/src/js/scramble/scramble_sq1_new.js" target="_blank" style="color: #007bff; text-decoration: none; font-weight: 500; font-size: 0.95rem;">View the code on GitHub →</a>
                    </div>

                    <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <p style="margin: 0 0 8px 0; font-weight: 600; color: #495057;">Feedback & Bug Reports</p>
                        <p style="margin: 0 0 12px 0; font-size: 0.95rem; color: #6c757d;">If you have suggestions for new features or have encountered any issues such as bugs, incorrect algorithms, or mislabeled cases, please report them via email.</p>
                        <a href="mailto:abidashrafkhulna@gmail.com?subject=%5BSquare-1%20Parity%20App%5D%20Feedback%20or%20Bug%20Report&body=Hello,%0D%0A%0D%0AI%20would%20like%20to%20report%20the%20following:%0D%0A%0D%0A---%0D%0A(Please%20describe%20your%20suggestion%20or%20issue%20here)%0D%0A%0D%0AApp%20Version:%20v1.0%0D%0ADevice/Browser:%20" 
                          style="display: inline-block; background: #6c757d; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-weight: 500; font-size: 0.9rem; transition: background 0.2s;" 
                          onmouseover="this.style.background='#5a6268'" 
                          onmouseout="this.style.background='#6c757d'">Send Feedback</a>
                    </div>

                    <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px;">
                        <p style="margin: 0 0 8px 0; font-weight: 600; color: #495057;">Open Source</p>
                        <p style="margin: 0 0 12px 0; font-size: 0.95rem; color: #6c757d;">This application is open source. You can view the code, suggest improvements, or create your own modified version.</p>
                        <a href="https://github.com/Abid-speedcuber/sq1-csparity-algs" target="_blank" style="color: #007bff; text-decoration: none; font-weight: 500; font-size: 0.95rem;">View on GitHub →</a>
                    </div>

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
const allowCaseEditToggle = document.getElementById('allowCaseEditToggle');
if (allowCaseEditToggle) allowCaseEditToggle.checked = allowCaseEdit;

pushModalState('settingsModal', closeSettingsModal);
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

function toggleAllowCaseEdit(isChecked) {
    window.allowCaseEdit = isChecked;
    localStorage.setItem('allowCaseEdit', isChecked.toString());
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
    
    // Set image size slider value
    const slider = document.getElementById('imageSizeSlider');
    if (slider) {
        slider.value = scrambleImageSize;
        document.getElementById('sizeValue').textContent = scrambleImageSize;
    }
    
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
}

function saveColorScheme() {
    saveState();
    closeColorSchemeModal();
    
    // Recalculate parity with new color scheme
    if (needsParityRecalculation()) {
        calculateAndCacheAllParity();
        render();
    }
    
    showToast('Color scheme and image size saved!', 3000, 'success');
}

function resetColorScheme() {
    colorScheme = {
        topColor: '#000000',
        bottomColor: '#FFFFFF',
        frontColor: '#CC0000',
        rightColor: '#00AA00',
        backColor: '#FF8C00',
        leftColor: '#0066CC',
        dividerColor: '#7a0000',
        circleColor: 'transparent'
    };
    scrambleImageSize = 200;
    saveState();
    openColorSchemeModal(); // Refresh the modal to show updated selection
    showToast('Color scheme reset to default!', 3000, 'success');
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
    
    const customName = perCaseCustomNames.get(caseName) || '';
    
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
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="modal-title" id="editCaseTitle">${getDisplayName(caseName)}</span>
                    <button onclick="openCaseRenameModal('${caseName.replace(/'/g, "\\'")}', '${customName.replace(/'/g, "\\'")}' )" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center;">
                        <img src="res/pen.svg" style="width: 20px; height: 20px;" alt="Edit name">
                    </button>
                </div>
                ${perCaseSubtitles.has(caseName) ? `<div style="font-size: 0.85rem; color: #888; margin-top: 4px;">${perCaseSubtitles.get(caseName)}</div>` : ''}
                <button class="close-btn" onclick="closeEditCaseModal()">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #666;">Case Subtitle (optional):</label>
                    <input type="text" id="caseSubtitleInput" value="${perCaseSubtitles.get(caseName) || ''}" placeholder="Enter a subtitle for this case" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem; margin-bottom: 15px;">
                </div>
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
                updateParityLabel(input);
            });
            
            input.addEventListener('input', () => {
                // Clear timeout if exists
                if (input.parityTimeout) {
                    clearTimeout(input.parityTimeout);
                }
                // Update after a short delay if not focused
                input.parityTimeout = setTimeout(() => {
                    if (document.activeElement !== input) {
                        updateParityLabel(input);
                    }
                }, 300);
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
        return;
    }
    
    if (typeof window.Square1ParityAnalyzerLibraryWithSillyNames === 'undefined') {
        parityLabel.textContent = '';
        return;
    }
    
    try {
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
        parityLabel.style.color = parityText === 'Odd' ? '#dc3545' : '#28a745';
        parityLabel.style.fontWeight = '600';
    } catch (error) {
        parityLabel.textContent = '';
        console.error('Parity calculation error:', error);
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
        <button onclick="this.parentElement.remove()" style="padding: 6px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
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
    
    input.focus();
};

// Function to open case rename modal
window.openCaseRenameModal = function(caseName, currentName) {
    const renameModal = document.createElement('div');
    renameModal.className = 'modal active';
    renameModal.id = 'caseRenameModal';
    renameModal.style.zIndex = '10002';
    renameModal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; margin-top: 100px;">
            <div class="modal-header">
                <span class="modal-title">Rename Case</span>
                <button class="close-btn" onclick="closeCaseRenameModal()">&times;</button>
            </div>
            <div class="modal-body">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Custom Name:</label>
                <input type="text" id="caseRenameInput" value="${currentName}" placeholder="Leave empty for default name" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="saveCaseRename('${caseName.replace(/'/g, "\\'")}' )" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: 600;">Save</button>
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

window.saveCaseRename = function(caseName) {
    const input = document.getElementById('caseRenameInput');
    if (!input) return;
    
    const newName = input.value.trim();
    if (newName) {
        displayNames[caseName] = newName;
    } else {
        // Restore to default
        displayNames[caseName] = defaultDisplayNames[caseName] || caseName;
    }
    
    saveState();
    
    // Update the title in edit modal
    const titleElement = document.getElementById('editCaseTitle');
    if (titleElement) {
        titleElement.textContent = getDisplayName(caseName);
    }
    
    closeCaseRenameModal();
    showToast('Case name updated!', 2000, 'success');
};

function closeEditCaseModal() {
    const modal = document.getElementById('editCaseModal');
    if (modal) {
        modal.remove();
        document.body.classList.remove('modal-open');
    }
}

function saveEditedCase(caseName, originalName) {
    // Save subtitle
    const subtitleInput = document.getElementById('caseSubtitleInput');
    if (subtitleInput) {
        const subtitle = subtitleInput.value.trim();
        if (subtitle) {
            perCaseSubtitles.set(caseName, subtitle);
        } else {
            perCaseSubtitles.delete(caseName);
        }
    }
    
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
    
    // Close any existing context menu
    const existingMenu = document.getElementById('caseContextMenu');
    if (existingMenu) existingMenu.remove();
    
    pushModalState('notesModal', closeNotesModal);
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'notesModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; margin-top: 50px;">
            <div class="modal-header">
                <span class="modal-title">Notes: ${getDisplayName(caseName)}</span>
                <button class="close-btn" onclick="closeNotesModal()">&times;</button>
            </div>
            <div class="modal-body">
                <textarea id="notesTextarea" style="width: 100%; height: 150px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; resize: vertical;">${comment}</textarea>
                <div style="text-align: center; margin-top: 15px;">
                    <button onclick="saveNotes('${caseName.replace(/'/g, "\\'")}' )" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: 600;">Save</button>
                    <button onclick="closeNotesModal()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
}

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
        <div class="modal-content" style="max-width: 900px; max-height: 90vh; margin-top: 30px; display: flex; flex-direction: column;">
            <div class="modal-header" style="flex-shrink: 0;">
                <span class="modal-title">General Notes</span>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button id="editGeneralNotesBtn" onclick="toggleEditGeneralNotes()" style="padding: 6px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">Edit</button>
                    <button class="close-btn" onclick="closeGeneralNotesModal()">&times;</button>
                </div>
            </div>
            <div class="modal-body" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column;">
                <div id="generalNotesView" style="flex: 1; padding: 15px; border: 1px solid #ddd; border-radius: 4px; background: #fafafa; min-height: 400px; overflow: auto;"></div>
                <div id="generalNotesEdit" style="flex: 1; display: none; flex-direction: column;">
                    <div style="margin-bottom: 10px; padding: 10px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; font-size: 0.9rem; color: #856404;">
                        <strong>⚠️ Warning:</strong> This editor supports HTML, CSS, SVG, and JavaScript. Code will execute when you save and view. Use with caution!
                    </div>
                    <textarea id="generalNotesTextarea" style="flex: 1; width: 100%; min-height: 400px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 0.9rem; resize: vertical;"></textarea>
                    <div style="text-align: center; margin-top: 15px;">
                        <button onclick="saveGeneralNotes()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: 600;">Save</button>
                        <button onclick="cancelEditGeneralNotes()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                    </div>
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
    
    if (viewDiv.style.display !== 'none') {
        // Switch to edit mode
        viewDiv.style.display = 'none';
        editDiv.style.display = 'flex';
        textarea.value = generalNotes;
        editBtn.textContent = 'View';
        editBtn.style.background = '#6c757d';
    } else {
        // Switch to view mode
        viewDiv.style.display = 'block';
        editDiv.style.display = 'none';
        editBtn.textContent = 'Edit';
        editBtn.style.background = '#007bff';
        renderGeneralNotes();
    }
}

function saveGeneralNotes() {
    const textarea = document.getElementById('generalNotesTextarea');
    generalNotes = textarea.value;
    saveState();
    toggleEditGeneralNotes(); // Switch back to view mode
}

function cancelEditGeneralNotes() {
    toggleEditGeneralNotes(); // Just switch back to view mode without saving
}

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
                    <button id="confirmCancel" style="padding: 8px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Cancel</button>
                    <button id="confirmDiscard" style="padding: 8px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Discard</button>
                    <button id="confirmSave" style="padding: 8px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Save</button>
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
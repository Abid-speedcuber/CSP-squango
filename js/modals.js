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
            <div class="modal-content" style="max-width: 450px; margin-top: 50px; max-height: 85vh; display: flex; flex-direction: column; border-radius: 12px; overflow: hidden;">
                <div class="modal-header" style="flex-shrink: 0; background: #2d3748; color: white; padding: 20px 25px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="modal-title" style="font-size: 1.6rem; font-weight: 700; color: white;">Settings</span>
                        <button onclick="showSettingsInfoModal()" class="settings-info-btn" style="background: rgba(255, 255, 255, 0.15); border: none; color: white; cursor: pointer; padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; width: 32px; height: 32px;" title="Settings Guide">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </button>
                    </div>
                    <button class="close-btn" onclick="closeSettingsModal()" style="color: white; opacity: 0.9;">&times;</button>
                </div>
                <div class="modal-body" style="overflow-y: auto; flex: 1; padding: 25px; background: #fafafa;">
                    
                    <!-- Display Options Section -->
                    <div style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <h3 style="margin: 0 0 18px 0; font-size: 1.1rem; color: #2d3748; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Display Options</h3>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding: 10px 0;">
                            <label for="hintToggle" style="color: #4a5568; font-weight: 500;">Show Tracing Guides</label>
                            <input type="checkbox" id="hintToggle" onchange="toggleHints(this.checked)" style="transform: scale(1.4); cursor: pointer;">
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0;">
                            <label for="hideInstructionsToggle" style="color: #4a5568; font-weight: 500;">Hide Instruction Buttons</label>
                            <input type="checkbox" id="hideInstructionsToggle" onchange="toggleHideInstructions(this.checked)" style="transform: scale(1.4); cursor: pointer;">
                        </div>
                    </div>

                    <!-- Customization Section -->
                    <div style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <h3 style="margin: 0 0 18px 0; font-size: 1.1rem; color: #2d3748; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Customization</h3>
                        <button onclick="openColorSchemeModal()" style="padding: 12px 20px; background: #4a5568; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%; margin-bottom: 12px; font-weight: 600; font-size: 1rem; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 8px rgba(74, 85, 104, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(74, 85, 104, 0.4)'; this.style.background='#2d3748'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(74, 85, 104, 0.3)'; this.style.background='#4a5568'">Color Scheme Settings</button>
                        <button onclick="openCaseNameModal()" style="padding: 12px 20px; background: #4a5568; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%; margin-bottom: 12px; font-weight: 600; font-size: 1rem; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 8px rgba(74, 85, 104, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(74, 85, 104, 0.4)'; this.style.background='#2d3748'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(74, 85, 104, 0.3)'; this.style.background='#4a5568'">Case Name Settings</button>
                        <button onclick="openCustomizeSVGsModal()" style="padding: 12px 20px; background: #4a5568; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%; font-weight: 600; font-size: 1rem; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 8px rgba(74, 85, 104, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(74, 85, 104, 0.4)'; this.style.background='#2d3748'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(74, 85, 104, 0.3)'; this.style.background='#4a5568'">Customize Tracing Guides</button>
                    </div>

                    <!-- Data Management Section -->
                    <div style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <h3 style="margin: 0 0 18px 0; font-size: 1.1rem; color: #2d3748; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Data Management</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <button onclick="exportData()" style="padding: 12px 16px; background: #4a5568; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 8px rgba(74, 85, 104, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(74, 85, 104, 0.4)'; this.style.background='#2d3748'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(74, 85, 104, 0.3)'; this.style.background='#4a5568'">Export Data</button>
                            <label style="padding: 12px 16px; background: #4a5568; color: white; border-radius: 8px; cursor: pointer; text-align: center; font-size: 0.95rem; font-weight: 600; margin: 0; display: flex; align-items: center; justify-content: center; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 8px rgba(74, 85, 104, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(74, 85, 104, 0.4)'; this.style.background='#2d3748'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(74, 85, 104, 0.3)'; this.style.background='#4a5568'">
                                Import Data
                                <input type="file" id="importFile" accept=".json" style="display: none;" onchange="handleFileImport(this.files[0])">
                            </label>
                        </div>
                    </div>

                    <!-- About Section -->
                    <div style="background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <h3 style="margin: 0 0 18px 0; font-size: 1.1rem; color: #2d3748; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">About</h3>
                        <button onclick="openSuggestModal()" style="padding: 12px 20px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%; margin-bottom: 12px; font-weight: 600; font-size: 1rem; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(108, 117, 125, 0.4)'; this.style.background='#5a6268'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(108, 117, 125, 0.3)'; this.style.background='#6c757d'">Suggest Updates / Report Bugs</button>
                        <button onclick="openConfessionModal()" style="padding: 12px 20px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%; font-weight: 600; font-size: 1rem; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(108, 117, 125, 0.4)'; this.style.background='#5a6268'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(108, 117, 125, 0.3)'; this.style.background='#6c757d'">Confession and credits</button>
                    </div>

                </div>
            </div>
        </div>

        <div id="caseNameModal" class="modal">
            <div class="modal-content" style="max-width: 800px; margin-top: 50px;">
                <div class="modal-header">
                    <span class="modal-title">Case Name Settings</span>
                    <button class="close-btn" onclick="closeCaseNameModal()">&times;</button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <div style="margin-bottom: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px; border: 2px solid #007bff;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                            <label for="shortLRToggle" style="font-weight: 600; color: #2d3748;">Show short version of Left/Right (L. /R. ):</label>
                            <input type="checkbox" id="shortLRToggle" onchange="toggleShortLR(this.checked)" style="transform: scale(1.3); cursor: pointer;">
                        </div>
                        <div style="border-top: 1px solid #cbd5e0; padding-top: 12px;">
                            <div style="font-weight: 600; color: #2d3748; margin-bottom: 8px;">Position of Left/Right prefix:</div>
                            <div style="display: flex; gap: 15px;">
                                <div style="display: flex; align-items: center; gap: 5px;">
                                    <input type="radio" id="lrPositionFront" name="lrPosition" value="front" onchange="setLRPosition('front')" checked style="cursor: pointer;">
                                    <label for="lrPositionFront" style="cursor: pointer;">On Front (Left 4-2)</label>
                                </div>
                                <div style="display: flex; align-items: center; gap: 5px;">
                                    <input type="radio" id="lrPositionBack" name="lrPosition" value="back" onchange="setLRPosition('back')" style="cursor: pointer;">
                                    <label for="lrPositionBack" style="cursor: pointer;">On Back (4-2 Left)</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="caseNameSettingsContainer" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;"></div>
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

        <div id="suggestModal" class="modal">
          <div class="modal-content" style="max-width: 650px; margin-top: 60px; border-radius: 12px; overflow: hidden;">
            <div class="modal-header" style="background: #6c757d; color: white; padding: 20px 25px;">
              <span class="modal-title" style="font-size: 1.4rem; font-weight: 600;">Feedback & Bug Reports</span>
              <button class="close-btn" onclick="closeSuggestModal()" style="color: white; opacity: 0.9;">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto; background: #fafafa; padding: 25px 30px; color: #2d3748; line-height: 1.6;">
              <p style="font-size: 1rem; margin-bottom: 20px;">If you have suggestions for new features or have encountered any issues such as bugs, incorrect algorithms, or mislabeled cases, please report them via email.</p>
              
              <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 12px 0; font-weight: 500; color: #495057;">Contact Information:</p>
                <a href="mailto:abidashrafkhulna@gmail.com?subject=%5BSquare-1%20Parity%20App%5D%20Feedback%20or%20Bug%20Report&body=Hello,%0D%0A%0D%0AI%20would%20like%20to%20report%20the%20following:%0D%0A%0D%0A---%0D%0A(Please%20describe%20your%20suggestion%20or%20issue%20here)%0D%0A%0D%0AApp%20Version:%20v1.0%0D%0ADevice/Browser:%20" 
                  style="display: inline-block; background: #6c757d; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 0.95rem; transition: background 0.2s;" 
                  onmouseover="this.style.background='#5a6268'" 
                  onmouseout="this.style.background='#6c757d'">Send Email</a>
              </div>
              
              <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px;">
                <p style="margin: 0 0 8px 0; font-weight: 500; color: #495057;">Open Source</p>
                <p style="margin: 0 0 12px 0; font-size: 0.95rem; color: #6c757d;">This application is open source. You can view the code, suggest improvements, or create your own modified version.</p>
                <a href="https://github.com/Abid-speedcuber/sq1-csparity-algs" target="_blank" style="color: #007bff; text-decoration: none; font-weight: 500; font-size: 0.95rem;">View on GitHub →</a>
              </div>
            </div>
          </div>
        </div>

<div id="confessionModal" class="modal">
  <div class="modal-content" style="max-width: 650px; margin-top: 60px; border-radius: 12px; overflow: hidden;">
    <div class="modal-header" style="background: #6c757d; color: white; padding: 20px 25px;">
      <span class="modal-title" style="font-size: 1.4rem; font-weight: 600;">Credits & Acknowledgments</span>
      <button class="close-btn" onclick="closeConfessionModal()" style="color: white; opacity: 0.9;">&times;</button>
    </div>
    <div class="modal-body" style="max-height: 70vh; overflow-y: auto; background: #fafafa; padding: 25px 30px; color: #2d3748; line-height: 1.6;">
      
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

      <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px;">
        <p style="margin: 0 0 8px 0; font-weight: 500; color: #495057;">Get in Touch</p>
        <p style="margin: 0 0 12px 0; font-size: 0.95rem; color: #6c757d;">Feel free to reach out if you want to discuss the app or share feedback:</p>
        <a href="mailto:abidashrafkhulna@gmail.com?subject=%5BSquare-1%20Parity%20App%5D%20General%20Inquiry&body=Hey!%0D%0A%0D%0AI%20wanted%20to%20reach%20out%20about%20the%20Square-1%20Parity%20app.%0D%0A" 
          style="display: inline-block; background: #6c757d; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 0.95rem; transition: background 0.2s;" 
          onmouseover="this.style.background='#5a6268'" 
          onmouseout="this.style.background='#6c757d'">Send Email</a>
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
║                               CASE NAME MODAL                              ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

function openCaseNameModal() {
    const caseNameModal = document.getElementById('caseNameModal');
    if (!caseNameModal) return;
    
    caseNameModal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    const shortLRToggle = document.getElementById('shortLRToggle');
    if (shortLRToggle) shortLRToggle.checked = useShortLR;
    
    const lrPositionFront = document.getElementById('lrPositionFront');
    if (lrPositionFront) lrPositionFront.checked = (lrPosition === 'front');
    
    const lrPositionBack = document.getElementById('lrPositionBack');
    if (lrPositionBack) lrPositionBack.checked = (lrPosition === 'back');
    populateCaseNameSettings();
    
    pushModalState('caseNameModal', closeCaseNameModal);
}

function closeCaseNameModal() {
    const caseNameModal = document.getElementById('caseNameModal');
    if (!caseNameModal) return;
    caseNameModal.style.display = 'none';
    document.body.classList.remove('modal-open');
}

function populateCaseNameSettings() {
    const container = document.getElementById('caseNameSettingsContainer');
    container.innerHTML = '';

    for (const shape of baseShapes) {
        const config = shapeAliases[shape];
        if (!config) continue;

        let defaultSetting = shape;
        if (shape === "Paired Edges") defaultSetting = "Pair";
        else if (shape === "Perpendicular Edges") defaultSetting = "L-Shape";
        else if (shape === "Parallel Edges") defaultSetting = "Line";
        const currentSetting = caseNameSettings.get(shape) || defaultSetting;
        const currentCustom = customCaseNames.get(shape) || '';
        const hasLR = shapesWithLR.includes(shape);
        const isSwapped = swapShapeLR.get(shape) || false;

        let radiosHTML = '';
        for (const option of config.options) {
            const id = `name-${shape}-${option}`.replace(/\s/g, '-');
            const checked = (currentSetting === option) ? 'checked' : '';
            radiosHTML += `
                <div style="display: flex; align-items: center; gap: 5px;">
                    <input type="radio" id="${id}" name="name-${shape}" value="${option}" ${checked} onclick="updateCaseNameSetting('${shape}', '${option}')">
                    <label for="${id}" style="cursor: pointer;">${option}</label>
                </div>
            `;
        }

        // Add the "Custom" radio
        const customId = `name-${shape}-Custom`;
        const customChecked = (currentSetting === 'Custom') ? 'checked' : '';
        const customInputId = `custom-name-${shape}`;
        radiosHTML += `
            <div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
                <input type="radio" id="${customId}" name="name-${shape}" value="Custom" ${customChecked} onclick="updateCaseNameSetting('${shape}', 'Custom')">
                <label for="${customId}" style="cursor: pointer;">Custom:</label>
                <input type="text" id="${customInputId}" value="${currentCustom}" oninput="updateCustomCaseName('${shape}', this.value)" style="width: 100px; padding: 3px 5px; font-size: 0.9rem; border: 1px solid #ccc; border-radius: 3px;">
            </div>
        `;

        // Add L/R swap toggle if applicable
        let swapHTML = '';
        if (hasLR) {
            swapHTML = `
                <div style="display: flex; align-items: center; gap: 5px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                    <input type="checkbox" id="swap-${shape}" ${isSwapped ? 'checked' : ''} onchange="toggleShapeSwapLR('${shape}', this.checked)" style="transform: scale(1.2); cursor: pointer;">
                    <label for="swap-${shape}" style="cursor: pointer; font-size: 0.9rem;">Swap Left/Right</label>
                </div>
            `;
        }

        const settingHTML = `
            <div style="border: 1px solid #eee; padding: 10px; border-radius: 5px; background: #fcfcfc;">
                <strong style="color: #007bff; margin-bottom: 8px; display: block; border-bottom: 1px solid #eee; padding-bottom: 5px;">${shape}</strong>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    ${radiosHTML}
                    ${swapHTML}
                </div>
            </div>
        `;
        container.innerHTML += settingHTML;
    }
}

function updateCaseNameSetting(shape, value) {
    caseNameSettings.set(shape, value);
    saveState();
    render(); // Re-render cards with new names
}

function updateCustomCaseName(shape, value) {
    customCaseNames.set(shape, value.trim());
    // Also ensure the 'Custom' radio is selected if they type
    caseNameSettings.set(shape, 'Custom');
    const customRadio = document.getElementById(`name-${shape}-Custom`);
    if (customRadio) customRadio.checked = true;
    saveState();
    render(); // Re-render cards with new names
}

function toggleShapeSwapLR(shape, isChecked) {
    if (isChecked) {
        swapShapeLR.set(shape, true);
    } else {
        swapShapeLR.delete(shape);
    }
    saveState();
    render(); // Re-render cards with new names
}

function toggleShortLR(isChecked) {
    useShortLR = isChecked;
    saveState();
    render();
}

function setLRPosition(position) {
    lrPosition = position;
    saveState();
    render();
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

/*
╔════════════════════════════════════════════════════════════════════════════╗
║                                TEXT MODALS                                 ║
╚════════════════════════════════════════════════════════════════════════════╝
*/


// Suggest Modal Functions
function openSuggestModal() {
    const modal = document.getElementById('suggestModal');
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    pushModalState('suggestModal', closeSuggestModal);
}

function closeSuggestModal() {
    const modal = document.getElementById('suggestModal');
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
}

// Confession Modal Functions
function openConfessionModal() {
    const modal = document.getElementById('confessionModal');
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    pushModalState('confessionModal', closeConfessionModal);
}

function closeConfessionModal() {
    const modal = document.getElementById('confessionModal');
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
}

// Case Detail Tips Modal Functions
function openCaseDetailTipsModal() {
    pushModalState('caseDetailTipsModal', closeCaseDetailTipsModal);
    
    let tipsModal = document.getElementById('caseDetailTipsModal');
    if (!tipsModal) {
        tipsModal = document.createElement('div');
        tipsModal.id = 'caseDetailTipsModal';
        tipsModal.className = 'training-info-modal';
        tipsModal.innerHTML = `
            <div class="training-info-content">
                <div class="training-info-header">
                    <span class="training-info-title">Case Details Guide</span>
                    <button class="training-info-close" onclick="closeCaseDetailTipsModal()">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text">You can view the tracing guide by enabling <strong>"Show Tracing Guides"</strong> from the Settings menu.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text">To see how the cubeshape transforms step-by-step, enable <strong>"Show Shape Paths"</strong> from Settings.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text">Click directly on any setup algorithm to open the parity analysis tool and examine the parity state.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text">Use the <strong>"Swap Odd/Even"</strong> button to exchange the odd and even algorithms, then click <strong>Save</strong> to apply your changes.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text">The Notes section allows you to add personal reminders for easier recall later. Example notes: <em>"Even - good"</em>, <em>"Odd - move both layers"</em>, <em>"Even - Left"</em>, etc.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">6</div>
                        <div class="training-info-text">Train this specific case by clicking the <img src="res/timer.svg" style="width: 18px; height: 18px; vertical-align: middle; display: inline;" alt="timer"> button next to the case name at the top.</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(tipsModal);
    }
    
    tipsModal.classList.add('active');
}

function closeCaseDetailTipsModal() {
    const modal = document.getElementById('caseDetailTipsModal');
    if (modal) {
        modal.classList.remove('active');
    }
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
                    <span class="training-info-title">Settings Guide</span>
                    <button class="training-info-close" onclick="closeSettingsInfoModal()">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text">Enable <strong>"Show Tracing Guides"</strong> to display tracing paths on cubeshape images.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text">Enable <strong>"Show Shape Paths"</strong> to see how the cubeshape transforms step-by-step as you execute the algorithm.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text"><strong>"Dynamically Decide Even/Odd"</strong> determines parity based on your personal tracing path, making the app fully personalized to your solving style.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text"><strong>"Priority Based Learning"</strong> enables you to group cases into priority levels for a more organized learning experience.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text"><strong>"Color Scheme Settings"</strong> allows you to select your preferred color scheme for parity tracing and scramble image generation.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">6</div>
                        <div class="training-info-text"><strong>"Case Name Settings"</strong> lets you customize the display name for any case to match your preferences.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">7</div>
                        <div class="training-info-text"><strong>"Hide Instruction Buttons"</strong> removes all instruction buttons throughout the app once you're familiar with the features.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">8</div>
                        <div class="training-info-text"><strong>"Export Data"</strong> saves all your progress, preferences, and custom settings to a JSON file for backup or transfer.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">9</div>
                        <div class="training-info-text"><strong>"Import Data"</strong> restores your previously exported progress and settings from a JSON file.</div>
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
                        <div class="training-info-text">Click the <strong>menu button</strong> (top right) to access Settings, Parity Tracer, Notes, and Instructions.</div>
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
                <button class="close-btn" onclick="closeEditCaseModal()">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #666;">Algorithms:</label>
                    <div id="editAlgsList" style="display: flex; flex-direction: column; gap: 10px;">
                        ${allAlgs.map((alg, idx) => `
                            <div style="display: flex; gap: 8px; align-items: center;" data-alg-index="${idx}">
                                <input type="text" class="alg-input" value="${alg}" data-original="${alg}" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 0.9rem;">
                                <span class="parity-label" style="min-width: 40px; font-size: 0.8rem; color: #666; font-style: italic;"></span>
                                <button onclick="this.parentElement.remove()" style="padding: 6px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
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
        perCaseCustomNames.set(caseName, newName);
    } else {
        perCaseCustomNames.delete(caseName);
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
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
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
    modal.style.zIndex = '10001';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; margin-top: 100px;">
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
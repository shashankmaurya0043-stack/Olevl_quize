"""Top-up bilingual questions to reach 100+ per subject."""

TOPUP = {
    "M1": [
        {"q_en": "Which of these is a shortcut to switch between open apps in Windows?", "q_hi": "विंडोज़ में खुली हुई ऐप्स के बीच स्विच करने का शॉर्टकट कौन-सा है?", "options_en": ["Alt+Tab", "Ctrl+Tab", "Shift+Tab", "Ctrl+Alt+T"], "options_hi": ["Alt+Tab", "Ctrl+Tab", "Shift+Tab", "Ctrl+Alt+T"], "a": 0, "exp_en": "Alt+Tab cycles through open apps.", "exp_hi": "Alt+Tab खुली ऐप्स के बीच घूमता है।"},
        {"q_en": "Which file menu option closes the current document?", "q_hi": "वर्तमान दस्तावेज़ बंद करने का विकल्प कौन-सा है?", "options_en": ["Save", "Close", "Print", "Rename"], "options_hi": ["सेव", "क्लोज़", "प्रिंट", "रीनेम"], "a": 1, "exp_en": "Close closes the document.", "exp_hi": "क्लोज़ दस्तावेज़ बंद करता है।"},
        {"q_en": "What is a shortcut to close the active window?", "q_hi": "सक्रिय विंडो बंद करने का शॉर्टकट क्या है?", "options_en": ["Alt+F4", "Ctrl+W (in many apps)", "Both (a) and (b)", "Ctrl+Alt+Delete"], "options_hi": ["Alt+F4", "Ctrl+W (कई ऐप्स में)", "(a) और (b) दोनों", "Ctrl+Alt+Delete"], "a": 2, "exp_en": "Alt+F4 closes app; Ctrl+W often closes a tab/document.", "exp_hi": "Alt+F4 ऐप बंद; Ctrl+W टैब/दस्तावेज़ बंद।"},
    ],
    "M2": [
        {"q_en": "Which HTML tag defines emphasized text (italic)?", "q_hi": "ज़ोर दिया हुआ पाठ (इटैलिक) कौन-सा टैग देता है?", "options_en": ["<b>", "<em>", "<strong>", "<mark>"], "options_hi": ["<b>", "<em>", "<strong>", "<mark>"], "a": 1, "exp_en": "<em> is the semantic italic/emphasis tag.", "exp_hi": "<em> अर्थपूर्ण इटैलिक टैग है।"},
        {"q_en": "Which HTML tag highlights text (yellow mark)?", "q_hi": "पाठ को हाइलाइट (पीला) कौन-सा टैग करता है?", "options_en": ["<mark>", "<high>", "<hl>", "<yellow>"], "options_hi": ["<mark>", "<high>", "<hl>", "<yellow>"], "a": 0, "exp_en": "<mark> highlights text.", "exp_hi": "<mark> पाठ को हाइलाइट करता है।"},
        {"q_en": "Which CSS property controls opacity?", "q_hi": "पारदर्शिता (opacity) कौन-सी CSS प्रॉपर्टी नियंत्रित करती है?", "options_en": ["alpha", "opacity", "transparent", "visibility"], "options_hi": ["alpha", "opacity", "transparent", "visibility"], "a": 1, "exp_en": "opacity: 0-1 controls transparency.", "exp_hi": "opacity 0-1 से पारदर्शिता बदलती है।"},
        {"q_en": "What is the default value of CSS position?", "q_hi": "CSS position का डिफ़ॉल्ट मान क्या है?", "options_en": ["static", "relative", "absolute", "fixed"], "options_hi": ["static", "relative", "absolute", "fixed"], "a": 0, "exp_en": "position defaults to static.", "exp_hi": "position का डिफ़ॉल्ट static है।"},
    ],
    "M3": [
        {"q_en": "Which Python version is primarily used today?", "q_hi": "आज मुख्यतः कौन-सा पायथन संस्करण प्रयोग होता है?", "options_en": ["Python 2", "Python 3", "Python 1", "Python 4"], "options_hi": ["पायथन 2", "पायथन 3", "पायथन 1", "पायथन 4"], "a": 1, "exp_en": "Python 3 is the current standard.", "exp_hi": "पायथन 3 वर्तमान मानक है।"},
        {"q_en": "Which function stops program execution and returns from main?", "q_hi": "मुख्य से बाहर निकल कर प्रोग्राम समाप्त करने वाला फंक्शन?", "options_en": ["quit()/exit()", "end()", "break", "stop"], "options_hi": ["quit()/exit()", "end()", "break", "stop"], "a": 0, "exp_en": "quit() or exit() ends the interpreter.", "exp_hi": "quit()/exit() इंटरप्रेटर बंद करते हैं।"},
    ],
    "M4": [
        {"q_en": "Which is a low-cost single-board computer popular in IoT education?", "q_hi": "IoT शिक्षा में लोकप्रिय सस्ता सिंगल-बोर्ड कंप्यूटर कौन-सा है?", "options_en": ["Raspberry Pi", "IBM mainframe", "Cray super", "Abacus"], "options_hi": ["रास्पबेरी पाई", "IBM मेनफ्रेम", "Cray सुपर", "गणना-पट्टिका"], "a": 0, "exp_en": "Raspberry Pi is widely used in IoT learning.", "exp_hi": "रास्पबेरी पाई IoT शिक्षा में लोकप्रिय है।"},
        {"q_en": "Which of the following is a typical range of ZigBee?", "q_hi": "ZigBee की सामान्य रेंज कौन-सी है?", "options_en": ["~10-100 m", "5-10 km", "10000 km", "0.5 m"], "options_hi": ["~10-100 मी", "5-10 कि.मी.", "10000 कि.मी.", "0.5 मी"], "a": 0, "exp_en": "ZigBee covers around 10-100 meters typically.", "exp_hi": "ZigBee लगभग 10-100 मीटर कवर करता है।"},
        {"q_en": "Which is a common IoT OS for microcontrollers?", "q_hi": "माइक्रोकंट्रोलर के लिए आम IoT OS कौन-सा है?", "options_en": ["FreeRTOS", "Windows Server", "macOS", "Solaris"], "options_hi": ["FreeRTOS", "विंडोज़ सर्वर", "मैकओएस", "सोलारिस"], "a": 0, "exp_en": "FreeRTOS is a common lightweight RTOS for IoT.", "exp_hi": "FreeRTOS माइक्रोकंट्रोलर के लिए आम RTOS है।"},
    ],
}

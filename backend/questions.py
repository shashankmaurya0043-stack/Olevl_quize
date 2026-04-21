"""Re-exports for the quiz question bank and subject metadata."""
from questions_data import ALL_QUESTIONS as QUESTIONS

SUBJECTS = [
    {"code": "M1", "name": "M1 - IT Tools & Business Systems", "name_hi": "M1 - आई.टी. टूल्स और बिज़नेस सिस्टम्स", "color": "m1", "duration_min": 20, "num_questions": 20, "desc": "Fundamentals of computers, MS Office, and internet", "desc_hi": "कंप्यूटर, एम.एस. ऑफ़िस और इंटरनेट के मूल सिद्धांत"},
    {"code": "M2", "name": "M2 - Web Designing & Publishing", "name_hi": "M2 - वेब डिज़ाइनिंग और पब्लिशिंग", "color": "m2", "duration_min": 20, "num_questions": 20, "desc": "HTML, CSS, and web publishing basics", "desc_hi": "HTML, CSS और वेब प्रकाशन की मूल बातें"},
    {"code": "M3", "name": "M3 - Programming with Python", "name_hi": "M3 - पायथन प्रोग्रामिंग", "color": "m3", "duration_min": 20, "num_questions": 20, "desc": "Python programming fundamentals", "desc_hi": "पायथन प्रोग्रामिंग के मूल सिद्धांत"},
    {"code": "M4", "name": "M4 - Internet of Things (IoT)", "name_hi": "M4 - इंटरनेट ऑफ थिंग्स (IoT)", "color": "m4", "duration_min": 20, "num_questions": 20, "desc": "IoT basics, sensors, and smart devices", "desc_hi": "IoT की बुनियाद, सेंसर और स्मार्ट उपकरण"},
]

MOCK_TEST = {"code": "MOCK", "name": "Full Mock Test", "name_hi": "पूर्ण मॉक टेस्ट", "duration_min": 60, "num_questions": 50, "desc": "Mix of all 4 subjects - ultimate test!", "desc_hi": "चारों विषयों का मिश्रण — अंतिम परीक्षण!"}

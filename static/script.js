const timeSlots = {
    "A1": "Monday, 8:30 - 9:50",
    "B1": "Tuesday, 8:30 - 9:50",
    "A2": "Wednesday, 8:30 - 9:50",
    "C2": "Thursday, 8:30 - 9:50",
    "B2": "Friday, 8:30 - 9:50",
    "C1": "Monday, 10:00 - 11:20",
    "D1": "Tuesday, 10:00 - 11:20",
    "E1": "Wednesday, 10:00 - 11:20",
    "D2": "Thursday, 10:00 - 11:20",
    "E2": "Friday, 10:00 - 11:20",
    "F1": "Monday, 11:30 - 12:50",
    "G1": "Tuesday, 11:30 - 12:50",
    "H2": "Wednesday, 11:30 - 12:50",
    "F2": "Thursday, 11:30 - 12:50",
    "G2": "Friday, 11:30 - 12:50",
    "T1": "Monday, 13:00 - 14:00",
    "T2": "Tuesday, 13:00 - 14:00",
    "T3": "Wednesday, 13:00 - 14:00",
    "O1": "Thursday, 13:00 - 14:00",
    "O2": "Friday, 13:00 - 14:00",
    "I1": "Monday, 14:00 - 15:20",
    "J1": "Tuesday, 14:00 - 15:20",
    "I2": "Wednesday, 14:00 - 15:20",
    "K2": "Thursday, 14:00 - 15:20",
    "J2": "Friday, 14:00 - 15:20",
    "K1": "Monday, 15:30 - 16:50",
    "L1": "Tuesday, 15:30 - 16:50",
    "M1": "Wednesday, 15:30 - 16:50",
    "L2": "Thursday, 15:30 - 16:50",
    "M2": "Friday, 15:30 - 16:50",
    "H1": "Monday, 17:00 - 18:20",
    "N1": "Tuesday, 17:00 - 18:20",
    "P1": "Wednesday, 17:00 - 18:20",
    "N2": "Thursday, 17:00 - 18:20",
    "P2": "Friday, 17:00 - 18:20"
};

async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const subjectInput = new FormData(form).get('subjects');
    const subjectInputs = subjectInput.split(',').map(subject => subject.trim());
    const timetableData = await fetch('static/timetable.json').then(response => response.json());
    const result = findLectureTime(subjectInputs, timetableData);
    document.getElementById('results').innerHTML = result.replace(/\n/g, '<br>');
}

function findLectureTime(subjectInputs, timetableData) {
    const results = [];
    const scheduledSlots = {};
    const conflicts = [];
    const timetable = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] };

    function parseTime(timeStr) {
        return new Date(`1970-01-01T${timeStr.split(' - ')[0]}:00`);
    }

    function removeBracketedContent(...args) {
        return args.filter(Boolean).map(s => s.replace(/\s*\(.*?\)/g, '').trim()).join(', ');
    }

    for (const subjectInput of subjectInputs) {
        let found = false;
        for (const row of timetableData) {
            const courseName = row['Course Name'] || '';
            const courseCode = row['Course Code'] || '';
            if (subjectInput === courseName || subjectInput === courseCode) {
                found = true;
                const lectureTime = removeBracketedContent(row['Lecture'], row['Tutorial'], row['Lab']);
                const lectureSlots = lectureTime.split(',').map(slot => slot.trim()).filter(slot => slot !== 'nan');
                const lectureTimes = lectureSlots.map(slot => timeSlots[slot]);

                for (const slot of lectureSlots) {
                    if (!scheduledSlots[slot]) {
                        scheduledSlots[slot] = [courseName, courseCode];
                    } else {
                        conflicts.push(`Conflict detected for ${courseName} (${courseCode}) and ${scheduledSlots[slot][0]} (${scheduledSlots[slot][1]}) at ${timeSlots[slot]}`);
                        const day = timeSlots[slot].split(',')[0];
                        timetable[day].push([parseTime(timeSlots[slot].split(',')[1]), `${timeSlots[slot].split(',')[1]}, ${courseName} (${courseCode}) or ${scheduledSlots[slot][0]} (${scheduledSlots[slot][1]})`]);
                        continue;
                    }

                    const day = timeSlots[slot].split(',')[0];
                    timetable[day].push([parseTime(timeSlots[slot].split(',')[1]), `${timeSlots[slot].split(',')[1]}, ${courseName} (${courseCode})`]);
                }
                break;
            }
        }
        if (!found) {
            results.push(`Subject not found: ${subjectInput}`);
        }
    }

    if (conflicts.length) {
        results.push("Conflicts:");
        results.push(...conflicts);
    }

    for (const [day, schedule] of Object.entries(timetable)) {
        if (schedule.length) {
            results.push(`${day}:`);
            schedule.sort(([a], [b]) => a - b).forEach(([, entry]) => results.push(`    ${entry}`));
            results.push("");
        }
    }

    return results.join('\n');
}

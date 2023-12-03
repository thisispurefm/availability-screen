const calendar_urls = [
    "https://calendar.google.com/calendar/ical/c_d99a3853cc33e69154edf760533cda24fbb4596dbe4b442742617a53cfe015a2%40group.calendar.google.com/public/basic.ics", // Studio 1
    "https://calendar.google.com/calendar/ical/c_d9cfda41f328ef6ca626a71f31b42fceaea34c8ab2284329e1bd8cbd45d12f68%40group.calendar.google.com/public/basic.ics", // Studio 2
    // "https://calendar.google.com/calendar/ical/c_c1e51a1ddf6e5142d6df842036c06edd01619f633e3cdf6ba488055905dabdac%40group.calendar.google.com/public/basic.ics", // Test Calendar
];
const day_strings = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const studio_opens = new Date();
studio_opens.setHours(8, 0, 0);
const studio_closes = new Date();
studio_closes.setHours(20, 0, 0);

async function getFromUrl(url) {
    const response = await fetch(url);

    if (response.status === 200) {
        return response.text();
    } else {
        return "";
    }
}

function parseIcs(ics) {
    const lines = ics.split('\n');
    const events = [];

    let event;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line === "BEGIN:VEVENT") {
            event = {};
        } else if (line === "END:VEVENT") {
            events.push(event);
        } else if (event) {
            const key = line.split(':')[0];
            const value = line.split(':')[1];
            
            if (key === "DTSTART" || key === "DTEND" || key === "DTSTAMP") {
                const parsed_date = value.substring(0, 4) + "-"
                    + value.substring(4, 6) + "-"
                    + value.substring(6, 8) + "T"
                    + value.substring(9, 11) + ":"
                    + value.substring(11, 13) + ":"
                    + value.substring(13, 15)
                    +".000Z";
                event[key] = new Date(parsed_date);
            } else {
                event[key] = value;
            }
        }
    }

    const map = new Map();

    events.forEach((event) => {
        let current = event['DTSTART'];

        while (current < event['DTEND']) {
            map.set(current.toString(), event['SUMMARY']);

            current.setMinutes(current.getMinutes() + 30);
        }
    });

    return map;
}

async function getCalendar() {
    const studio_number = new URLSearchParams(window.location.search).get('studio');

    document.querySelector('#studio-name').innerText = `Studio ${studio_number}`;

    const events = parseIcs(await getFromUrl(calendar_urls[studio_number - 1]));
    const table = document.querySelector("#cal-table");
    table.innerHTML = null;

    const headers = document.createElement('tr');

    const date_options = { day: 'numeric', month: 'numeric', year: 'numeric' };

    headers.appendChild(document.createElement('th'));

    for (let i = 0; i < 3; i++) {
        const header = document.createElement('th');
        let date = new Date();
        date.setDate(date.getDate() + i);
        const date_string = date.toLocaleDateString('en-GB', date_options)
        header.innerText = (i === 0) ? `Today\n(${date_string})` : (i === 1) ? `Tomorrow\n(${date_string})` : `${day_strings[date.getDay()]}\n(${date_string})`;
        headers.appendChild(header);
    }

    table.appendChild(headers);

    let current = new Date(studio_opens);

    while (current < studio_closes) {
        const row = document.createElement('tr');

        const date_element = document.createElement('td');
        date_element.innerText = `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`;
        date_element.className = 'cal-time';
        row.appendChild(date_element);

        for (let i = 0; i < 3; i++) {
            const entry = document.createElement('td');
            const temp_date = new Date(current);
            temp_date.setDate(temp_date.getDate() + i);

            if (events.get(temp_date.toString()) === 'Busy') { entry.classList.add('cal-busy'); }
            else { entry.classList.add('cal-free'); }

            row.appendChild(entry);
        }

        table.appendChild(row);

        current.setMinutes(current.getMinutes() + 30);
    }

    const available_h2 = document.querySelector('#cal-available');
    const current_time = new Date();
    
    if (current_time >= studio_opens && current_time <= studio_closes) {
        current_time.setTime(Math.floor(current_time.getTime() / (1000 * 60 * 30)) * 1000 * 60 * 30, 0);

        if (events.get(current_time.toString()) === 'Busy') {
            available_h2.innerText = 'Booked';
            available_h2.className = 'cal-busy';
        } else {
            available_h2.innerText = 'Available';
            available_h2.className = 'cal-free';
        }
    } else {
        available_h2.innerText = 'Studio Closed';
        available_h2.className = 'cal-closed';
    }
}

function setClock() {
    const current_time = new Date();
    document.querySelector("#clock").innerText = `${current_time.getHours().toString().padStart(2, '0')}:${current_time.getMinutes().toString().padStart(2, '0')}:${current_time.getSeconds().toString().padStart(2, '0')}`;
}

function initialise() {
    setClock();
    getCalendar();
}

setInterval(getCalendar, 30 * 1000);
setInterval(setClock, 500);
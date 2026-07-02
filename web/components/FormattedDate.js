"use client";

// Matches the old moment format 'Do MMMM YYYY, ha' (e.g. "2nd July 2026, 3pm")
function ordinal(day) {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

const FormattedDate = ({ date }) => {
    const d = new Date(date);
    if (isNaN(d)) return null;

    const day = d.getDate();
    const month = d.toLocaleString('en-GB', { month: 'long' });
    const year = d.getFullYear();
    const hour = d.getHours() % 12 || 12;
    const ampm = d.getHours() >= 12 ? 'pm' : 'am';

    return (
        // Rendered in the viewer's timezone, so the server-prerendered value may differ
        <time dateTime={date} suppressHydrationWarning>
            {`${day}${ordinal(day)} ${month} ${year}, ${hour}${ampm}`}
        </time>
    );
};

export default FormattedDate;

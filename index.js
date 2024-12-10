document.addEventListener('DOMContentLoaded', function() {
    const timeSelect = document.querySelector('.time-select');
    let selectedTime = 1; // Default time in minutes

    timeSelect.addEventListener('change', function(e) {
        selectedTime = parseInt(e.target.value);
        console.log(`Selected time: ${selectedTime} minutes`);
    });
}); 
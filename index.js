document.addEventListener('DOMContentLoaded', function() {
    const customSelect = document.querySelector('.custom-select');
    const selectHeader = customSelect.querySelector('.select-header');
    const selectedValue = customSelect.querySelector('.selected-value');
    const options = customSelect.querySelectorAll('.option');
    let selectedTime = 1; // Default time in minutes

    // Toggle dropdown
    selectHeader.addEventListener('click', () => {
        customSelect.classList.toggle('open');
    });

    // Handle option selection
    options.forEach(option => {
        option.addEventListener('click', () => {
            selectedTime = parseInt(option.dataset.value);
            selectedValue.textContent = option.textContent;
            customSelect.classList.remove('open');
            console.log(`Selected time: ${selectedTime} minutes`);
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('open');
        }
    });
}); 
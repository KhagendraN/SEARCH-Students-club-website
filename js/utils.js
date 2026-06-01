/**
 * Get the HTML for a tech icon based on the tech name.
 * @param {string} tech - The name of the technology (e.g., 'Python', 'React').
 * @returns {string} - The HTML string for the icon (e.g., '<i class="fab fa-python"></i>').
 */
export function getTechIconHTML(tech) {
    const map = {
        'Python': '<i class="fab fa-python"></i>',
        'Networking': '<i class="fas fa-network-wired"></i>',
        'AI': '<i class="fas fa-brain"></i>',
        'C': '<i class="fas fa-code"></i>',
        'Linux': '<i class="fab fa-linux"></i>',
        'Sockets': '<i class="fas fa-plug"></i>',
        'Java': '<i class="fab fa-java"></i>',
        'HTML': '<i class="fab fa-html5"></i>',
        'CSS': '<i class="fab fa-css3-alt"></i>',
        'React': '<i class="fab fa-react"></i>',
        'Bash Script': '<i class="fas fa-terminal"></i>',
        'Microcontroller': '<i class="fa-brands fa-raspberry-pi"></i>'
    };
    return map[tech] || '<i class="fas fa-code"></i>';
}

/**
 * Get the full span element for a tech icon, used in modals.
 * @param {string} tech - The name of the technology.
 * @returns {string} - The HTML string for the span element with icon and tooltip.
 */
export function getTechIconSpan(tech) {
    const iconHTML = getTechIconHTML(tech);
    const trimmedTech = tech.trim();

    // Check if we have a specific mapping (meaning it's a known tech with a specific icon)
    // If getTechIconHTML returns the default code icon for a known tech like 'C', it's fine.
    // But we want to wrap it in the span structure used in the modal.

    return `<span class="project__modal-tech-icon" data-tech="${trimmedTech}" title="${trimmedTech}">${iconHTML}</span>`;
}

const app = Vue.createApp({
    data() {
        return {
            menuActive: false,
            searchActive: false,
            searchQuery: "",
            currentView: "termsAndConditions", // Default view
            currentSection: 0, // Start at the first section
            touchStartX: 0,  // For swipe detection
            touchEndX: 0,
            sections: [] // Sections will be loaded dynamically
        };
    },
    methods: {
        toggleMenu() {
            this.menuActive = !this.menuActive;
            if (this.menuActive) {
                setTimeout(() => {
                    document.addEventListener("click", this.handleClickOutside);
                }, 100); // Small delay to prevent instant closing
            } else {
                document.removeEventListener("click", this.handleClickOutside);
            }
        },
        closeMenu() {
            this.menuActive = false;
            document.removeEventListener("click", this.handleClickOutside);
        },
        toggleSearch() {
            this.searchActive = !this.searchActive;
        },
        navigateTo(view) {
            this.currentView = view;
            this.closeMenu();
        },
        navigateSection(direction) {
            // Navigate through the sections
            if (direction === 'next' && this.currentSection < this.sections.length - 1) {
                this.currentSection++;
            } else if (direction === 'previous' && this.currentSection > 0) {
                this.currentSection--;
            }
        },
        handleTouchStart(event) {
            this.touchStartX = event.touches[0].clientX;
        },
        handleTouchMove(event) {
            this.touchEndX = event.touches[0].clientX;
        },
        handleTouchEnd() {
            if (this.menuActive && this.touchStartX - this.touchEndX > 50) {
                this.closeMenu();
            }
        },
        handleClickOutside(event) {
            const menu = document.querySelector(".menu-panel");
            const menuButton = document.querySelector(".menu-btn");

            if (this.menuActive && !menu.contains(event.target) && !menuButton.contains(event.target)) {
                this.closeMenu();
            }
        },
        loadTermsFromHTML() {
            const termsContainer = document.getElementById("terms-content");
            if (termsContainer) {
                const sections = termsContainer.querySelectorAll("section");
                this.sections = Array.from(sections).map((section, index) => {
                    // Get both paragraphs from the section
                    const paragraphs = section.querySelectorAll("p");
                    return {
                        title: section.querySelector("h3")?.innerText || `Section ${index + 1}`,
                        text: Array.from(paragraphs).map(p => p.innerText).join("\n\n")  // Combine the paragraphs with a newline
                    };
                });
            }
        }


    },
    mounted() {
        document.addEventListener("touchstart", this.handleTouchStart);
        document.addEventListener("touchmove", this.handleTouchMove);
        document.addEventListener("touchend", this.handleTouchEnd);
        this.loadTermsFromHTML(); // Load Terms & Conditions text
    },
    beforeUnmount() {
        document.removeEventListener("touchstart", this.handleTouchStart);
        document.removeEventListener("touchmove", this.handleTouchMove);
        document.removeEventListener("touchend", this.handleTouchEnd);
        document.removeEventListener("click", this.handleClickOutside);
    }
});

app.mount("#app");

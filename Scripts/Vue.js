const app = Vue.createApp({
    data() {
        return {
            menuActive: false,
            searchActive: false,
            searchQuery: "",
            currentView: "privacyAndSecurity", // Default view
            currentSection: 0, // Start at the first section for each view
            touchStartX: 0,  // For swipe detection
            touchEndX: 0,
            legalDocs: null, // Store the fetched legal docs here
            privacyAndSecurity: null, // Store the fetched privacy and security docs
            sections: [], // Sections for the legal docs (Terms and Conditions)
            privacySections: [] // Sections for Privacy and Security
        };
    },
    created() {
        // Fetch the Terms and Conditions data from the backend API
        fetch(`http://localhost:3000/collections/legalDocs`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data && data[0] && data[0].termsAndConditions) {
                    this.legalDocs = data[0].termsAndConditions;
                    this.sections = this.parseSections(data[0].termsAndConditions);
                }
            })
            .catch(error => {
                console.error("Error fetching legal docs:", error);
            });

        // Fetch the Privacy and Security data from the backend API
        fetch("/collections/PrivacyAndSecurity", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
            .then((response) => response.json())
            .then((data) => {
                if (data && data.length > 0) {
                    this.privacyAndSecurity = data;
                    this.privacySections = this.parseSections(data[0].privacyAndSecurity); // Update this line to reflect the correct path
                }
            })
            .catch((error) => {
                console.error("Error fetching Privacy and Security data:", error);
            });

    },
    methods: {
        // Toggle menu visibility
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
        // Close menu when clicking outside
        closeMenu() {
            this.menuActive = false;
            document.removeEventListener("click", this.handleClickOutside);
        },
        // Toggle search visibility
        toggleSearch() {
            this.searchActive = !this.searchActive;
        },
        // Navigate to different views
        navigateTo(view) {
            this.currentView = view;
            this.closeMenu();
        },
        // Navigate through the sections of the privacy and security docs
        navigateSection(direction) {
            if (direction === 'next' && this.currentSection < this.privacySections.length - 1) {
                this.currentSection++;
            } else if (direction === 'previous' && this.currentSection > 0) {
                this.currentSection--;
            }
        },        
        // Detect swipe touch start
        handleTouchStart(event) {
            this.touchStartX = event.touches[0].clientX;
        },
        // Detect touch move
        handleTouchMove(event) {
            this.touchEndX = event.touches[0].clientX;
        },
        // Close the menu if swipe left
        handleTouchEnd() {
            if (this.menuActive && this.touchStartX - this.touchEndX > 50) {
                this.closeMenu();
            }
        },
        // Close menu if clicking outside
        handleClickOutside(event) {
            const menu = document.querySelector(".menu-panel");
            const menuButton = document.querySelector(".menu-btn");

            if (this.menuActive && !menu.contains(event.target) && !menuButton.contains(event.target)) {
                this.closeMenu();
            }
        },
        // Parse the legal docs and privacy docs into sections for easy navigation
        parseSections(data) {
            return data.map((item) => ({
                title: item.title,  // Using the title from the fetched data
                text: item.text.join("\n")  // Joining the text array into a single string
            }));
        },
    },
    mounted() {
        // Initialize touch events for swipe handling
        document.addEventListener("touchstart", this.handleTouchStart);
        document.addEventListener("touchmove", this.handleTouchMove);
        document.addEventListener("touchend", this.handleTouchEnd);
    },
    beforeUnmount() {
        // Clean up touch events
        document.removeEventListener("touchstart", this.handleTouchStart);
        document.removeEventListener("touchmove", this.handleTouchMove);
        document.removeEventListener("touchend", this.handleTouchEnd);
        document.removeEventListener("click", this.handleClickOutside);
    },
});

app.mount("#app");

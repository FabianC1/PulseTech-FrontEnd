const app = Vue.createApp({
    data() {
        return {
            menuActive: false,
            searchActive: false,
            showCookiePopup: true,
            searchQuery: "",
            currentView: "HealthAndWellnessGuidelines", // Default view
            currentSection: 0, // Start at the first section for each view
            currentPrivacySection: 0, // Separate section tracker for privacy view
            touchStartX: 0,  // For swipe detection
            touchEndX: 0,
            legalDocs: null, // Store the fetched legal docs here
            privacyAndSecurity: null, // Store the fetched privacy and security docs
            healthAndWellnessGuidelines: null, // Store the fetched guidelines
            sections: [], // Sections for the legal docs (Terms and Conditions)
            privacySections: [], // Sections for Privacy and Security
            wellnessSections: [], // Sections for Health & Wellness Guidelines
            currentWellnessSection: 0, // Separate section tracker for Health & Wellness view
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
                    console.log('Sections for Terms and Conditions:', this.sections);  // Debugging
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
                    this.privacySections = this.parseSections(data[0].privacyAndSecurity);
                }
            })
            .catch((error) => {
                console.error("Error fetching Privacy and Security data:", error);
            });

        // Fetch the Health & Wellness Guidelines data from the backend API
        fetch("/collections/HealthAndWellnessGuidelines", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
            .then((response) => response.json())
            .then((data) => {
                if (data && data.length > 0) {
                    this.healthAndWellnessGuidelines = data;
                    this.wellnessSections = this.parseSections(data[0].healthAndWellnessGuidelines);
                }
            })
            .catch((error) => {
                console.error("Error fetching Health & Wellness Guidelines data:", error);
            });


        const cookiePreference = localStorage.getItem("cookieConsent");
        if (!cookiePreference) {
            this.showCookiePopup = true; // Show the cookie consent popup if no preference is set
        }

        const path = window.location.pathname.substring(1); // Remove leading slash
        if (path) {
            this.currentView = path; // Set view based on the URL
        }

        window.addEventListener("popstate", (event) => {
            if (event.state && event.state.view) {
                this.currentView = event.state.view;
            }
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

        // Close the cookie popup and save the user's choice
        acceptCookies(choice) {
            localStorage.setItem("cookieConsent", choice);
            this.showCookiePopup = false; // Close the popup
        },

        // Toggle search visibility
        toggleSearch() {
            this.searchActive = !this.searchActive;
        },

        // Navigate to different views
        navigateTo(view) {
            this.currentView = view;
            this.closeMenu();
            window.history.pushState({ view }, "", `/${view}`);
        },


        // Navigate through the sections of the docs (generalized for all views)
        navigateSection(direction) {
            if (this.currentView === 'termsAndConditions') {
                console.log('Navigating Terms and Conditions');
                if (direction === 'next' && this.currentSection < this.sections.length - 1) {
                    this.currentSection++;
                    console.log('Next Section:', this.currentSection); // Debugging
                } else if (direction === 'previous' && this.currentSection > 0) {
                    this.currentSection--;
                    console.log('Previous Section:', this.currentSection); // Debugging
                }
            } else if (this.currentView === 'privacyAndSecurity') {
                console.log('Navigating Privacy and Security');
                if (direction === 'next' && this.currentPrivacySection < this.privacySections.length - 1) {
                    this.currentPrivacySection++;
                } else if (direction === 'previous' && this.currentPrivacySection > 0) {
                    this.currentPrivacySection--;
                }
            } else if (this.currentView === 'HealthAndWellnessGuidelines') {
                console.log('Navigating Health & Wellness Guidelines');
                if (direction === 'next' && this.currentWellnessSection < this.wellnessSections.length - 1) {
                    this.currentWellnessSection++;
                } else if (direction === 'previous' && this.currentWellnessSection > 0) {
                    this.currentWellnessSection--;
                }
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

        // Navigate to the "cookies" view when "Customise" is clicked
        goToCookiesView() {
            this.currentView = "cookies";  // Change the current view to "cookies"
            this.showCookiePopup = false; // Close the popup
            window.history.pushState({ view: "cookies" }, "", "/cookies"); // Update the URL
        },

        // Handle Reject All action (close popup and save choice)
        rejectAllCookies() {
            localStorage.setItem("cookieConsent", "reject");
            this.showCookiePopup = false; // Close the popup
        },

        // Handle Accept All action (close popup and save choice)
        acceptAllCookies() {
            localStorage.setItem("cookieConsent", "accept");
            this.showCookiePopup = false; // Close the popup
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
    }
});

app.mount("#app");

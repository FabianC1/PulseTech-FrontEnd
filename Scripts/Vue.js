const app = Vue.createApp({
    data() {
      return {
        menuActive: false,
        searchActive: false,
        showCookiePopup: true, // Controls visibility of the cookie consent popup
        searchQuery: "",
        currentView: "home", // Default view
        currentSection: 0, // Start at the first section for each view
        currentPrivacySection: 0, // Separate section tracker for privacy view
        touchStartX: 0,  // For swipe detection
        touchEndX: 0,
        essentialCookies: JSON.parse(localStorage.getItem("essentialCookies")) || true,
        performanceCookies: JSON.parse(localStorage.getItem("performanceCookies")) || false,
        functionalCookies: JSON.parse(localStorage.getItem("functionalCookies")) || false,
        targetingCookies: JSON.parse(localStorage.getItem("targetingCookies")) || false,
        savedCookies: {
          essential: JSON.parse(localStorage.getItem("essentialCookies")) || true,
          performance: JSON.parse(localStorage.getItem("performanceCookies")) || false,
          functional: JSON.parse(localStorage.getItem("functionalCookies")) || false,
          targeting: JSON.parse(localStorage.getItem("targetingCookies")) || false,
        },
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
      if (cookiePreference !== "accepted") {
        this.showCookiePopup = true;
      } else {
        this.showCookiePopup = false;
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
          if (direction === 'next' && this.currentSection < this.sections.length - 1) {
            this.currentSection++;
          } else if (direction === 'previous' && this.currentSection > 0) {
            this.currentSection--;
          }
        } else if (this.currentView === 'privacyAndSecurity') {
          if (direction === 'next' && this.currentPrivacySection < this.privacySections.length - 1) {
            this.currentPrivacySection++;
          } else if (direction === 'previous' && this.currentPrivacySection > 0) {
            this.currentPrivacySection--;
          }
        } else if (this.currentView === 'HealthAndWellnessGuidelines') {
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
  
      // Toggle cookie preference and save it to localStorage
      toggleCookie(cookieType) {
        this[cookieType] = !this[cookieType];
      },
  
      // Save the cookies settings
      saveSettings() {
        // Save the current cookie preferences to localStorage
        localStorage.setItem("essentialCookies", JSON.stringify(this.essentialCookies));
        localStorage.setItem("performanceCookies", JSON.stringify(this.performanceCookies));
        localStorage.setItem("functionalCookies", JSON.stringify(this.functionalCookies));
        localStorage.setItem("targetingCookies", JSON.stringify(this.targetingCookies));
  
        // Store the saved state as the latest confirmed state
        this.savedCookies = {
          essential: this.essentialCookies,
          performance: this.performanceCookies,
          functional: this.functionalCookies,
          targeting: this.targetingCookies,
        };
  
        // Close the popup after saving
        this.showCookiePopup = false;
        // Set a general cookie consent key to indicate they've accepted preferences
        localStorage.setItem("cookieConsent", "accepted");
      },
  
      // Cancel the cookies settings (restore to the last saved state)
      cancelSettings() {
        // Restore the cookies to the last saved state
        this.essentialCookies = this.savedCookies.essential;
        this.performanceCookies = this.savedCookies.performance;
        this.functionalCookies = this.savedCookies.functional;
        this.targetingCookies = this.savedCookies.targeting;
  
        // Close the cookie popup
        this.showCookiePopup = false;
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
        // Accept only essential cookies
        this.essentialCookies = true;
        this.performanceCookies = false;
        this.functionalCookies = false;
        this.targetingCookies = false;
  
        // Save to localStorage
        this.saveSettings();
      },
  
      // Handle Accept All action (close popup and save choice)
      acceptAllCookies() {
        // Accept all cookies
        this.essentialCookies = true;
        this.performanceCookies = true;
        this.functionalCookies = true;
        this.targetingCookies = true;
  
        // Save to localStorage
        this.saveSettings();
      },
    },
  
    
    mounted() {
      // Initialize touch events
      document.addEventListener("touchstart", this.handleTouchStart);
      document.addEventListener("touchmove", this.handleTouchMove);
      document.addEventListener("touchend", this.handleTouchEnd);
    },
  
    beforeUnmount() {
      // Clean up touch events
      document.removeEventListener("touchstart", this.handleTouchStart);
      document.removeEventListener("touchmove", this.handleTouchMove);
      document.removeEventListener("touchend", this.handleTouchEnd);
    }
  });
  
  app.mount("#app");
  
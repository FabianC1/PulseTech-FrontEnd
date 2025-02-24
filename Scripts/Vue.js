const app = Vue.createApp({
  data() {
    return {
      currentView: "login", // Default view
      isLoggedIn: false, // User login status
      user: null, // Stores user data when logged in
      loginData: { username: "", password: "" }, // Stores login credentials
      menuActive: false,
      searchActive: false,
      showCookiePopup: true, // Controls visibility of the cookie consent popup
      showConfirmationPopup: false, // Initially set to false (hidden)
      searchQuery: "",
      currentSection: 0, // Start at the first section for each view
      currentPrivacySection: 0, // Separate section tracker for privacy view
      currentWellnessSection: 0, // Separate section tracker for Health & Wellness view
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
      selectedRole: 'patient',  // Default to patient
      signupData: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        medicalLicense: '' // Only used for doctor sign-up
      }
    };
  },

  computed: {
    formattedTitle() {
      // Replace camel case with spaces and capitalize each word
      return this.currentView.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/^./, str => str.toUpperCase()); // Capitalize the first letter
    }
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

    // Restore user session if logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.isLoggedIn = true;
      this.currentView = "profile"; // Redirect logged-in users to profile
    }
  },

  methods: {
    // Toggle between Patient and Doctor forms
    toggleRole(role) {
      this.selectedRole = role;
    },

    // Handle Patient Signup
    signupUser() {
      // Validate form inputs
      if (this.validateForm()) {
        fetch("http://localhost:3000/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: this.signupData.username,
            email: this.signupData.email,
            password: this.signupData.password,
            role: this.selectedRole,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.message === "User registered successfully") {
              alert("Signup successful! Please log in.");
              this.navigateTo("login");
            } else {
              alert(data.message);
            }
          })
          .catch((error) => console.error("Signup error:", error));
      }
    },

    // Handle Doctor Signup
    signupDoctorUser() {
      // Validate form inputs
      if (this.validateForm()) {
        fetch("http://localhost:3000/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: this.signupData.username,
            email: this.signupData.email,
            password: this.signupData.password,
            role: this.selectedRole,
            medicalLicense: this.signupData.medicalLicense,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.message === "User registered successfully") {
              alert("Signup successful! Please log in.");
              this.navigateTo("login");
            } else {
              alert(data.message);
            }
          })
          .catch((error) => console.error("Signup error:", error));
      }
    },

    // Form Validation
    validateForm() {
      if (this.signupData.password !== this.signupData.confirmPassword) {
        alert("Passwords do not match.");
        return false;
      }
      if (this.selectedRole === 'doctor' && !this.signupData.medicalLicense) {
        alert("Please provide your medical license.");
        return false;
      }
      return true;
    },

    // Handle Login
    loginUser() {
      fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.loginData),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.message === "Login successful") {
            localStorage.setItem("user", JSON.stringify(data.user));
            this.isLoggedIn = true;
            this.user = data.user;
            this.navigateTo("profile");
          } else {
            alert("Invalid email or password.");
          }
        })
        .catch((error) => console.error("Login error:", error));
    },

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

    acceptCookies(choice) {
      localStorage.setItem("cookieConsent", choice);
      this.showCookiePopup = false; // Close the popup
    },

    toggleSearch() {
      this.searchActive = !this.searchActive;
    },

    navigateTo(view) {
      this.currentView = view;
      console.log("Navigating to:", view);  // Debugging line
      this.closeMenu();
      window.history.pushState({ view }, "", `/${view}`);
    },

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
      const popup = document.querySelector(".confirmation-popup");

      // Close the menu if clicked outside
      if (this.menuActive && !menu.contains(event.target) && !menuButton.contains(event.target)) {
        this.closeMenu();
      }

      // Close the confirmation popup if clicked outside
      if (this.showConfirmationPopup && popup && !popup.contains(event.target)) {
        popup.classList.add("fade-out");

        // Hide after fade-out and reset visibility
        setTimeout(() => {
          this.showConfirmationPopup = false;
          popup.classList.remove("fade-out");
        }, 500); // Match fade-out duration
      }
    },

    toggleCookie(cookieType) {
      if (this[cookieType] !== undefined) {
        this[cookieType] = !this[cookieType];
      } else {
        console.error(`Cookie type "${cookieType}" does not exist.`);
      }
    },


    // Show confirmation popup and handle animations
    saveSettings() {
      // Save the current cookie preferences to localStorage
      localStorage.setItem("essentialCookies", JSON.stringify(this.essentialCookies));
      localStorage.setItem("performanceCookies", JSON.stringify(this.performanceCookies));
      localStorage.setItem("functionalCookies", JSON.stringify(this.functionalCookies));
      localStorage.setItem("targetingCookies", JSON.stringify(this.targetingCookies));

      // Store the saved state
      this.savedCookies = {
        essential: this.essentialCookies,
        performance: this.performanceCookies,
        functional: this.functionalCookies,
        targeting: this.targetingCookies,
      };

      // Close cookie popup after saving
      this.showCookiePopup = false;
      localStorage.setItem("cookieConsent", "accepted");

      // Show confirmation popup
      this.showConfirmationPopup = true;

      // Trigger fade-in animation by adding fade-in class
      this.$nextTick(() => {
        const popup = document.querySelector(".confirmation-popup");
        popup.classList.remove("fade-out");  // Ensure no lingering fade-out class
        popup.classList.add("fade-in");
      });

      // Hide confirmation popup after 2 seconds with fade-out
      setTimeout(() => {
        const popup = document.querySelector(".confirmation-popup");
        popup.classList.add("fade-out");  // Add fade-out class to trigger fade-out

        // Reset visibility after fade-out animation ends (500ms)
        setTimeout(() => {
          this.showConfirmationPopup = false; // Hide the popup
          popup.classList.remove("fade-out"); // Clean up the class for future use
        }, 500);
      }, 2000); // Wait for 2 seconds before triggering fade-out
    },

    cancelSettings() {
      this.essentialCookies = this.savedCookies.essential;
      this.performanceCookies = this.savedCookies.performance;
      this.functionalCookies = this.savedCookies.functional;
      this.targetingCookies = this.savedCookies.targeting;

      this.showCookiePopup = false;
    },



    parseSections(data) {
      return data.map((item) => ({
        title: item.title,
        text: item.text.join("\n"),
      }));
    },

    goToCookiesView() {
      this.currentView = "cookies";
      this.showCookiePopup = false;
      window.history.pushState({ view: "cookies" }, "", "/cookies");
    },

    rejectAllCookies() {
      this.essentialCookies = true;
      this.performanceCookies = false;
      this.functionalCookies = false;
      this.targetingCookies = false;
      this.saveSettings();
    },

    acceptAllCookies() {
      this.essentialCookies = true;
      this.performanceCookies = true;
      this.functionalCookies = true;
      this.targetingCookies = true;
      this.saveSettings();
    },
    sendEmail() {
      if (!this.name || !this.email || !this.message) {
        alert("Please fill in all fields before sending.");
        return;
      }

      const subject = encodeURIComponent("New Contact Form Submission");
      const body = encodeURIComponent(
        `Name: ${this.name}\nEmail: ${this.email}\n\nMessage:\n${this.message}`
      );

      const mailtoLink = `mailto:support@pulsetech.com?subject=${subject}&body=${body}`;
      window.location.href = mailtoLink;
    },

    logout() {
      localStorage.removeItem("user");
      this.isLoggedIn = false;
      this.user = null;
    },
    redirectToLogin() {
      this.currentView = "login"; // Switch to login view
    },
    redirectToSignup() {
      this.currentView = "signup"; // Switch to signup view
    },
    login() {
      // Handle login logic here
      console.log("Login logic goes here");
      // For example, you might want to authenticate using an API
    },
    signup() {
      // Handle signup logic here
      console.log("Signup logic goes here");
      // Example: Save the user details or call an API to register them
    }

  },



  mounted() {
    // Restore user session if logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.isLoggedIn = true;
      this.currentView = "profile"; // Redirect logged-in users to profile
    }

    document.addEventListener("touchstart", this.handleTouchStart);
    document.addEventListener("touchmove", this.handleTouchMove);
    document.addEventListener("touchend", this.handleTouchEnd);
    document.addEventListener("click", this.closeConfirmationPopup);
  },

  beforeUnmount() {
    document.removeEventListener("touchstart", this.handleTouchStart);
    document.removeEventListener("touchmove", this.handleTouchMove);
    document.removeEventListener("touchend", this.handleTouchEnd);

    document.removeEventListener("click", this.closeConfirmationPopup);
  },
});

app.mount("#app");

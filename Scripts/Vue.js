const app = Vue.createApp({
  data() {
    return {
      darkMode: false, // Initial theme state
      profilePicture: "", // Stores base64 profile picture
      currentView: "home", // Default view
      isLoggedIn: false, // User login status
      user: {
        fullName: 'John Doe',
        username: 'john_doe123',
        email: 'john.doe@example.com',
        dateOfBirth: '1990-01-01',
        ethnicity: 'Caucasian',
        address: '123 Main St, Hometown, USA'
      }, // Initialized here in data()
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
      selectedRole: 'patient',  // Default to patient
      signupData: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        medicalLicense: '' // Only used for doctor sign-up
      },
      isEditing: {
        fullName: false,
        username: false,
        email: false,
        password: false,
        dateOfBirth: false,
        ethnicity: false,
        address: false,
        address: false,
        personalInfo: false,
        medicalHistory: false,
        medications: false,
        vaccinations: false,
        lifestyle: false,
        healthLogs: false,
        labResults: false,
        doctorVisits: false,
        wearableData: false,
        emergencyDetails: false,
      },
      diagnosisStarted: false,
      question: "",
      userAnswer: "",
      showInput: false,
      diagnosisResult: "",
      formattedDiagnosisResult: [],
      hasDiagnosis: false, // To track whether a diagnosis is already made
      
      originalUser: {}, // Store the original data to cancel changes
    };
  },


  computed: {
    formattedTitle() {
      // Replace camel case with spaces and capitalize each word
      return this.currentView.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/^./, str => str.toUpperCase()); // Capitalize the first letter
    },

    toggleClass() {
      return this.theme === "dark" ? "active" : ""; // If theme is dark, add active class to the button
    },
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

    // Determine the correct initial view based on the URL
    const path = window.location.pathname.substring(1); // Get the path from the URL
    if (this.isLoggedIn && path !== 'profile') {
      this.currentView = 'profile';
    } else if (!this.isLoggedIn && path === 'profile') {
      this.currentView = 'login';
    } else {
      this.currentView = path || 'home'; // Default to 'home' if no path is provided
    }

    // Retrieve user data from localStorage once
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.user.password = ""; // ✅ Ensure the password field is empty on load
      this.user.password = ""; // Ensure password is empty
      this.isLoggedIn = true;

      // Debugging to check if email exists
      console.log("User email:", this.user.email);

      // If email is still undefined, provide a fallback or reset user
      if (!this.user.email) {
        console.error("No email found, resetting user data.");
        this.logout(); // Log the user out if the email is missing
      } else {
        this.fetchMedicalRecords(); // Fetch medical records if email exists
      }
    } else {
      this.isLoggedIn = false;
    }

    // Listen for changes in the browser's history (back/forward buttons)
    window.addEventListener("popstate", this.handleRouteChange);

    // Initial routing based on URL and login status
    this.handleRouteChange();

    // Check if a theme is saved in localStorage
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      document.body.setAttribute("data-theme", savedTheme); // Apply saved theme
    } else {
      // If no saved theme, use system preference
      const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.body.setAttribute("data-theme", prefersDarkMode ? "dark" : "light");
    }
  },

  methods: {
    async startNewDiagnosis() {
      // Reset diagnosis and input fields
      this.diagnosisStarted = false;
      this.question = "";
      this.userAnswer = "";
      this.diagnosisResult = "";
      this.formattedDiagnosisResult = [];
      this.hasDiagnosis = false;  // Hide the diagnosis result
      this.showInput = false;

      // Show the initial question when a new diagnosis starts
      this.startDiagnosis();
    },

    async startDiagnosis() {
      try {
        const response = await fetch("http://localhost:3000/start-diagnosis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        this.question = data.message; // Get the first question
        this.diagnosisStarted = true;
        this.showInput = true; // Show the input field when the first question is displayed
      } catch (error) {
        console.error("Error starting diagnosis:", error);
      }
    },

    async sendAnswer() {
      if (!this.userAnswer.trim()) return; // Prevent empty submission

      try {
        const response = await fetch("http://localhost:3000/answer-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userInput: this.userAnswer }),
        });

        const data = await response.json();
        this.userAnswer = ""; // Clear input field
        this.question = data.message; // Set next question

        // If the AI provides a diagnosis result, stop input and display result
        if (data.message && data.message.toLowerCase().includes("you may have") && !this.hasDiagnosis) {
          this.diagnosisResult = data.message;
          this.formattedDiagnosisResult = this.formatDiagnosisResult(this.diagnosisResult);
          this.showInput = false;  // Hide input after diagnosis
          this.hasDiagnosis = true; // Prevent further diagnosis result display
        }
      } catch (error) {
        console.error("Error sending answer:", error);
      }
    },

    // Split the result into individual sentences for better formatting
    formatDiagnosisResult(result) {
      return result
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0); // Remove any empty lines
    },

    // Start a new diagnosis
    startNewDiagnosis() {
      this.diagnosisStarted = false;
      this.question = "";
      this.userAnswer = "";
      this.diagnosisResult = "";
      this.formattedDiagnosisResult = [];
      this.hasDiagnosis = false;
      this.showInput = false;
      this.startDiagnosis(); // Start the diagnosis again
    },

    async saveMedicalRecords() {
      const medicalRecords = {
        email: this.user.email,
        fullName: this.user.fullName,
        dateOfBirth: this.user.dateOfBirth,
        gender: this.user.gender,
        bloodType: this.user.bloodType,
        emergencyContact: this.user.emergencyContact,
        medicalHistory: this.user.medicalHistory,
        medications: this.user.medications,
        vaccinations: this.user.vaccinations,
        smokingStatus: this.user.smokingStatus,
        alcoholConsumption: this.user.alcoholConsumption,
        exerciseRoutine: this.user.exerciseRoutine,
        sleepPatterns: this.user.sleepPatterns,
        healthLogs: this.user.healthLogs,
        labResults: this.user.labResults,
        doctorVisits: this.user.doctorVisits,
        heartRate: this.user.heartRate,
        stepCount: this.user.stepCount,
        sleepTracking: this.user.sleepTracking,
        bloodOxygen: this.user.bloodOxygen,
        organDonorStatus: this.user.organDonorStatus,
        medicalDirectives: this.user.medicalDirectives,
      };

      try {
        const response = await fetch("http://localhost:3000/save-medical-records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(medicalRecords),
        });

        const data = await response.json();
        if (response.ok) {
          console.log("Medical records saved successfully");
          // Set the editing flag for all fields back to false
          Object.keys(this.isEditing).forEach((key) => {
            this.isEditing[key] = false;
          });
        } else {
          console.error("Error saving medical records:", data.message);
        }
      } catch (error) {
        console.error("Error saving medical records:", error);
      }
    },

    async fetchMedicalRecords() {
      try {
        console.log("Fetching medical records for:", this.user.email); // Debugging
    
        if (!this.user.email) {
          console.error("User email is missing. Cannot fetch medical records.");
          return;
        }
    
        const response = await fetch(`http://localhost:3000/get-medical-records?email=${encodeURIComponent(this.user.email)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
    
        const data = await response.json();
    
        if (response.ok) {
          this.user = { ...this.user, ...data }; // Merge medical records into user object
          console.log("Medical records fetched successfully:", data);
        } else {
          console.error("Error fetching medical records:", data.message);
        }
      } catch (error) {
        console.error("Error fetching medical records:", error);
      }
    },
    


    async cancelEdit() {
      // Set the editing flag for all fields back to false
      Object.keys(this.isEditing).forEach((key) => {
        this.isEditing[key] = false;
      });
    },


    toggleTheme() {
      // Toggle the darkMode state
      this.darkMode = !this.darkMode;

      // Save the preference in localStorage
      localStorage.setItem("theme", this.darkMode ? "dark" : "light");

      // Update the body class
      this.updateBodyClass();
    },

    updateBodyClass() {
      // Add the corresponding theme class to the body element
      if (this.darkMode) {
        document.body.setAttribute("data-theme", "dark");
      } else {
        document.body.setAttribute("data-theme", "light");
      }
    },


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
        // Include medical license in the request when role is 'doctor'
        fetch("http://localhost:3000/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: this.signupData.username,
            email: this.signupData.email,
            password: this.signupData.password,
            role: this.selectedRole,
            medicalLicense: this.selectedRole === "doctor" ? this.signupData.medicalLicense : null, // Only send for doctor
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

// Handle login form submission
loginUser() {
  fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: this.loginData.email,
      password: this.loginData.password,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.message === "Login successful") {
        // ✅ Remove password from user object before saving
        const userData = { ...data.user };
        delete userData.password;

        // ✅ Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(userData));
        this.isLoggedIn = true;
        this.user = userData;
        this.user.password = ""; // ✅ Ensure password field is empty

        // ✅ Fetch medical records after login
        this.fetchMedicalRecords();

        this.navigateTo("profile"); // Redirect to profile after successful login
      } else {
        alert("Invalid email or password.");
      }
    })
    .catch((error) => console.error("Login error:", error));
},


    // Edit user details function
    editUserDetail(field) {
      const newValue = prompt(`Enter new value for ${field}`, this.user[field]);
      if (newValue && newValue !== this.user[field]) {
        // Update the user object with the new value (you can later send this data to the backend)
        this.user[field] = newValue;
        alert(`${field} updated successfully!`);
        // Optionally, make an API call to update the database with the new data
      }
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

    // Handle logout action
    logout() {
      localStorage.removeItem("user"); // Clear user session
      this.isLoggedIn = false;

      // Instead of null, reset user to an empty object to avoid errors
      this.user = {
        fullName: "",
        username: "",
        email: "",
        dateOfBirth: "",
        ethnicity: "",
        address: "",
        phoneNumber: "",
        gender: "",
        profilePicture: "" // Ensure profilePicture exists to prevent errors
      };

      this.currentView = "login"; // Redirect instantly
    },
    redirectToLogin() {
      this.currentView = "login"; // Switch to login view
    },
    redirectToSignup() {
      this.currentView = "signup"; // Switch to signup view
    },


    toggleEdit(field) {
      if (field === "profilePicture") {
        if (this.isEditing.profilePicture) {
          // Cancel editing - Fetch the latest profile picture from the database
          fetch("http://localhost:3000/getUserProfile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: this.user.email }),
          })
            .then(response => response.json())
            .then(data => {
              this.user.profilePicture = data.profilePicture || null; // Update from DB
              localStorage.setItem("user", JSON.stringify(this.user)); // Sync local storage
            })
            .catch(error => {
              console.error("Error fetching user profile:", error);
            });
        } else {
          // Store the current profile picture before editing
          this.originalProfilePicture = this.user.profilePicture;
        }
        this.isEditing.profilePicture = !this.isEditing.profilePicture;
      } else {
        // Handle other fields normally
        this.isEditing[field] = !this.isEditing[field];

        if (!this.isEditing[field]) {
          // If user cancels, restore original value from localStorage
          const storedUser = JSON.parse(localStorage.getItem("user"));
          if (storedUser && storedUser[field] !== undefined) {
            this.user[field] = storedUser[field];
          }
        }
      }
    },


    changeProfilePicture() {
      // Trigger file input click to open file explorer
      this.$refs.fileInput.click();
    },


    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.user.profilePicture = e.target.result; // Set the uploaded file as the profile picture
        };
        reader.readAsDataURL(file);
      }
      this.isEditing.profilePicture = true; // Allow save after selecting a file
    },

    removeProfilePicture() {
      fetch("http://localhost:3000/removeProfilePicture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: this.user.email }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Profile picture removed successfully") {
            this.user.profilePicture = null; // Remove from UI
            this.originalProfilePicture = null; // Prevent cancel from restoring
            localStorage.setItem("user", JSON.stringify(this.user)); // Update local storage
            console.log("Profile picture removed successfully.");
          } else {
            alert("There was an error removing your profile picture.");
          }
        })
        .catch((error) => console.error("Error removing profile picture:", error));
    },






    saveChanges() {
      let updatedData = {
        email: this.user.email,
        fullName: this.user.fullName,
        username: this.user.username,
        dateOfBirth: this.user.dateOfBirth,
        ethnicity: this.user.ethnicity,
        address: this.user.address,
        phoneNumber: this.user.phoneNumber,
        gender: this.user.gender,
        profilePicture: this.user.profilePicture,
      };

      // ✅ Only include the password if the user changed it
      if (this.user.password && this.user.password.trim() !== "") {
        updatedData.password = this.user.password;
      }

      console.log("Sending data to backend:", updatedData); // Debugging

      fetch("http://localhost:3000/updateProfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Response from server:", data);
          if (data.message === "User profile updated successfully") {
            this.showSaveSuccessPopup = true;
            this.saveSuccessMessage = "Profile updated successfully!";

            this.user = { ...this.user, ...updatedData }; // Instantly update UI
            this.user.password = ""; // ✅ Reset password field after update
            localStorage.setItem("user", JSON.stringify(this.user));
          } else {
            this.showSaveSuccessPopup = true;
            this.saveSuccessMessage = "No changes were made.";
          }

          Object.keys(this.isEditing).forEach((key) => {
            this.isEditing[key] = false;
          });

          setTimeout(() => {
            this.showSaveSuccessPopup = false;
          }, 3000);
        })
        .catch((error) => {
          console.error("Error updating user:", error);
          alert("An error occurred while saving your changes.");
          Object.keys(this.isEditing).forEach((key) => {
            this.isEditing[key] = false;
          });
        });

        
    },



    // Handle route changes and check login status
    handleRouteChange() {
      const path = window.location.pathname.substring(1); // Get the path from the URL

      // Redirect based on login state and path
      if (this.isLoggedIn) {
        // If logged in, allow access to other pages like home, appointments, etc.
        if (path === 'login' || path === 'signup') {
          this.currentView = 'profile'; // Prevent logged-in users from accessing login/signup
          window.history.pushState({ view: 'profile' }, '', '/profile');
        } else {
          this.currentView = path || 'home'; // Allow access to other pages
        }
      } else {
        // If not logged in, redirect to login if they try to access the profile page
        if (path === 'profile') {
          this.currentView = 'login'; // Redirect to login page
          window.history.pushState({ view: 'login' }, '', '/login');
        } else {
          this.currentView = path || 'home'; // Allow access to home or public pages
        }
      }
    },
    // Method to navigate to the profile view
    goToProfile() {
      this.currentView = 'profile';  // Set the current view to 'profile'
      window.history.pushState({ view: 'profile' }, '', '/profile');  // Update URL
    },

    handleEnterKey(event) {
      if (event.key === "Enter") {
        this.sendAnswer(); // Submit answer when Enter is pressed
      }
    }    
    
  },



  mounted() {
    // Load the theme preference from localStorage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      this.darkMode = savedTheme === "dark";
    } else {
      // Fallback to system preference
      const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      this.darkMode = prefersDarkMode;
    }

    // Update the body class based on the current theme
    this.updateBodyClass();

    this.handleRouteChange();

    document.addEventListener("keydown", this.handleEnterKey);

    document.addEventListener("touchstart", this.handleTouchStart);
    document.addEventListener("touchmove", this.handleTouchMove);
    document.addEventListener("touchend", this.handleTouchEnd);
    document.addEventListener("click", this.closeConfirmationPopup);
  },

  beforeUnmount() {
    document.removeEventListener("keydown", this.handleEnterKey);
    window.removeEventListener("popstate", this.handleRouteChange);
    document.removeEventListener("touchstart", this.handleTouchStart);
    document.removeEventListener("touchmove", this.handleTouchMove);
    document.removeEventListener("touchend", this.handleTouchEnd);

    document.removeEventListener("click", this.closeConfirmationPopup);
  },
});

app.mount("#app");
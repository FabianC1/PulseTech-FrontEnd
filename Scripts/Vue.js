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
        appointment: {},
      },
      diagnosisStarted: false,
      question: "",
      userAnswer: "",
      showInput: false,
      diagnosisResult: "",
      formattedDiagnosisResult: [],
      hasDiagnosis: false, // To track whether a diagnosis is already made

      originalUser: {}, // Store the original data to cancel changes
      appointmentsView: "upcoming",
      upcomingAppointments: [],
      patientsList: [],
      doctorsList: [],
      appointmentData: {}, // Store appointment data for each patient or doctor
      showMedicalHistoryPopup: false,
      selectedPatient: {
        fullName: "",
        dateOfBirth: "",
        gender: "",
        bloodType: "",
        emergencyContact: "",
        medicalHistory: "",
        medications: [],
        vaccinations: "",
        smokingStatus: "",
        alcoholConsumption: "",
        exerciseRoutine: "",
        sleepPatterns: "",
        healthLogs: "",
        labResults: "",
        doctorVisits: "",
        heartRate: "",
        stepCount: "",
        sleepTracking: "",
        bloodOxygen: "",
        organDonorStatus: "",
        medicalDirectives: ""
      },
      medicationSuggestions: [], // Initialize as an empty array
      selectedMedication: {
        name: "",
        dosage: "",
        frequency: "",
        timeToTake: "",
        duration: "",
        diagnosis: ""
      },
      currentMedicationInput: "", // Start with an empty input
      isAddingMedication: false, // Control whether the medication form is being added
      timeOffset: 0,
      timeMultiplier: 1,
      contacts: [],  // Stores all doctors if patient, all patients if doctor
      selectedContact: null, // Stores the currently opened chat
      chatMessages: [], // Stores messages for the selected chat
      newMessage: "",  // Input field for new messages
      newMessage: "",
      showAttachmentMenu: false,
      selectedMedicalRecord: null,
      medicalRecords: [] // This will store the user's medical records
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

    isSaveDisabled() {
      if (!this.selectedMedication) {
        return true; // Disable save button if selectedMedication is not initialized
      }

      return !this.selectedMedication.name ||
        !this.selectedMedication.dosage ||
        !this.selectedMedication.frequency ||
        !this.selectedMedication.time ||
        !this.selectedMedication.duration ||
        !this.selectedMedication.diagnosis;
    },

    nextMedication() {
      if (!this.user || !this.user.medications || this.user.medications.length === 0) {
        return { name: "None", timeToTake: "N/A", dosage: "N/A" };
      }

      // Find the closest upcoming medication
      const now = this.getCurrentTime();
      let closestMed = null;
      let minDiff = Infinity;

      this.user.medications.forEach(med => {
        const nextDose = this.calculateNextDoseTime(med);
        if (nextDose) {
          const diffMinutes = Math.floor((nextDose - now) / 60000);
          if (diffMinutes >= 0 && diffMinutes < minDiff) {
            minDiff = diffMinutes;
            closestMed = med;
          }
        }
      });

      return closestMed || { name: "None", timeToTake: "N/A", dosage: "N/A" };
    }
  },

  watch: {
    // Watch for when the current view is set to 'appointments'
    currentView(newValue) {
      if (newValue === 'appointments') {
        this.fetchAppointmentsData();  // Trigger API calls only when the view is active
      }
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
      this.user.password = ""; //  Ensure the password field is empty on load
      this.isLoggedIn = true;
      this.isDoctor = this.user.role === "doctor"; // Check if user is a doctor

      // Debugging: Ensure email is present
      console.log("User email:", this.user.email);

      if (!this.user.email) {
        console.error("No email found, resetting user data.");
        this.logout(); // Log the user out if the email is missing
      } else {
        this.fetchMedicalRecords(); // Fetch medical records if email exists
        this.fetchAppointments(); // Fetch appointments immediately
        if (this.isDoctor) {
          this.fetchPatients(); // Fetch patients list for doctors
        } else {
          this.fetchDoctors(); // Fetch doctors list for patients
        }
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


    if (this.currentView === "messages") {
      this.fetchContacts();
    }




    this.fetchContacts(); // Fetch contacts on load

    // Start polling for new messages
    setInterval(() => {
      if (this.selectedContact) {
        this.fetchMessages();
      }
    }, 2000);
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
        console.log("Fetching medical records for:", this.user.email);

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
          console.log("Medical records fetched successfully:", data);

          // Ensure Vue updates the UI properly by replacing the medications array
          this.user = { ...this.user, medications: [...data.medications] };
        } else {
          console.error("Error fetching medical records:", data.message);
        }
      } catch (error) {
        console.error("Error fetching medical records:", error);
      }
    },

    // Fetch and show medical history in popup
    async viewMedicalHistory(email) {
      try {
        const response = await fetch(`http://localhost:3000/get-medical-records?email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (response.ok) {
          this.selectedPatient = { email, ...data }; // Store patient data
          this.showMedicalHistoryPopup = true; // Show popup
        } else {
          console.error("Error fetching medical history:", data.message);
        }
      } catch (error) {
        console.error("Error fetching medical history:", error);
      }
    },

    // Save updated medical history
    async saveMedicalHistory() {
      try {
        const response = await fetch("http://localhost:3000/save-medical-records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.selectedPatient),
        });

        const data = await response.json();
        if (response.ok) {
          alert("Medical history updated.");
          this.showMedicalHistoryPopup = false;
        } else {
          console.error("Error updating medical history:", data.message);
        }
      } catch (error) {
        console.error("Error updating medical history:", error);
      }
    },

    // Close the popup
    closeMedicalHistoryPopup() {
      this.showMedicalHistoryPopup = false;
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
            //  Remove password from user object before saving
            const userData = { ...data.user };
            delete userData.password;

            //  Store user data in localStorage
            localStorage.setItem("user", JSON.stringify(userData));
            this.isLoggedIn = true;
            this.user = userData;
            this.user.password = ""; //  Ensure password field is empty
            this.isDoctor = userData.role === "doctor";

            //  Fetch medical records after login
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

      // Clear login input fields
      this.loginEmail = "";
      this.loginPassword = "";

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

      // Only include the password if the user changed it
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
            this.user.password = ""; // Reset password field after update
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
    },

    // Fetch appointments, medical records, and patients when the appointments view is loaded
    fetchAppointmentsData() {
      if (this.isDoctor) {
        this.fetchAppointments();  // Fetch appointments for the doctor
        this.fetchPatients();  // Fetch the list of patients
      } else {
        this.fetchAppointments();  // Fetch appointments for the patient
        this.fetchDoctors();  // Fetch the list of doctors
      }
    },

    // Fetch appointments for the doctor or patient
    async fetchAppointments() {
      try {
        const response = await fetch(`http://localhost:3000/get-appointments?email=${this.user.email}`);
        const data = await response.json();
        this.upcomingAppointments = data;
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    },

    // Fetch patients list for doctors
    async fetchPatients() {
      try {
        const response = await fetch("http://localhost:3000/get-patients");
        const data = await response.json();
        this.patientsList = data;
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    },

    // Fetch doctors list for patients
    async fetchDoctors() {
      try {
        const response = await fetch("http://localhost:3000/get-doctors");
        const data = await response.json();
        this.doctorsList = data;
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    },

    // Schedule appointment for doctor
    async scheduleAppointment(patientEmail) {
      const date = prompt("Enter appointment date (YYYY-MM-DD):");

      if (!date) return;

      try {
        const response = await fetch("http://localhost:3000/create-appointment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctorEmail: this.user.email,
            patientEmail,
            date,
          }),
        });

        const data = await response.json();
        alert(data.message);
        this.fetchAppointments();  // Fetch updated appointments
      } catch (error) {
        console.error("Error scheduling appointment:", error);
      }
    },

    // Request appointment for patient
    async requestAppointment(doctorEmail) {
      const date = prompt("Enter appointment date (YYYY-MM-DD):");

      if (!date) return;

      try {
        const response = await fetch("http://localhost:3000/create-appointment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctorEmail,
            patientEmail: this.user.email,
            date,
          }),
        });

        const data = await response.json();
        alert(data.message);
        this.fetchAppointments();  // Fetch updated appointments
      } catch (error) {
        console.error("Error requesting appointment:", error);
      }
    },

    // View patient records (for doctor)
    async viewPatientRecords(email) {
      try {
        const response = await fetch(`http://localhost:3000/view-patient-records?email=${email}`);
        const data = await response.json();
        alert(`Medical Records: ${JSON.stringify(data)}`);
      } catch (error) {
        console.error("Error fetching patient records:", error);
      }
    },

    // Toggle appointment edit mode
    toggleAppointmentEdit(email) {
      // Directly modify the object in Vue 3
      this.isEditing.appointment[email] = true;
      // Initialize appointment data if not already present
      if (!this.appointmentData[email]) {
        this.appointmentData[email] = { date: '', reason: '' };
      }
    },

    // Cancel editing and reset input fields
    cancelAppointmentEdit(email) {
      // Directly modify the object in Vue 3
      this.isEditing.appointment[email] = false;
      this.appointmentData[email] = { date: '', reason: '' };
    },

    async submitAppointment(email) {
      const appointment = this.appointmentData[email];
      if (!appointment.date || !appointment.reason) {
        alert('Please fill in both date and reason.');
        return;
      }

      try {
        // Check if the logged-in user is a doctor or patient
        const isDoctor = this.user.role === "doctor";

        // Submit appointment via API
        const response = await fetch("http://localhost:3000/create-appointment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctorEmail: isDoctor ? this.user.email : email,  // If doctor, use their email; if patient, use selected doctor
            patientEmail: isDoctor ? email : this.user.email, // If doctor, assign patient email; otherwise, use logged-in user
            date: appointment.date,
            reason: appointment.reason,
            status: "Scheduled" // Default status
          })
        });

        const data = await response.json();
        alert(data.message);
        this.fetchAppointments(); // Refresh appointments list
        this.cancelAppointmentEdit(email); // Reset form
      } catch (error) {
        console.error("Error scheduling appointment:", error);
      }
    },


    // Function to mark the appointment as completed
    async markAppointmentAsCompleted(appointmentId) {
      try {
        const response = await fetch("http://localhost:3000/update-appointment-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId: appointmentId, // Pass only the appointment ID
          })
        });

        const data = await response.json();
        if (response.ok) {
          alert(data.message);  // Success message
          this.fetchAppointments();  // Refresh the appointments list
        } else {
          alert(data.message || "Failed to update appointment status.");
        }
      } catch (error) {
        console.error("Error marking appointment as completed:", error);
      }
    },

    // Fetch medications based on the input query
    async fetchMedications() {
      // Check if the input has at least 3 characters to start searching
      if (this.currentMedicationInput.length < 3) {
        this.medicationSuggestions = [];  // Don't search if less than 3 chars
        return;
      }

      try {
        // Make the fetch request to the backend to get the medications list
        const response = await fetch(`/collections/Medications?name=${this.currentMedicationInput}`);
        const data = await response.json();

        // Check if the response contains valid medication data
        if (data && data[0] && Array.isArray(data[0].medications)) {
          // Filter medications that match the search input (case-insensitive)
          this.medicationSuggestions = data[0].medications.filter((medication) =>
            medication.toLowerCase().includes(this.currentMedicationInput.toLowerCase())
          );
        } else {
          // Clear the suggestions list if no data is found
          this.medicationSuggestions = [];
        }
      } catch (error) {
        console.error("Error fetching medications:", error);
        this.medicationSuggestions = [];  // Reset on error
      }
    },

    // Select medication from the suggestions list
    selectMedication(medication) {
      this.selectedMedication = {
        name: medication,  // Set the selected medication name
        dosage: "",        // Add a default empty value for dosage
        frequency: "",     // Add a default empty value for frequency
        diagnosis: "",     // Add a default empty value for diagnosis
        timeToTake: "",    // Add the time to take field
        duration: ""       // Add the duration field
      };
      this.currentMedicationInput = medication;  // Update the input field with selected medication
      this.medicationSuggestions = [];  // Clear suggestions after selection
    },


    saveMedication() {
      // Ensure that the patient is selected and medication data exists
      if (!this.selectedPatient || !this.selectedPatient.email) {
        console.error("No patient selected or no patient email found.");
        alert("Error: No patient selected.");
        return;
      }

      // Ensure all medication fields are filled before proceeding
      if (!this.selectedMedication.name || !this.selectedMedication.dosage || !this.selectedMedication.frequency || !this.selectedMedication.diagnosis || !this.selectedMedication.time || !this.selectedMedication.duration) {
        alert("Please fill in all medication details before saving.");
        return;
      }

      // Prepare the medication data to be saved
      const medicationData = {
        email: this.selectedPatient.email,  // Use the selected patient's email
        medication: {
          name: this.selectedMedication.name,
          dosage: this.selectedMedication.dosage,
          frequency: this.selectedMedication.frequency,
          diagnosis: this.selectedMedication.diagnosis,
          timeToTake: this.selectedMedication.time,  // Include time to take
          duration: this.selectedMedication.duration       // Include duration
        }
      };

      // Send the data to the backend to save it in the database
      fetch("http://localhost:3000/save-medication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(medicationData)
      })
        .then(response => response.json())
        .then(data => {
          if (data.message === "Medication saved successfully!") {
            alert("Medication saved successfully!");

            // Clear the input fields after successful save
            this.selectedMedication = { name: "", dosage: "", frequency: "", time: "", duration: "", diagnosis: "" };
            this.currentMedicationInput = ""; // Clear the medication name input
            this.medicationSuggestions = []; // Clear suggestions

            // Fetch updated medical records to reflect the changes
            this.fetchMedicalRecords();

            // Optionally, close the popup after saving
            this.showMedicalHistoryPopup = false;
          } else {
            console.error("Error saving medication:", data.message);
            alert("Error saving medication: " + data.message);
          }
        })
        .catch(error => {
          console.error("Error saving medication:", error);
          alert("An error occurred while saving the medication.");
        });
    },


    // Save the updated medical history (including medications)
    saveMedicalHistory() {
      const updatedPatient = { ...this.selectedPatient };

      fetch("http://localhost:3000/save-medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPatient),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Medical history updated.") {
            alert("Medical history updated successfully.");
            this.closeMedicalHistoryPopup(); // Close the popup after saving
          }
        })
        .catch((error) => console.error("Error saving medical history:", error));
      this.closeMedicalHistoryPopup(); // Close the popup after saving
    },

    calculateNextDoseTime(medication) {
      if (!medication.timeToTake || !medication.frequency) return null;

      // If we've already locked in a next dose time, use it.
      if (medication.fixedNextDose) {
        return new Date(medication.fixedNextDose);
      }

      const now = this.getCurrentTime(); // Use simulated time
      const [hour, period] = medication.timeToTake.split(" ");
      let targetHour = parseInt(hour);
      if (period === "PM" && targetHour !== 12) targetHour += 12;
      if (period === "AM" && targetHour === 12) targetHour = 0;

      let nextDose = new Date(now);
      nextDose.setHours(targetHour, 0, 0, 0);

      // Loop until nextDose is in the future.
      while (nextDose <= now) {
        nextDose.setHours(nextDose.getHours() + this.getFrequencyHours(medication.frequency));
      }

      // Lock in this next dose time.
      medication.fixedNextDose = nextDose.toISOString();
      return nextDose;
    },



    getFrequencyHours(frequency) {
      const freqMap = {
        "Every hour": 1,
        "Every 2 hours": 2,
        "Every 3 hours": 3,
        "Every 4 hours": 4,
        "Every 6 hours": 6,
        "Every 8 hours": 8,
        "Every 12 hours": 12,
        "Once a day": 24,
        "Once a week": 168,
      };
      return freqMap[frequency] || 0;
    },


    getDoseClass(medication) {
      const diffMinutes = this.getTimeDiff(medication);
      if (diffMinutes === null) return "";
      if (diffMinutes >= 0 && diffMinutes <= 60) {
        return "upcoming-dose"; // upcoming period (blue)
      } else if (diffMinutes < 0 && diffMinutes >= -30) {
        return "warning-dose"; // grace period (yellow)
      }
      return "";
    },


    getNextDoseCountdown(medication) {
      // If the dose has been marked as taken, return "Taken"
      if (medication.takenAt) {
        return "Taken";
      }
      const diffMinutes = this.getTimeDiff(medication);
      if (diffMinutes === null) return "Not set";
      if (diffMinutes >= 0) {
        // Before dose time: normal countdown
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
      } else if (diffMinutes < 0 && diffMinutes >= -30) {
        // During grace period: countdown from 30 minutes to 0
        return `${30 - Math.abs(diffMinutes)} minutes left to mark`;
      }
      return "Missed";
    },



    showMarkAsTaken(medication) {
      const now = this.getCurrentTime();
      const nextDose = this.calculateNextDoseTime(medication);

      if (!nextDose) return false;

      const diffMinutes = Math.floor((nextDose - now) / 60000);

      return diffMinutes <= 60 && diffMinutes >= -30; // Show within the correct timeframe
    },


    async markAsTaken(medication) {
      if (medication.isMarking || this.hasTakenDose(medication)) {
        console.log(`Already marked as taken: ${medication.name}`);
        return;
      }

      medication.isMarking = true;
      const now = this.getCurrentTime();
      const nextDoseTime = this.calculateNextDoseTime(medication).toISOString();

      try {
        const response = await fetch("http://localhost:3000/mark-medication-taken", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: this.user.email,
            medicationName: medication.name,
            doseTime: nextDoseTime,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          console.log(`${medication.name} marked as taken at ${data.takenAt}`);

          if (!medication.logs) medication.logs = [];
          medication.logs.push({ time: nextDoseTime, status: "Taken" });

          this.updateMedicationUI();
          this.$forceUpdate();
        } else {
          console.error(`Error marking ${medication.name} as taken:`, data.message);
        }
      } catch (error) {
        console.error("Error marking medication as taken:", error);
      } finally {
        medication.isMarking = false;
      }
    },

    hasTakenDose(medication) {
      const nextDoseTime = this.calculateNextDoseTime(medication).toISOString();
      return medication.logs && medication.logs.some(log => log.time === nextDoseTime && log.status === "Taken");
    },

    shouldShowMarkAsTaken(medication) {
      if (!medication) return false;
      if (this.hasTakenDose(medication)) return false; // If taken, don't show button

      const diffMinutes = this.getTimeDiff(medication);
      if (diffMinutes === null) return false;

      return diffMinutes >= -30 && diffMinutes <= 60; // Show only in valid time range
    },


    checkMissedMedications() {
      this.user.medications.forEach(medication => {
        const now = new Date();
        const nextDose = new Date(medication.nextDoseTime);
        const diffMinutes = Math.floor((nextDose - now) / 60000);

        if (diffMinutes < -30 && !medication.logs.some(log => log.time === nextDose.toISOString())) {
          medication.logs.push({ time: nextDose.toISOString(), status: "Missed" });
          this.fetchMedicalRecords(); // Update UI
        }
      });
    },


    async autoMarkMissedMedications() {
      this.user.medications.forEach(async (medication) => {
        const now = this.getCurrentTime();
        const nextDose = this.calculateNextDoseTime(medication);

        if (!nextDose) return; // No valid dose time, skip.

        const diffMinutes = Math.floor((now - nextDose) / 60000); // Time difference in minutes.

        // If 30 minutes have passed after dose time, and it was NOT taken
        if (diffMinutes >= 30 && !medication.takenAt) {
          console.log(`Auto-marking ${medication.name} as Missed (Dose Time: ${nextDose})`);

          try {
            const response = await fetch("http://localhost:3000/mark-medication-missed", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: this.user.email,
                medicationName: medication.name,
              }),
            });

            const data = await response.json();
            if (response.ok) {
              console.log(` ${medication.name} marked as Missed in database`);

              // Immediately update the UI
              if (!medication.logs) medication.logs = [];
              medication.logs.push({ time: now.toISOString(), status: "Missed" });

              // Clear next dose time & reset cycle
              delete medication.fixedNextDose;
              medication.takenAt = null; // Reset for the next cycle

              //  Force Vue to re-render
              this.$forceUpdate();
            } else {
              console.error(`Error marking ${medication.name} as Missed:`, data.message);
            }
          } catch (error) {
            console.error("Error in auto-marking missed medication:", error);
          }
        }
      });
    },




    getGracePeriodMessage(medication) {
      const now = this.getCurrentTime();
      const nextDose = this.calculateNextDoseTime(medication);

      if (!nextDose) return ""; // No valid dose time

      const diffMinutes = Math.floor((now - nextDose) / 60000); // Difference in minutes

      if (diffMinutes >= 0 && diffMinutes < 30) {
        return `${30 - diffMinutes} minutes left to mark`; // Show countdown
      } else if (diffMinutes >= 30) {
        return "Missed"; // Mark as missed after 30 minutes
      }

      return ""; // Otherwise, return nothing
    },




    // Formats timestamps (ISO strings) into readable date & time
    formatTime(timestamp) {
      if (!timestamp) return "Unknown"; // Handle missing values
      return new Date(timestamp).toLocaleString(); // Converts to local time
    },


    // Assigns a class to logs based on status (Taken = Green, Missed = Red)
    getLogStatusClass(log) {
      return log.status === "Taken" ? "log-taken" : "log-missed";
    },

    getCurrentTime() {
      return new Date(Date.now() + this.timeOffset);
    },

    // Calculate next dose time and lock it in for the current cycle.
    calculateNextDoseTime(medication) {
      if (!medication.timeToTake || !medication.frequency) return null;

      // If we've already locked in a next dose time, use it.
      if (medication.fixedNextDose) {
        return new Date(medication.fixedNextDose);
      }

      const now = this.getCurrentTime();
      const [hour, period] = medication.timeToTake.split(" ");
      let targetHour = parseInt(hour);
      if (period === "PM" && targetHour !== 12) targetHour += 12;
      if (period === "AM" && targetHour === 12) targetHour = 0;

      let nextDose = new Date(now);
      nextDose.setHours(targetHour, 0, 0, 0);

      // Increase until nextDose is in the future.
      while (nextDose <= now) {
        nextDose.setHours(nextDose.getHours() + this.getFrequencyHours(medication.frequency));
      }

      // Lock in this next dose time for the cycle.
      medication.fixedNextDose = nextDose.toISOString();
      return nextDose;
    },

    getTimeDiff(medication) {
      const now = this.getCurrentTime();
      const nextDose = this.calculateNextDoseTime(medication);
      if (!nextDose) return null;
      // Calculate difference in minutes (nextDose - now)
      return Math.floor((nextDose - now) / 60000);
    },

    updateMedicationUI() {
      const now = this.getCurrentTime();
      this.user.medications = this.user.medications.map((med) => {
        const countdown = this.getNextDoseCountdown(med);
        const alreadyTaken = this.hasTakenDose(med);

        return {
          ...med,
          showMarkAsTaken: !alreadyTaken && this.shouldShowMarkAsTaken(med),
          nextDoseDisplay: alreadyTaken ? "Taken" : countdown,
          gracePeriodActive: countdown.includes("minutes left to mark")
        };
      });
      this.$forceUpdate();
    },

    // New method to toggle fast speed
    toggleFastTime() {
      // Toggle between normal (1) and fast (10x) speeds
      this.timeMultiplier = this.timeMultiplier > 1 ? 1 : 60;
    },
    // New method to reset the timeOffset
    resetTimeOffset() {
      this.timeOffset = 0;
    },


    async fetchContacts() {
      try {
        const response = await fetch(`http://localhost:3000/get-contacts?email=${encodeURIComponent(this.user.email)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Contacts received:", data);
        this.contacts = data; // Store contacts
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    },

    hasUnreadMessages(email) {
      return this.chatMessages.some(msg => msg.sender === email && !msg.read);
    },

    scrollToBottom() {
      // Wait for the next DOM update cycle to ensure the new messages are rendered
      this.$nextTick(() => {
        const chatContainer = this.$refs.chatMessages; // Use Vue's ref to directly access the DOM element
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to the bottom
        }
      });
    },


    // Watch for changes in chatMessages to ensure the chat always scrolls to the bottom when new messages arrive
    async fetchMessages() {
      if (!this.selectedContact) return;

      try {
        const response = await fetch(
          `http://localhost:3000/get-messages?sender=${encodeURIComponent(this.user.email)}&recipient=${encodeURIComponent(this.selectedContact.email)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        this.chatMessages = await response.json(); // Store chat messages
        this.scrollToBottom(); // Scroll to bottom after updating messages

      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    },

    // This method will be used to trigger the scroll to bottom when messages change
    watchMessages() {
      this.$watch('chatMessages', () => {
        this.scrollToBottom(); // Scroll to bottom whenever messages are updated
      });
    },



    // Whenever a new message is sent or fetched, this method will be called to scroll
    async sendMessage() {
      try {
        if (!this.newMessage.trim() && !this.selectedAttachment) {
          return; // Don't send empty messages
        }

        const messageData = {
          sender: this.user.email,
          receiver: this.selectedContact.email,
          message: this.newMessage || null,
          attachment: this.selectedAttachment || null,
          timestamp: new Date().toISOString(),
        };

        const response = await fetch("http://localhost:3000/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messageData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        this.newMessage = ""; // Clear input
        this.selectedAttachment = null; // Clear attachment

        // Re-fetch messages immediately after sending
        await this.fetchMessages();
        this.scrollToBottom(); // Ensure we scroll to the bottom

      } catch (error) {
        console.error("Error sending message:", error);
      }
    },



    openChat(contact) {
      this.selectedContact = contact;  // Set the selected contact
      this.chatMessages = [];  // Clear previous messages
      this.fetchMessages();  // Fetch chat history with the selected contact
    },

    // Toggle the attachment menu
    toggleAttachmentMenu() {
      this.showAttachmentMenu = !this.showAttachmentMenu;
      if (this.showAttachmentMenu) {
        this.fetchMedicalRecords();
      }
    },

    viewMedicalRecord(record) {
      alert(`Viewing Medical Record: ${record.type}\nDate: ${record.date}`);
      // You can open a modal or new page here to show details
    },

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

    setInterval(() => {
      this.timeOffset += 1000 * this.timeMultiplier;
      this.updateMedicationUI();
      this.autoMarkMissedMedications();
    }, 1000);


    this.watchMessages();
    setInterval(() => {
      if (this.selectedContact) {
        this.fetchMessages(); // Fetch messages every 2 seconds
      }
    }, 2000);

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
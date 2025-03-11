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
        medication: {} // Track which patient is being edited
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
      showAttachmentOptions: false,
      selectedMedicalRecord: null,
      isAttachmentActive: false,
      medicalRecords: [],// This will store the user's medical records
      isUserScrolling: false,
      chatOpened: false,
      lastMessageCount: 0,
      showMessageMedicalHistoryPopup: false,
      selectedMessageMedicalRecord: {},
      medicationInputs: {}, // Store medication name per patient
      medicationData: {},   // Store all medication details per patient
      healthDashboardData: {
        missedMeds: 0,
        recentAppointments: [],
        upcomingAppointments: [],
        medicationStats: { taken: 0, missed: 0 }, // For the bar chart
      }
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
    },

    // Show only the last 3 completed appointments
    filteredRecentAppointments() {
      return this.healthDashboardData.recentAppointments
        .slice(-3) // Get the last 3 appointments
        .reverse(); // Show the most recent one first
    },

    // Show only the next 3 scheduled appointments
    filteredUpcomingAppointments() {
      return this.healthDashboardData.upcomingAppointments.slice(0, 3);
    }
  },

  watch: {
    // Watch for when the current view is set to 'healthDashboard'
    currentView(newView) {
      if (newView === "healthDashboard") {
        this.fetchHealthDashboardData();
        this.$nextTick(() => {
          this.renderMedicationChart();
          this.renderHeartRateChart();
          this.renderStepCountChart();
          this.renderSleepTrackingChart();
        });
      }
    },


    user: {
      handler(newUser) {
        if (newUser) {
          this.contacts = [];  // Reset previous contacts
          this.chatMessages = [];  // Reset previous messages
          this.fetchContacts();  // Fetch new contacts for the new user

          if (this.selectedContact) {
            this.fetchMessages();  // Fetch messages for the currently selected contact
          }
        }
      },
      immediate: true, // Fetch contacts immediately after the component is mounted or when user data changes
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

    saveMedication() {
      if (!this.user || !this.user.email) {
        console.error("User email is missing. Cannot save medication.");
        return;
      }

      if (!this.selectedMedication.name || !this.selectedMedication.dosage || !this.selectedMedication.frequency) {
        alert("Please fill in all medication details before saving.");
        return;
      }

      const medicationData = {
        email: this.user.email, // 💡 Fix: Always use logged-in user
        medication: {
          name: this.selectedMedication.name,
          dosage: this.selectedMedication.dosage,
          frequency: this.selectedMedication.frequency,
          diagnosis: this.selectedMedication.diagnosis,
          timeToTake: this.selectedMedication.timeToTake,
          duration: this.selectedMedication.duration
        }
      };

      fetch("http://localhost:3000/save-medication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(medicationData)
      })
        .then(response => response.json())
        .then(data => {
          if (data.message === "Medication saved successfully!") {
            alert("Medication saved successfully!");

            this.fetchMedicalRecords(); // 💡 Fix: Refresh medications after saving
            this.selectedMedication = { name: "", dosage: "", frequency: "", timeToTake: "", duration: "", diagnosis: "" };
            this.currentMedicationInput = "";
          } else {
            console.error("Error saving medication:", data.message);
          }
        })
        .catch(error => {
          console.error("Error saving medication:", error);
        });
    },


    async fetchMedicalRecords() {
      try {
        if (!this.user || !this.user.email) {
          console.error("User object or email is missing. Cannot fetch medical records.");
          return;
        }

        const response = await fetch(`http://localhost:3000/get-medical-records?email=${encodeURIComponent(this.user.email)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        if (!response.ok) {
          console.error("Error fetching medical records:", data.message);
          return;
        }

        console.log("Fetched medical records:", data);

        // 🔹 Ensure `medicalRecords` is updated for messages/attachments
        this.medicalRecords = data;
        this.selectedMedicalRecord = data;

        // 🔹 Ensure `user` is updated for displaying data
        this.user = { ...this.user, ...data };

        // 🔹 Ensure `medications`, `medicalHistory`, etc., update properly
        this.user.medications = data.medications || [];
        this.user.medicalHistory = data.medicalHistory || "No records found";
        this.user.vaccinations = data.vaccinations || "No records found";
        this.user.healthLogs = data.healthLogs || "No symptoms recorded";
        this.user.labResults = data.labResults || "No reports available";
        this.user.doctorVisits = data.doctorVisits || "No records found";
        this.user.heartRate = data.heartRate || "Not available";
        this.user.stepCount = data.stepCount || "Not available";
        this.user.sleepTracking = data.sleepTracking || "Not available";
        this.user.bloodOxygen = data.bloodOxygen || "Not available";
        this.user.organDonorStatus = data.organDonorStatus || "Not specified";
        this.user.medicalDirectives = data.medicalDirectives || "Not specified";

        // 🔹 Force Vue to re-render immediately
        this.$forceUpdate();

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
            // Remove password from user object before saving
            const userData = { ...data.user };
            delete userData.password;

            // Store user data in localStorage
            localStorage.setItem("user", JSON.stringify(userData));
            this.isLoggedIn = true;
            this.user = userData;
            this.user.password = ""; // Ensure password field is empty
            this.isDoctor = userData.role === "doctor";

            // Reset previous contacts and messages, then fetch new ones
            this.contacts = [];
            this.chatMessages = [];

            // Fetch the contacts and messages again for the new user
            this.fetchContacts();
            if (this.selectedContact) {
              this.fetchMessages(); // Ensure messages for the selected contact are fetched
            }

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

    // Fetch medications based on the input query for a specific patient
    async fetchMedications(patientEmail) {
      // Ensure input exists for the selected patient
      if (!this.medicationInputs[patientEmail]) {
        this.medicationInputs[patientEmail] = "";
      }

      // Get the current input for this patient
      const input = this.medicationInputs[patientEmail];

      // Only start searching if at least 3 characters are entered
      if (input.length < 3) {
        this.medicationSuggestions[patientEmail] = []; // Clear suggestions
        return;
      }

      try {
        // Make the fetch request to the backend
        const response = await fetch(`/collections/Medications?name=${input}`);
        const data = await response.json();

        // Ensure the response contains valid medication data
        if (data && data[0] && Array.isArray(data[0].medications)) {
          // Filter medications that match the search input (case-insensitive)
          this.medicationSuggestions[patientEmail] = data[0].medications.filter((medication) =>
            medication.toLowerCase().includes(input.toLowerCase())
          );
        } else {
          // Clear suggestions if no data found
          this.medicationSuggestions[patientEmail] = [];
        }
      } catch (error) {
        console.error("Error fetching medications:", error);
        this.medicationSuggestions[patientEmail] = []; // Reset on error
      }
    },

    // Select a medication from the suggestions list for a specific patient
    selectMedication(medication, patientEmail) {
      this.medicationInputs[patientEmail] = medication; // Update only this patient's input

      // Initialize medicationData if not set
      if (!this.medicationData[patientEmail]) {
        this.medicationData[patientEmail] = {};
      }

      // Assign selected medication with empty values for the other fields
      this.medicationData[patientEmail] = {
        name: medication,
        dosage: "",
        frequency: "",
        diagnosis: "",
        timeToTake: "",
        duration: ""
      };

      // Clear suggestions for this patient
      this.medicationSuggestions[patientEmail] = [];
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
      const now = this.getCurrentTime();
      let nextDose = this.calculateNextDoseTime(medication);

      if (!nextDose) return "Not set";

      let diffMinutes = Math.floor((nextDose - now) / 60000);

      // **🔹 If within the grace period (0 to -30 minutes), show countdown**
      if (diffMinutes < 0 && diffMinutes >= -30) {
        return `${30 - Math.abs(diffMinutes)} minutes left to mark`;
      }

      // **🔹 If grace period has fully passed (-30+ minutes), auto-mark as missed**
      if (diffMinutes < -30) {
        console.log(`Grace period ended for ${medication.name}. Marking as Missed.`);

        // **🔴 Mark as Missed in Database**
        console.log(`Grace period ended for ${medication.name}. Running autoMarkMissedMedications().`);
        this.autoMarkMissedMedications();

        // **Move to the next scheduled dose**
        nextDose = this.calculateNextDoseTime(medication);
        while (nextDose <= now) {
          nextDose.setHours(nextDose.getHours() + this.getFrequencyHours(medication.frequency));
        }

        medication.fixedNextDose = nextDose.toISOString();
        this.$forceUpdate();

        // **Recalculate time difference for display**
        diffMinutes = Math.floor((nextDose - now) / 60000);
      }

      // **🔹 Prevents "0h 0m left" issue by ensuring nextDose is in the future**
      if (diffMinutes <= 0) {
        console.log(`Fixing next dose time for ${medication.name}, ensuring it's in the future.`);
        nextDose = this.calculateNextDoseTime(medication);
        while (nextDose <= now) {
          nextDose.setHours(nextDose.getHours() + this.getFrequencyHours(medication.frequency));
        }

        medication.fixedNextDose = nextDose.toISOString();
        this.$forceUpdate();
        diffMinutes = Math.floor((nextDose - now) / 60000);
      }

      // **🔹 Always display countdown for the next dose**
      const hours = Math.floor(Math.max(diffMinutes, 0) / 60);
      const minutes = Math.max(diffMinutes, 0) % 60;

      return `${hours}h ${minutes}m left`;
    },




    getGracePeriodMessage(medication) {
      const now = this.getCurrentTime();
      const nextDose = this.calculateNextDoseTime(medication);

      if (!nextDose) return ""; // No valid dose time

      const diffMinutes = Math.floor((now - nextDose) / 60000); // Time difference in minutes

      if (diffMinutes >= 0 && diffMinutes < 30) {
        return `${30 - diffMinutes} minutes left to mark`; // Still within grace period
      }

      // Otherwise, return normal countdown (ALWAYS FUTURE TIME)
      return this.getNextDoseCountdown(medication);
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


    async saveMedicalRecords() {
      const newWearableEntry = {
        date: new Date().toISOString().split("T")[0], // Store only the date (YYYY-MM-DD)
        heartRate: this.user.heartRate || 0,
        stepCount: this.user.stepCount || 0,
        sleepTracking: this.user.sleepTracking || 0,
        bloodOxygen: this.user.bloodOxygen || 0,
      };

      // Ensure wearableDataHistory exists
      if (!this.user.wearableDataHistory) {
        this.user.wearableDataHistory = [];
      }

      // Add the new entry
      this.user.wearableDataHistory.push(newWearableEntry);

      // Prepare medical records object for saving
      const medicalRecords = {
        email: this.user.email,
        fullName: this.user.fullName,
        dateOfBirth: this.user.dateOfBirth,
        gender: this.user.gender,
        bloodType: this.user.bloodType,
        emergencyContact: this.user.emergencyContact,
        medicalHistory: this.user.medicalHistory,
        medications: [...this.user.medications],
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
        wearableDataHistory: this.user.wearableDataHistory, // Include wearable data history
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

          // Update localStorage with new wearable data
          localStorage.setItem("wearableData", JSON.stringify(this.user.wearableDataHistory));

          // Fetch updated medical records from the database
          await this.fetchMedicalRecords();

          // Reset edit mode
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
      if (!this.user.medications || !Array.isArray(this.user.medications)) {
        console.error("Medications is not an array or is undefined.");
        this.user.medications = [];
        return;
      }

      this.user.medications.forEach(async (medication) => {
        const now = this.getCurrentTime();
        const nextDose = this.calculateNextDoseTime(medication);

        if (!nextDose) return; // Skip if no valid dose time

        const doseTimeISO = nextDose.toISOString();
        const diffMinutes = Math.floor((now - nextDose) / 60000); // Time difference in minutes

        // **🔹 1. Check if this dose was already marked as "Taken"**
        const alreadyTaken = medication.logs && medication.logs.some(log =>
          log.time === doseTimeISO && log.status === "Taken"
        );

        if (alreadyTaken) {
          console.log(`Skipping Missed status for ${medication.name} - already taken at ${doseTimeISO}`);

          // * Move to the next dose automatically**
          medication.fixedNextDose = this.calculateNextDoseTime(medication, doseTimeISO).toISOString();
          this.$forceUpdate();
          return;
        }

        // **🔹 2. Check if it was already marked as "Missed" to prevent duplicates**
        const alreadyMissed = medication.logs && medication.logs.some(log =>
          log.time === doseTimeISO && log.status === "Missed"
        );

        if (alreadyMissed) {
          console.log(`Skipping duplicate Missed status for ${medication.name} at ${doseTimeISO}`);
          return; // Do not mark it as missed again
        }

        // **🔹 3. If 30+ minutes have passed, mark as "Missed"**
        if (diffMinutes >= 30) {
          console.log(`Auto-marking ${medication.name} as Missed (Dose Time: ${doseTimeISO})`);

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
              console.log(`${medication.name} marked as Missed in database`);

              if (!medication.logs) medication.logs = [];
              medication.logs.push({ time: doseTimeISO, status: "Missed" });

              // **Move to the next dose automatically**
              medication.fixedNextDose = this.calculateNextDoseTime(medication, doseTimeISO).toISOString();

              this.$forceUpdate(); // Ensure UI updates
            } else {
              console.error(`Error marking ${medication.name} as Missed:`, data.message);
            }
          } catch (error) {
            console.error("Error in auto-marking missed medication:", error);
          }
        }
      });
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
      if (!this.user.medications || !Array.isArray(this.user.medications)) {
        console.error("Medications is not an array or is undefined.");
        this.user.medications = [];
        return;
      }

      const now = this.getCurrentTime();

      this.user.medications.forEach((med) => {
        let nextDose = this.calculateNextDoseTime(med);
        const alreadyTaken = this.hasTakenDose(med);

        // **Ensure next dose moves forward if missed**
        if (nextDose && now - nextDose >= 30 * 60000) {
          console.log(`Skipping overdue dose for ${med.name}. Moving to next dose.`);
          nextDose = this.calculateNextDoseTime(med, nextDose.toISOString());
          med.fixedNextDose = nextDose.toISOString();
        }

        const countdown = this.getNextDoseCountdown(med);

        med.nextDoseDisplay = countdown; // **Always show countdown**
        med.showMarkAsTaken = !alreadyTaken && this.shouldShowMarkAsTaken(med);
        med.gracePeriodActive = countdown.includes("minutes left to mark");
      });

      this.$forceUpdate(); // Force UI to refresh
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

    handleUserScroll() {
      const chatContainer = this.$refs.chatMessages;

      if (!chatContainer) return;

      // Check if the user has manually scrolled up
      const isAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop === chatContainer.clientHeight;
      this.isUserScrolling = !isAtBottom; // Set flag to true if user scrolls up
    },

    scrollToBottomIfNewMessage() {
      const chatContainer = this.$refs.chatMessages;
      if (!chatContainer) return;

      // Determine if user is near the bottom (within 50 pixels)
      const nearBottom =
        chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 50;

      // Only auto-scroll if new messages arrived and user is near the bottom
      if (this.chatMessages.length > this.lastMessageCount && nearBottom) {
        this.$nextTick(() => {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        });
      }
      // Update the last message count after processing
      this.lastMessageCount = this.chatMessages.length;
    },


    async fetchMessages() {
      if (!this.selectedContact) return;

      try {

        const response = await fetch(
          `http://localhost:3000/get-messages?sender=${encodeURIComponent(this.user.email)}&recipient=${encodeURIComponent(this.selectedContact.email)}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        this.chatMessages = await response.json();

      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    },



    async attachMedicalRecord() {
      if (!this.medicalRecords || this.medicalRecords.length === 0) {
        await this.fetchMedicalRecords();
      }
      if (this.medicalRecords.length > 0) {
        this.selectedMedicalRecord = this.medicalRecords[0]; // Store the record
        this.isAttachmentActive = true; // Mark as active for sending
        this.showAttachmentOptions = true; // Show options
      } else {
        alert("No medical records found to attach.");
      }
    },

    detachAttachment() {
      this.isAttachmentActive = false; // Prevent it from being sent
      this.showAttachmentOptions = false; // Hide "View & Remove"
    },


    async sendMessage() {
      try {
        if (!this.newMessage.trim() && (!this.isAttachmentActive || !this.selectedMedicalRecord || this.isDoctor)) {
          console.warn("Cannot send an empty message or attachment!");
          return;
        }

        const messageData = {
          sender: this.user.email,
          receiver: this.selectedContact.email,
          message: this.newMessage || null,
          attachment: (this.isAttachmentActive && this.selectedMedicalRecord && !this.isDoctor)
            ? { ...this.selectedMedicalRecord }
            : null,
          timestamp: new Date().toISOString(),
        };

        console.log("Sending message:", messageData);

        const response = await fetch("http://localhost:3000/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messageData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        console.log("Message sent successfully!");

        this.newMessage = ""; // Clear input
        this.isAttachmentActive = false; // Reset attachment state after sending
        this.showAttachmentOptions = false; // Hide buttons after sending

        await this.fetchMessages(); // Refresh messages in UI
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },




    openChat(contact) {
      this.selectedContact = contact; // Set the selected contact
      this.chatMessages = []; // Clear previous messages
      // When the chat is first opened, we always scroll to bottom
      this.$nextTick(() => {
        const chatContainer = this.$refs.chatMessages;
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      });
      this.lastMessageCount = 0; // Reset count so new messages will trigger scroll
      this.fetchMessages(); // Fetch chat history
    },

    // Reset the flag when the user closes the chat or navigates
    closeChat() {
      this.chatOpened = false;
      this.isNewMessage = false; // Reset new message flag
      this.selectedContact = null;
      this.chatMessages = [];
    },


    // Toggle the attachment menu
    toggleAttachmentMenu() {
      if (!this.selectedMedicalRecord) {
        this.attachMedicalRecord();
      }
      this.showAttachmentOptions = !this.showAttachmentOptions;
      this.isAttachmentActive = this.showAttachmentOptions; // Sync with visibility
    },

    // New method: viewAttachedRecord
    viewAttachedRecord(record) {
      console.log("Toggling attached medical record:", record);

      // If the same record is clicked again, toggle visibility
      if (this.selectedMessageMedicalRecord === record && this.showMessageMedicalHistoryPopup) {
        this.showMessageMedicalHistoryPopup = false; // Close popup
      } else {
        this.selectedMessageMedicalRecord = record; // Set selected record
        this.showMessageMedicalHistoryPopup = true; // Open popup
      }
    },

    closeMessageMedicalHistoryPopup() {
      this.showMessageMedicalHistoryPopup = false;
    },

    toggleMedicationEdit(patientEmail) {
      // Ensure medicationData exists for the given email
      if (!this.medicationData) {
        this.medicationData = {};
      }

      if (!this.medicationData[patientEmail]) {
        this.medicationData[patientEmail] = {
          name: '',
          dosage: '',
          frequency: '',
          time: '',
          duration: '',
          diagnosis: ''
        };
      }

      // Ensure isEditing.medication exists
      if (!this.isEditing.medication) {
        this.isEditing.medication = {};
      }

      // Toggle the edit state
      this.isEditing.medication[patientEmail] = !this.isEditing.medication[patientEmail];
    },


    cancelMedicationEdit(patientEmail) {
      this.isEditing.medication[patientEmail] = false;
      this.medicationData[patientEmail] = { name: "", dosage: "", frequency: "", time: "", duration: "", diagnosis: "" };
    },


    submitMedication(patientEmail) {
      const medication = { ...this.medicationData[patientEmail] };

      if (!medication.name || !medication.dosage || !medication.frequency ||
        !medication.time || !medication.duration || !medication.diagnosis) {
        alert("Please fill in all medication details before prescribing.");
        return;
      }

      medication.timeToTake = medication.time; // Ensure correct field is used

      fetch("http://localhost:3000/save-medication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: patientEmail,
          medication: medication,
        }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.message === "Medication saved successfully!") {
            alert("Medication prescribed successfully!");

            if (!this.isEditing.medication) {
              this.isEditing.medication = {}; // Ensure object exists
            }
            this.isEditing.medication[patientEmail] = false; // Close form
          } else {
            alert("Failed to save medication. Try again.");
          }
        })
        .catch(error => {
          console.error("Error prescribing medication:", error);
          alert("An error occurred while prescribing the medication.");
        });
    },


    async submitAnswer() {
      if (!this.userInput) return; // Prevent empty submissions

      try {
        // Store user input in the chat and update UI
        this.chatHistory.push({ type: "user", text: this.userInput });
        this.$forceUpdate();

        // Send user input to the backend
        const response = await fetch("/answer-question", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ userInput: this.userInput })
        });

        const data = await response.json();

        // If no message or options are received, log and retry after 1 second
        if (!data.message && !data.options) {
          console.warn("No response received. Retrying in 1 second...");
          return setTimeout(() => this.submitAnswer(), 1000);
        }

        // Add the bot's response to the chat history
        if (data.message) {
          this.chatHistory.push({ type: "bot", text: data.message });
        }
        if (data.options) {
          this.chatHistory.push({ type: "bot", text: data.options.join("\n") });
        }

        // Force UI update and clear user input field
        this.$forceUpdate();
        this.userInput = "";
      } catch (error) {
        console.error("Error communicating with backend:", error);
      }
    },

    async fetchHealthDashboardData() {
      this.isLoading = true; // Start loading state

      try {
        const response = await fetch(`http://localhost:3000/get-health-dashboard?email=${this.user.email}`);
        const data = await response.json();

        console.log("Health Dashboard Data from API:", data); // Debugging

        if (!response.ok) throw new Error(data.message);

        this.healthDashboardData = {
          missedMeds: data.missedMeds || 0,
          recentAppointments: data.recentAppointments || [],
          upcomingAppointments: data.upcomingAppointments || [],
          medicationStats: data.medicationStats || { dates: [], taken: [], missed: [] },
          healthAlerts: data.healthAlerts || [],
          heartRateLogs: data.heartRateLogs || [], // Store heart rate logs
          stepCountLogs: data.stepCountLogs || [],  // Store step count logs
          sleepTrackingLogs: data.sleepTrackingLogs || [] // Store sleep tracking logs
        };

      } catch (error) {
        console.error("Error fetching health dashboard data:", error);
      } finally {
        this.isLoading = false;
      }
    },





    renderMedicationChart() {
      const ctx = document.getElementById("medicationChart");
      if (!ctx) return;

      if (this.medicationChart) {
        this.medicationChart.destroy();
      }

      this.medicationChart = new Chart(ctx.getContext("2d"), {
        type: "bar",
        data: {
          labels: this.healthDashboardData.medicationStats.dates,
          datasets: [
            {
              label: "Taken",
              data: this.healthDashboardData.medicationStats.taken,
              backgroundColor: "rgba(75, 192, 192, 0.6)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
            {
              label: "Missed",
              data: this.healthDashboardData.medicationStats.missed,
              backgroundColor: "rgba(255, 99, 132, 0.6)",
              borderColor: "rgba(255, 99, 132, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: {
                color: "white", // X-axis labels color
                font: { size: 14 } // Adjust font size if needed
              },
              grid: {
                color: "rgba(255, 255, 255, 0.2)" // Light grid lines
              }
            },
            y: {
              ticks: {
                color: "white", // Y-axis labels color
                font: { size: 14 },
                stepSize: 1, // Ensures numbers increment by 1
                precision: 0 // Prevents decimal places
              },
              grid: {
                color: "rgba(255, 255, 255, 0.2)" // Light grid lines
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: "white", // Legend labels color
                font: { size: 14 }
              }
            }
          }
        }
      });
    },



    renderHeartRateChart() {
      const ctx = document.getElementById("heartRateChart");
      if (!ctx) return;

      if (this.heartRateChart) {
        this.heartRateChart.destroy();
      }

      // Ensure there is data
      if (!this.healthDashboardData.heartRateLogs || this.healthDashboardData.heartRateLogs.length === 0) {
        console.warn("No heart rate data found");
        return;
      }

      // Slice to get the most recent 20 entries
      const recentEntries = this.healthDashboardData.heartRateLogs.slice(-20);

      const labels = recentEntries.map(entry => new Date(entry.time).toLocaleTimeString());
      const heartRateData = recentEntries.map(entry => parseInt(entry.value));

      this.heartRateChart = new Chart(ctx.getContext("2d"), {
        type: "line",
        data: {
          labels: labels,
          datasets: [{
            label: "Heart Rate (BPM)",
            data: heartRateData,
            borderColor: "rgba(255, 99, 132, 1)",
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderWidth: 2,
            fill: true,
            pointBackgroundColor: "white",
            pointRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: { color: "white" },
              grid: { color: "rgba(255, 255, 255, 0.2)" },
            },
            y: {
              ticks: { color: "white", precision: 0 },
              grid: { color: "rgba(255, 255, 255, 0.2)" },
            },
          },
          plugins: {
            legend: {
              labels: { color: "white" },
            },
          },
        },
      });
    },



    renderStepCountChart() {
      const ctx = document.getElementById("stepCountChart");
      if (!ctx) return;

      if (this.stepCountChart) {
        this.stepCountChart.destroy();
      }

      if (!this.healthDashboardData.stepCountLogs || this.healthDashboardData.stepCountLogs.length === 0) {
        console.warn("No step count data found");
        return;
      }

      // Step 1: Track only the latest step count entry per day
      const stepDataByDate = {};

      this.healthDashboardData.stepCountLogs.forEach(entry => {
        const date = new Date(entry.time).toLocaleDateString(); // Get only the date
        const steps = parseInt(entry.value);

        // Keep only the most recent value for each day
        stepDataByDate[date] = steps;
      });

      // Step 2: Extract the last 7 days of step data
      const sortedDates = Object.keys(stepDataByDate).sort((a, b) => new Date(a) - new Date(b));
      const recentDates = sortedDates.slice(-7); // Get last 7 days

      // Step 3: Get step counts for those days
      const stepCountData = recentDates.map(date => stepDataByDate[date] || 0);

      // Step 4: Render the chart
      this.stepCountChart = new Chart(ctx.getContext("2d"), {
        type: "line",
        data: {
          labels: recentDates, // X-axis: Last 7 days
          datasets: [{
            label: "Steps Taken Per Day",
            data: stepCountData, // Y-axis: Latest step count per day
            borderColor: "rgba(54, 162, 235, 1)",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderWidth: 2,
            fill: true,
            pointBackgroundColor: "white",
            pointRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: { color: "white" },
              grid: { color: "rgba(255, 255, 255, 0.2)" },
            },
            y: {
              ticks: { color: "white", precision: 0 },
              grid: { color: "rgba(255, 255, 255, 0.2)" },
            },
          },
          plugins: {
            legend: {
              labels: { color: "white" },
            },
          },
        },
      });
    },





    renderSleepTrackingChart() {
      const ctx = document.getElementById("sleepTrackingChart");
      if (!ctx) return;

      if (this.sleepTrackingChart) {
        this.sleepTrackingChart.destroy();
      }

      if (!this.healthDashboardData.sleepTrackingLogs || this.healthDashboardData.sleepTrackingLogs.length === 0) {
        console.warn("No sleep tracking data found");
        return;
      }

      // Step 1: Track only the latest sleep duration entry per day
      const sleepDataByDate = {};

      this.healthDashboardData.sleepTrackingLogs.forEach(entry => {
        const date = new Date(entry.time).toLocaleDateString(); // Extract date only
        const sleepHours = parseInt(entry.value);

        // Keep only the most recent value for each day
        sleepDataByDate[date] = sleepHours;
      });

      // Step 2: Get the last 7 days of sleep data
      const sortedDates = Object.keys(sleepDataByDate).sort((a, b) => new Date(a) - new Date(b));
      const recentDates = sortedDates.slice(-7); // Keep only last 7 days

      // Step 3: Extract sleep duration values for those days
      const sleepData = recentDates.map(date => sleepDataByDate[date] || 0);

      // Step 4: Render the chart
      this.sleepTrackingChart = new Chart(ctx.getContext("2d"), {
        type: "line",
        data: {
          labels: recentDates, // X-axis: Last 7 days
          datasets: [{
            label: "Sleep Duration (Hours)",
            data: sleepData, // Y-axis: Latest sleep duration per day
            borderColor: "rgb(54, 66, 235)",
            backgroundColor: "rgba(123, 54, 235, 0.2)",
            borderWidth: 2,
            fill: true,
            pointBackgroundColor: "white",
            pointRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: { color: "white" },
              grid: { color: "rgba(255, 255, 255, 0.2)" },
            },
            y: {
              ticks: { color: "white", precision: 0 },
              grid: { color: "rgba(255, 255, 255, 0.2)" },
            },
          },
          plugins: {
            legend: {
              labels: { color: "white" },
            },
          },
        },
      });
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }
  },




  mounted() {
    this.fetchHealthDashboardData(); // Fetch data initially

    // Ensure the charts render on mount
    this.$nextTick(() => {
      this.renderMedicationChart();
      this.renderHeartRateChart();
      this.renderStepCountChart();
      this.renderSleepTrackingChart();
    });

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

    this.$nextTick(() => {
      const chatContainer = this.$refs.chatMessages;

      if (chatContainer) {
        chatContainer.addEventListener('scroll', this.handleUserScroll); // Attach scroll event listener
      }
    });

    // Set up periodic message fetching every 2 seconds
    setInterval(() => {
      if (this.selectedContact) {
        this.fetchMessages();
      }
    }, 2000);

    // **🔹 Implement the 5-minute wearable data logging**
    setInterval(async () => {
      const newData = await fetchWearableData(); // Get latest health data

      if (this.shouldLogData(newData)) { // Only log if there’s a meaningful change
        await this.logWearableData(newData);
        console.log("Logged new health data:", newData);
      }
    }, 300000); // Log every 5 minutes (300000 ms)
  },

  beforeUnmount() {
    const chatContainer = this.$refs.chatMessages;

    if (chatContainer) {
      chatContainer.removeEventListener('scroll', this.handleUserScroll); // Clean up scroll event listener
    }

    document.removeEventListener("keydown", this.handleEnterKey);
    window.removeEventListener("popstate", this.handleRouteChange);
    document.removeEventListener("touchstart", this.handleTouchStart);
    document.removeEventListener("touchmove", this.handleTouchMove);
    document.removeEventListener("touchend", this.handleTouchEnd);

    document.removeEventListener("click", this.closeConfirmationPopup);
  },
});

app.mount("#app");
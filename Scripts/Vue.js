const app = Vue.createApp({
  data() {
      return {
          menuActive: false,
          searchActive: false,
          searchQuery: "",
          currentView: "home",
          touchStartX: 0,  // For swipe detection
          touchEndX: 0
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
      handleTouchStart(event) {
          this.touchStartX = event.touches[0].clientX;
      },
      handleTouchMove(event) {
          this.touchEndX = event.touches[0].clientX;
      },
      handleTouchEnd() {
          if (this.menuActive && this.touchStartX - this.touchEndX > 50) {
              // If swiped left by at least 50px, close menu
              this.closeMenu();
          }
      },
      handleClickOutside(event) {
          const menu = document.querySelector(".menu-panel");
          const menuButton = document.querySelector(".menu-btn");

          if (this.menuActive && !menu.contains(event.target) && !menuButton.contains(event.target)) {
              this.closeMenu();
          }
      }
  },
  mounted() {
      document.addEventListener("touchstart", this.handleTouchStart);
      document.addEventListener("touchmove", this.handleTouchMove);
      document.addEventListener("touchend", this.handleTouchEnd);
  },
  beforeUnmount() {
      document.removeEventListener("touchstart", this.handleTouchStart);
      document.removeEventListener("touchmove", this.handleTouchMove);
      document.removeEventListener("touchend", this.handleTouchEnd);
      document.removeEventListener("click", this.handleClickOutside);
  }
});

app.mount("#app");

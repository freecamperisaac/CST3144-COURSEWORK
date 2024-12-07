const BASE_URL = "https://cst3144-coursework-backened.onrender.com";  // Base URL for API endpoints

// Vue.js instance
var webStore = new Vue({
  el: "#app", // Mount point for the Vue instance
  data: {
    showCourse: true,
    showSummary: false,
    order: {
      // Customer order details
      firstName: "",
      lastName: "",
      phoneNumber: "",
      address: "",
      Town: "",
      emirate: "",
      zip: "",
      gift: false,
    },
    courses: [],// List of courses fetched from the backend
    cart:[], // Array of course IDs added to the cart
    emirates: {
        AD: 'Abu Dhabi',
        DBX: 'Dubai',
        SHA: 'Sharjah',
        RAK: 'Ras Al Khaimah'
    },
    searchTerm: "",
    sortKey: "", // Default sorting by title
    sortOrder: "asc", // Default sorting order
    toastMessage: null, // Message for the toast notification
    toastTimeout: null, // Reference to clear existing toast timeout
    totalOrderPrice: 0, // To track the accumulated price
  },
  computed: {
    filteredCourses() {
      // Filter and sort the courses based on user input
      let filtered = this.courses.filter((course) =>
        course.title.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      return filtered.sort((a, b) => {
        let modifier = this.sortOrder === "asc" ? 1 : -1;
        if (this.sortKey === "price" || this.sortKey === "rating") {
          return (a[this.sortKey] - b[this.sortKey]) * modifier;
        } else if (this.sortKey === "location") {
          return a.location.localeCompare(b.location) * modifier;
        }
        return a.title.localeCompare(b.title) * modifier;
      });
    },
    cartItemCount() { // Total number of items in the cart
      return this.cart.length || 0;
    },
    cartItems() {  // Unique list of courses in the cart
      return [...new Set(this.cart)].map((id) =>
        this.courses.find((course) => course._id === id)
      );
    },
    // Calculate the total price of items in the cart
    totalPrice() {
      return this.cartItems.reduce(
        (total, course) => total + course.price * this.cartCount(course._id),
        0
      );
    },
      // Check if the order form is fully filled out
    isOrderFormComplete() {
      const { firstName, lastName, phoneNumber, address, Town, emirate, zip } =
        this.order;
      return (
        firstName &&
        lastName &&
        phoneNumber &&
        address &&
        Town &&
        emirate &&
        zip
      );
    },
  },
  methods: {
    // Fetch courses from the backend
    async fetchCourses() {
      try {
        const response = await fetch(`${BASE_URL}/collection/courses`);
        const data = await response.json();
        this.courses = data;
      } catch (error) {
        console.error("Error fetching courses:", error);
        this.toastMessage = "Failed to load courses.";
        setTimeout(() => (this.toastMessage = ""), 3000);
      }
    },
    imageLink(image) {
      return `https://cst3144-coursework-backened.onrender.com/images/${image}`;
      },
    // Input validation methods
    validateFirstName() {
      if (!/^[a-zA-Z\s]+$/.test(this.order.firstName))
        this.order.firstName = "";
    },
    validateLastName() {
      if (!/^[a-zA-Z\s]+$/.test(this.order.lastName)) this.order.lastName = "";
    },
    validatePhoneNumber() {
      if (!/^\d{0,10}$/.test(this.order.phoneNumber))
        this.order.phoneNumber = "";
    },
    validateAddress() {
      if (!/^[a-zA-Z0-9\s]+$/.test(this.order.address)) this.order.address = "";
    },
    validateTown() {
      if (!/^[a-zA-Z0-9\s]+$/.test(this.order.Town)) this.order.Town = "";
    },
    validateZip() {
      if (!/^\d{1,6}$/.test(this.order.zip)) {
        this.order.zip = "";
      }
    },
      // Adds a course to the cart
    addToCart(course) {
      if (this.cartCount(course._id) < course.availableInventory) {
        this.cart.push(course._id);
        this.showToast("Course Added to Cart");
      }
    },
    // Submit the order form
    submitForm() {
      if (!this.isOrderFormComplete) {
        alert("Please fill in all required fields.");
        return;
      }
      // Prepare order payload
      const orderPayload = {
        cart: this.cartItems.map((item) => ({
          id: item._id,
          title: item.title,
          price: item.price,
          quantity: this.cartCount(item._id),
        })),
        order: this.order,
      };

      fetch(`${BASE_URL}/add-to-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message) {
            alert(data.message);// Show confirmation
            this.showCourse = true; // Reset the view to courses
            this.cart = []; // Clear the cart
            this.showSummary = true;// Show the summary page
            this.showCourse = false;
            
          }
        })
        .catch((err) => {
          console.error("Error submitting order:", err);
          this.showToast("Failed to place order. Try again later.");
        });
    },
    // Display a temporary toast notification
    showToast(message) {
      this.toastMessage = message;

      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
      }

      this.toastTimeout = setTimeout(() => {
        this.toastMessage = null;
      }, 3000);
    },
    // Helper methods for cart operations, cousrse availability
    spacesAvailable(course) {
      return course.availableInventory - this.cartCount(course._id);
    },
    cartCount(id) {
      return this.cart.filter((item) => item === id).length;
    },
    canAddToCart(course) {
      return this.cartCount(course._id) < course.availableInventory;
    },
    increaseItem(id) {
      const course = this.courses.find((course) => course._id === id);
      if (this.cartCount(id) < course.availableInventory) {
        this.cart.push(id);
        
      }
    },

    decreaseItem(id) {
      const index = this.cart.indexOf(id);
      if (index !== -1) {
        this.cart.splice(index, 1);
       
      }
    },
  
 
    //navigation methods
    showCheckout() {
      this.showSummary = false; //Hide the summary
      this.showCourse = false; //show the checkout page
    },
    goHome() {
      this.showCourse = true; //show the course list
      this.showSummary = false; //hide the summary
      this.cart = []; //clear the cart
      
    },
    //sort courses
    changeSortKey(key) { //set the sort key
      this.sortKey = key;
    },
    toggleSortOrder() { //toggle sort order
      this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
    },
    removeItem(id) {
      const index = this.cart.indexOf(id);
      if (index !== -1) {
        this.cart.splice(index, 1); //Remove the item from the cart
        
        this.showToast("Item removed from cart"); 
      }
    },
  
  },
  mounted() { // Fetch courses when the app is initialized
    this.fetchCourses();
  },
});

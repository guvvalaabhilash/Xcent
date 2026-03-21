const state = {
  role: localStorage.getItem("hms_role") || "guest",
  token: localStorage.getItem("hms_token") || "",
  page: "dashboard",
  theme: localStorage.getItem("hms_theme") || "light",
  bookingStep: 1,
  selectedPatientId: "p1",
  notifications: [
    { id: "n1", text: "New appointment request from Priya.", time: "2m ago" },
    { id: "n2", text: "Invoice INV-1091 pending approval.", time: "11m ago" },
  ],
  users: [
    { id: "u1", fullName: "Asha Verma", role: "doctor", status: "active" },
    { id: "u2", fullName: "Rohan Singh", role: "patient", status: "inactive" },
    { id: "u3", fullName: "Priya Nair", role: "receptionist", status: "active" },
  ],
  appointments: [
    { id: "a1", patient: "Rohan Singh", doctor: "Dr. Mehta", date: "2026-03-23", slot: "10:30", status: "pending" },
    { id: "a2", patient: "Anita Roy", doctor: "Dr. Shah", date: "2026-03-23", slot: "12:00", status: "completed" },
    { id: "a3", patient: "Kiran Das", doctor: "Dr. Mehta", date: "2026-03-24", slot: "16:00", status: "critical" },
  ],
  records: [
    { id: "r1", title: "Blood Report", type: "report", progress: 100 },
    { id: "r2", title: "Chest Scan", type: "scan", progress: 72 },
    { id: "r3", title: "Prescription - Feb", type: "prescription", progress: 100 },
  ],
  bills: [
    { id: "b1", invoice: "INV-1091", patient: "Rohan Singh", amount: 3400, status: "pending" },
    { id: "b2", invoice: "INV-1092", patient: "Anita Roy", amount: 6200, status: "paid" },
  ],
  doctorPatients: [
    { id: "p1", name: "Rohan Singh", age: 34, issue: "Acid reflux", status: "pending", notes: "Continue antacid for 5 days." },
    { id: "p2", name: "Anita Roy", age: 47, issue: "Migraine", status: "completed", notes: "Reduce screen time." },
    { id: "p3", name: "Kiran Das", age: 62, issue: "Chest pain follow-up", status: "critical", notes: "Monitor ECG every 8h." },
  ],
  patientJourneyStep: 1,
  patientCompleted: {
    profile: false,
    booking: false,
    chat: false,
    prescriptions: false,
  },
  patientProfile: {
    name: "Rohan Singh",
    age: "34",
    gender: "Male",
    contact: "+91 90000 11111",
    email: "rohan@example.com",
  },
  patientChat: [
    { who: "bot", text: "Hi, I am CareAssist. Tell me how you feel today." },
  ],
  onboardingIndex: 0,
  intakeStep: 1,
  intake: {
    problem: "",
    name: "Rohan Singh",
    age: "34",
    gender: "Male",
  },
  bookingPremiumStep: 1,
  selectedDoctor: "",
  selectedSlot: "",
  paymentMethod: "",
};

const orbitImages = [
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=120&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1576671081837-49000212a370?w=120&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=120&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?w=120&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581595219315-a187dd40c322?w=120&q=80&auto=format&fit=crop",
];

let orbitAnimationFrame = null;
let onboardingTimer = null;

const navConfig = [
  { id: "dashboard", label: "Dashboard" },
  { id: "appointments", label: "Appointments" },
  { id: "records", label: "Records" },
  { id: "billing", label: "Billing" },
  { id: "users", label: "Users" },
];

const pageContainer = document.getElementById("pageContainer");
const entryScreen = document.getElementById("entryScreen");
const appShell = document.getElementById("appShell");
const roleTag = document.getElementById("roleTag");
const mainNav = document.getElementById("mainNav");
const mobileNav = document.getElementById("mobileNav");
const filtersPanel = document.getElementById("filtersPanel");
const toastRoot = document.getElementById("toastRoot");
const modalRoot = document.getElementById("modalRoot");
const notificationPanel = document.getElementById("notificationPanel");
const profileDropdown = document.getElementById("profileDropdown");
const settingsPanel = document.getElementById("settingsPanel");

function init() {
  if (state.theme === "dark") document.body.classList.add("dark");
  renderEntry();
  bindGlobalActions();
  if (state.token) enterApp();
}

function renderEntry() {
  entryScreen.innerHTML = `
    <section class="entry-hero">
      <div id="onboardingSlider" class="onboarding-slider"></div>
      <div class="onboarding-controls">
        <button id="skipOnboarding" class="btn btn-ghost">Skip</button>
        <div id="onboardingDots" class="onboarding-dots"></div>
      </div>
      <div class="quick-row">
        <button class="btn" data-quick="patient">Continue as Patient</button>
        <button class="btn btn-ghost" data-quick="guest-book">Quick Appointment</button>
        <button class="btn btn-ghost" data-quick="admin">Login as Admin</button>
        <button class="btn btn-ghost" id="emergencyAccess">Emergency Quick Access</button>
      </div>
    </section>
    <section class="entry-auth">
      <h2>Welcome to MediFlow Plus</h2>
      <div class="tab-row">
        <button class="btn" data-tab="login">Login</button>
        <button class="btn btn-ghost" data-tab="register">Register</button>
      </div>
      <div id="authTabContent"></div>
    </section>
  `;
  renderAuthTab("login");
  initOnboardingSlides();
  entryScreen.querySelectorAll("[data-tab]").forEach((btn) => btn.addEventListener("click", () => renderAuthTab(btn.dataset.tab)));
  entryScreen.querySelectorAll("[data-quick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.quick;
      state.role = mode === "guest-book" ? "patient" : mode;
      state.token = `demo-${state.role}`;
      persistSession();
      enterApp();
      if (mode === "guest-book") {
        state.page = "dashboard";
        state.patientJourneyStep = 2;
        renderPage();
      }
      toast("Signed in demo mode", "success");
    });
  });
  const emergencyBtn = document.getElementById("emergencyAccess");
  if (emergencyBtn) emergencyBtn.addEventListener("click", () => toast("Emergency quick access enabled (demo)", "error"));
}

function initOnboardingSlides() {
  const slider = document.getElementById("onboardingSlider");
  const dots = document.getElementById("onboardingDots");
  const skipBtn = document.getElementById("skipOnboarding");
  if (!slider || !dots) return;
  const slides = [
    { title: "Your Health Starts Here", text: "Start a guided healthcare journey crafted for your wellbeing.", image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80&auto=format&fit=crop" },
    { title: "Smart Care for a Better Life", text: "Discover specialists, smart tips, and seamless consultations.", image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&q=80&auto=format&fit=crop" },
    { title: "Track. Treat. Thrive.", text: "From symptoms to booking and history, everything in one place.", image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=1200&q=80&auto=format&fit=crop" },
    { title: "Premium Care, Daily", text: "Hospital-grade workflows with startup-level product polish.", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80&auto=format&fit=crop" },
  ];
  const render = () => {
    const slide = slides[state.onboardingIndex];
    slider.innerHTML = `<div class="onboarding-slide fade" style="background-image:url('${slide.image}')"><div class="onboarding-overlay"><h1>${slide.title}</h1><p>${slide.text}</p></div></div>`;
    dots.innerHTML = slides.map((_, i) => `<button class="dot ${i === state.onboardingIndex ? "active" : ""}" data-dot="${i}"></button>`).join("");
    dots.querySelectorAll("[data-dot]").forEach((btn) => btn.addEventListener("click", () => {
      state.onboardingIndex = Number(btn.dataset.dot);
      render();
    }));
  };
  if (onboardingTimer) clearInterval(onboardingTimer);
  onboardingTimer = setInterval(() => {
    state.onboardingIndex = (state.onboardingIndex + 1) % slides.length;
    render();
  }, 3600);
  let startX = 0;
  slider.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX));
  slider.addEventListener("touchend", (e) => {
    const delta = e.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 35) {
      state.onboardingIndex = delta < 0 ? (state.onboardingIndex + 1) % slides.length : (state.onboardingIndex - 1 + slides.length) % slides.length;
      render();
    }
  });
  if (skipBtn) skipBtn.addEventListener("click", () => {
    state.onboardingIndex = slides.length - 1;
    render();
  });
  render();
}

function getOrbitPoint(progress, shape, radiusX, radiusY) {
  const angle = progress * Math.PI * 2;
  if (shape === "infinity") {
    return {
      x: Math.sin(angle) * radiusX,
      y: Math.sin(angle * 2) * (radiusY * 0.5),
    };
  }
  if (shape === "wave") {
    return {
      x: (progress * 2 - 1) * radiusX,
      y: Math.sin(progress * Math.PI * 6) * (radiusY * 0.5),
    };
  }
  return {
    x: Math.cos(angle) * radiusX,
    y: Math.sin(angle) * radiusY,
  };
}

function initHeroOrbit() {
  const host = document.getElementById("heroOrbit");
  if (!host) return;

  if (orbitAnimationFrame) cancelAnimationFrame(orbitAnimationFrame);

  host.innerHTML = `
    <div class="orbit-scaling-container orbit-scaling-container--responsive">
      <div class="orbit-rotation-wrapper">
      <div class="orbit-track"></div>
      <div class="orbit-center-content">
        <strong>24/7 Care</strong>
        <small>Role-Based Workflow</small>
      </div>
      </div>
    </div>
  `;

  const stage = host.querySelector(".orbit-rotation-wrapper");
  const shape = "ellipse";
  const radiusX = 180;
  const radiusY = 70;
  const speed = 0.02;
  const orbitItems = orbitImages.map((src, index) => {
    const node = document.createElement("div");
    node.className = "orbit-item orbit-avatar";
    node.innerHTML = `<img src="${src}" alt="Healthcare visual ${index + 1}" draggable="false" class="orbit-image" />`;
    stage.appendChild(node);
    return node;
  });

  const start = performance.now();
  const animateOrbit = (time) => {
    const elapsed = (time - start) / 1000;
    orbitItems.forEach((item, index) => {
      const baseProgress = (elapsed * speed + index / orbitItems.length) % 1;
      const point = getOrbitPoint(baseProgress, shape, radiusX, radiusY);
      item.style.transform = `translate(${point.x}px, ${point.y}px)`;
    });
    orbitAnimationFrame = requestAnimationFrame(animateOrbit);
  };
  orbitAnimationFrame = requestAnimationFrame(animateOrbit);
}

function renderAuthTab(tab) {
  const authTabContent = document.getElementById("authTabContent");
  if (!authTabContent) return;
  if (tab === "register") {
    authTabContent.innerHTML = `
      <form id="registerForm" class="grid">
        <input name="fullName" placeholder="Full Name" required />
        <input name="email" type="email" placeholder="Email" required />
        <input id="registerPassword" type="password" placeholder="Password" required />
        <div class="progress-line"><span id="passwordStrength" style="width:0%"></span></div>
        <select name="role"><option value="patient">Patient</option><option value="doctor">Doctor</option><option value="receptionist">Reception</option></select>
        <button class="btn" type="submit">Create Account</button>
        <button class="btn btn-ghost" type="button" id="otpSimBtn">Verify via OTP</button>
      </form>
    `;
    const passInput = document.getElementById("registerPassword");
    const passBar = document.getElementById("passwordStrength");
    if (passInput && passBar) {
      passInput.addEventListener("input", () => {
        const score = Math.min(100, passInput.value.length * 10);
        passBar.style.width = `${score}%`;
      });
    }
    const otpSimBtn = document.getElementById("otpSimBtn");
    if (otpSimBtn) otpSimBtn.addEventListener("click", () => openModal("Email Verification", "<p>OTP verified successfully (simulation).</p>"));
    document.getElementById("registerForm").addEventListener("submit", (e) => {
      e.preventDefault();
      toast("Registered successfully in demo mode", "success");
      renderAuthTab("login");
    });
    return;
  }
  authTabContent.innerHTML = `
    <form id="loginForm" class="grid">
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button class="btn" type="submit">Login</button>
      <button type="button" id="googleLoginBtn" class="btn btn-ghost">Google Sign-In</button>
      <div class="tab-row">
        <button type="button" class="btn btn-ghost">Apple</button>
        <button type="button" class="btn btn-ghost">Facebook</button>
      </div>
    </form>
  `;
  const googleLoginBtn = document.getElementById("googleLoginBtn");
  if (googleLoginBtn) googleLoginBtn.addEventListener("click", () => {
    state.role = "patient";
    state.token = "demo-google-patient";
    persistSession();
    enterApp();
    toast("Google sign-in successful (demo)", "success");
  });
  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    state.role = "patient";
    state.token = "demo-patient";
    persistSession();
    enterApp();
    toast("Logged in as patient", "success");
  });
}

function enterApp() {
  entryScreen.classList.add("hidden");
  appShell.classList.remove("hidden");
  roleTag.textContent = state.role.toUpperCase();
  renderNav();
  renderFlowingMenu();
  renderFilters();
  renderNotificationPanel();
  renderPage();
  document.getElementById("fabButton").classList.remove("hidden");
}

function persistSession() {
  localStorage.setItem("hms_token", state.token);
  localStorage.setItem("hms_role", state.role);
}

function renderNav() {
  const filteredNav = state.role === "patient" ? [{ id: "dashboard", label: "My Journey" }] : navConfig;
  const navMarkup = filteredNav.map((item) => `<button class="nav-btn ${state.page === item.id ? "active" : ""}" data-page="${item.id}">${item.label}</button>`).join("");
  mainNav.innerHTML = navMarkup;
  mainNav.insertAdjacentHTML("beforeend", `<div id="flowingMenuMount"></div>`);
  mobileNav.innerHTML = navMarkup;
  document.querySelectorAll("[data-page]").forEach((btn) => btn.addEventListener("click", () => {
    state.page = btn.dataset.page;
    renderPage();
  }));
}

function renderFlowingMenu() {
  const mount = document.getElementById("flowingMenuMount");
  if (!mount) return;
  const items = [
    { link: "#", text: "Emergency Desk", image: "https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=300&q=80&auto=format&fit=crop" },
    { link: "#", text: "Lab Reports", image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=300&q=80&auto=format&fit=crop" },
    { link: "#", text: "Insurance Help", image: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=300&q=80&auto=format&fit=crop" },
  ];
  mount.innerHTML = `<div class="menu-wrap"><nav class="menu">${items.map((item) => `
    <div class="menu__item">
      <a class="menu__item-link" href="${item.link}">${item.text}</a>
      <div class="marquee">
        <div class="marquee__inner-wrap">
          <div class="marquee__inner" aria-hidden="true"></div>
        </div>
      </div>
    </div>
  `).join("")}</nav></div>`;

  const distMetric = (x, y, x2, y2) => {
    const xd = x - x2;
    const yd = y - y2;
    return xd * xd + yd * yd;
  };

  const findClosestEdge = (mouseX, mouseY, width, height) => {
    const topEdgeDist = distMetric(mouseX, mouseY, width / 2, 0);
    const bottomEdgeDist = distMetric(mouseX, mouseY, width / 2, height);
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };

  const setupItem = (menuItem, idx) => {
    const marquee = menuItem.querySelector(".marquee");
    const marqueeInner = menuItem.querySelector(".marquee__inner");
    const text = items[idx].text;
    const image = items[idx].image;
    const repetitions = 5;
    marqueeInner.innerHTML = Array.from({ length: repetitions })
      .map(
        () => `<div class="marquee__part"><span>${text}</span><div class="marquee__img" style="background-image:url('${image}')"></div></div>`
      )
      .join("");

    const firstPart = marqueeInner.querySelector(".marquee__part");
    if (firstPart && window.gsap) {
      const contentWidth = firstPart.offsetWidth || 260;
      window.gsap.to(marqueeInner, {
        x: -contentWidth,
        duration: 15,
        ease: "none",
        repeat: -1,
      });
    }

    const animateIn = (ev) => {
      if (!window.gsap) return;
      const rect = menuItem.getBoundingClientRect();
      const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height);
      window.gsap.timeline({ defaults: { duration: 0.6, ease: "expo.out" } })
        .set(marquee, { y: edge === "top" ? "-101%" : "101%" }, 0)
        .set(marqueeInner, { y: edge === "top" ? "101%" : "-101%" }, 0)
        .to([marquee, marqueeInner], { y: "0%" }, 0);
    };

    const animateOut = (ev) => {
      if (!window.gsap) return;
      const rect = menuItem.getBoundingClientRect();
      const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height);
      window.gsap.timeline({ defaults: { duration: 0.6, ease: "expo.out" } })
        .to(marquee, { y: edge === "top" ? "-101%" : "101%" }, 0)
        .to(marqueeInner, { y: edge === "top" ? "101%" : "-101%" }, 0);
    };

    const link = menuItem.querySelector(".menu__item-link");
    link.addEventListener("mouseenter", animateIn);
    link.addEventListener("mouseleave", animateOut);
  };

  mount.querySelectorAll(".menu__item").forEach(setupItem);
}

function renderFilters() {
  filtersPanel.innerHTML = `
    <h3>Smart Filters</h3>
    <div class="grid">
      <select><option>All Roles</option><option>Doctor</option><option>Patient</option></select>
      <select><option>Status</option><option>Pending</option><option>Completed</option><option>Critical</option></select>
      <div class="tab-row">
        <span class="chip">Urgent</span><span class="chip">Today</span><span class="chip">Inpatient</span>
      </div>
    </div>
  `;
}

function renderPage() {
  renderNav();
  pageContainer.innerHTML = skeletonPage();
  setTimeout(() => {
    if (state.page === "dashboard") renderDashboard();
    if (state.page === "appointments") renderAppointments();
    if (state.page === "records") renderRecords();
    if (state.page === "billing") renderBilling();
    if (state.page === "users") renderUsers();
    bindScopedActions();
  }, 280);
}

function skeletonPage() {
  return `<div class="grid"><div class="card"><div class="skeleton" style="height:22px"></div><div class="skeleton" style="height:16px;margin-top:8px"></div></div><div class="card"><div class="skeleton" style="height:120px"></div></div></div>`;
}

function renderDashboard() {
  if (state.role === "doctor") return renderDoctorDashboard();
  if (state.role === "patient") return renderPatientDashboard();
  if (state.role === "receptionist") return renderReceptionDashboard();
  pageContainer.innerHTML = `
    <div class="grid stats-grid">
      <article class="card"><h4>Total Patients</h4><h2>1,294</h2><p class="muted">+8.3% this week</p></article>
      <article class="card"><h4>Today's Appointments</h4><h2>86</h2><p class="muted">24 pending approvals</p></article>
      <article class="card"><h4>Revenue</h4><h2>$42,190</h2><p class="muted">Monthly projection</p></article>
      <article class="card"><h4>Critical Alerts</h4><h2>4</h2><p class="muted">Needs immediate review</p></article>
    </div>
    <div class="grid two-col">
      <section class="card"><h3>Analytics</h3><div class="skeleton" style="height:220px"></div></section>
      <section class="card"><h3>Department Performance</h3><div class="skeleton" style="height:220px"></div></section>
    </div>
    <section class="card">
      <div class="tab-row"><h3 style="margin-right:auto">Hospital Users</h3><button class="btn btn-ghost" id="bulkActionBtn">Bulk Action</button></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th><input type="checkbox" id="selectAllUsers" /></th><th>Name</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${state.users.map((u) => `<tr><td><input type="checkbox" class="user-check" /></td><td>${u.fullName}</td><td>${u.role}</td><td>${u.status}</td><td><button data-user-action="view" data-id="${u.id}">View</button><button data-user-action="edit" data-id="${u.id}">Edit</button><button data-user-action="delete" data-id="${u.id}">Delete</button></td></tr>`).join("")}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderDoctorDashboard() {
  const selected = state.doctorPatients.find((p) => p.id === state.selectedPatientId) || state.doctorPatients[0];
  pageContainer.innerHTML = `
    <div class="two-col">
      <section class="card">
        <h3>Appointments Queue</h3>
        ${state.doctorPatients.map((p) => `<button class="nav-btn ${selected.id === p.id ? "active" : ""}" data-patient="${p.id}">${p.name} <span class="chip ${p.status}">${p.status}</span></button>`).join("")}
      </section>
      <section class="card">
        <h3>Patient Focus Panel</h3>
        <p><strong>${selected.name}</strong>, ${selected.age}</p>
        <p class="muted">${selected.issue}</p>
        <label>Prescription</label>
        <textarea id="doctorNotes">${selected.notes}</textarea>
        <button class="btn" id="saveDoctorNotes">Save Notes</button>
      </section>
    </div>
  `;
}

function renderPatientDashboard() {
  const steps = [
    { key: "profile", label: "1. Profile", done: state.patientCompleted.profile },
    { key: "booking", label: "2. Book Appointment", done: state.patientCompleted.booking },
    { key: "chat", label: "3. Consultation / Chat", done: state.patientCompleted.chat },
    { key: "prescriptions", label: "4. Prescriptions", done: state.patientCompleted.prescriptions },
    { key: "history", label: "5. History", done: false },
  ];
  const canOpen = (index) => index + 1 <= state.patientJourneyStep;
  pageContainer.innerHTML = `
    <section class="card patient-journey">
      <div class="tab-row patient-step-row">
        ${steps
          .map(
            (s, i) =>
              `<button class="patient-step ${state.patientJourneyStep === i + 1 ? "active" : ""} ${s.done ? "done" : ""}" data-journey-step="${i + 1}" ${canOpen(i) ? "" : "disabled"}>${s.label}</button>`
          )
          .join("")}
      </div>
      <div class="journey-panel">
        ${renderPatientJourneyStep()}
      </div>
    </section>
  `;
}

function renderPatientJourneyStep() {
  if (state.patientJourneyStep === 1) {
    const strength = Math.min(100, Math.round((Object.values(state.patientProfile).filter(Boolean).length / 5) * 100));
    return `
      <div class="grid">
        <h3>Guided Intake</h3>
        <div class="stepper">
          <span class="step ${state.intakeStep >= 1 ? "active" : ""}"></span>
          <span class="step ${state.intakeStep >= 2 ? "active" : ""}"></span>
          <span class="step ${state.intakeStep >= 3 ? "active" : ""}"></span>
        </div>
        <div class="card">
          ${
            state.intakeStep === 1
              ? `<label>Tell us your problem</label>
                 <input id="problemInput" value="${state.intake.problem}" placeholder="Type symptoms here..." />
                 <div class="quick-row">
                   <button data-problem="Fever">Fever 🌡️</button>
                   <button data-problem="Cold">Cold 🤧</button>
                   <button data-problem="Headache">Headache 🤕</button>
                   <button data-problem="Stomach Pain">Stomach Pain 🤢</button>
                 </div>
                 <button class="btn" id="nextIntakeBtn">Continue</button>`
              : ""
          }
          ${
            state.intakeStep === 2
              ? `<div class="two-col">
                  <label>Name<input id="intakeName" value="${state.intake.name}" /></label>
                  <label>Age<input id="intakeAge" value="${state.intake.age}" /></label>
                  <label>Gender<input id="intakeGender" value="${state.intake.gender}" /></label>
                  <label>Contact<input id="pContact" value="${state.patientProfile.contact}" /></label>
                  <label>Email<input id="pEmail" value="${state.patientProfile.email}" /></label>
                </div>
                <p class="muted">Profile completion</p>
                <div class="progress-line"><span style="width:${strength}%"></span></div>
                <button class="btn" id="nextIntakeBtn">Continue</button>`
              : ""
          }
          ${
            state.intakeStep === 3
              ? `<div class="two-col">
                   <article class="card">
                     <h4>Health Suggestions</h4>
                     <p class="muted">Hydrate, rest, and monitor symptoms for 24 hours.</p>
                     <p class="muted">Possible causes: viral infection, fatigue, weather change.</p>
                   </article>
                   <article class="card">
                     <h4>Healthy Tips</h4>
                     <img class="health-hero" src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=900&q=80&auto=format&fit=crop" alt="Healthy fruits" />
                     <p class="muted">Fruits + balanced diet support faster recovery.</p>
                   </article>
                 </div>
                 <button class="btn" id="saveProfileBtn">Save & Continue</button>`
              : ""
          }
        </div>
      </div>
    `;
  }
  if (state.patientJourneyStep === 2) {
    const steps = [1, 2, 3, 4]
      .map((n) => `<span class="step ${state.bookingPremiumStep >= n ? "active" : ""}"></span>`)
      .join("");
    return `
      <div class="grid">
        <h3>Premium Booking Flow</h3>
        <div class="stepper">${steps}</div>
        <div class="card map-placeholder">Nearby Hospitals Map (placeholder)</div>
        <div class="doctor-carousel">
          <article class="doctor-card ${state.selectedDoctor === "d1" ? "selected" : ""}">
            <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80&auto=format&fit=crop" alt="Doctor" />
            <div><strong>Dr. Shah</strong><p class="muted">Internal Medicine • ⭐ 4.7 • 1.8km</p><button data-doctor="d1">Book Now</button></div>
          </article>
          <article class="doctor-card ${state.selectedDoctor === "d2" ? "selected" : ""}">
            <img src="https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&q=80&auto=format&fit=crop" alt="Doctor" />
            <div><strong>Dr. Mehta</strong><p class="muted">General Physician • ⭐ 4.9 • 2.2km</p><button data-doctor="d2">Book Now</button></div>
          </article>
        </div>
        <div class="card">${renderPremiumBookingStep()}</div>
        <div class="card">
          <h4>Basic Medication Suggestion (UI only)</h4>
          <div class="grid stats-grid">
            <article class="card"><strong>Paracetamol</strong><p class="muted">Purpose: fever/mild pain</p><small>General wellness info, not medical advice.</small></article>
            <article class="card"><strong>ORS</strong><p class="muted">Purpose: hydration support</p><small>Consult doctor if symptoms persist.</small></article>
          </div>
        </div>
        <div class="card">
          <h4>Payment</h4>
          <p>Consultation Fee: <strong>$19</strong></p>
          <div class="quick-row"><button data-pay="UPI">UPI</button><button data-pay="Card">Card</button><button data-pay="Net Banking">Net Banking</button></div>
          <button class="btn" id="completePaymentBtn" ${state.paymentMethod ? "" : "disabled"}>Pay & Confirm</button>
        </div>
      </div>
    `;
  }
  if (state.patientJourneyStep === 3) {
    return `
      <div class="grid">
        <h3>Consultation Assistant</h3>
        <div class="chat-shell card">
          <div class="chat-body">
            ${state.patientChat
              .map(
                (m) =>
                  `<div class="chat-bubble ${m.who}">${m.text}</div>`
              )
              .join("")}
            <div class="typing-dots"><span></span><span></span><span></span></div>
          </div>
          <div class="quick-row">
            <button data-chat="I have fever">Fever</button>
            <button data-chat="I have cold">Cold</button>
            <button data-chat="I have headache">Headache</button>
            <button data-chat="Book Doctor Appointment">Book Doctor Appointment</button>
          </div>
        </div>
        <div class="tab-row"><button class="btn" id="completeChatBtn">Mark Consultation Complete</button></div>
      </div>
    `;
  }
  if (state.patientJourneyStep === 4) {
    return `
      <div class="grid">
        <h3>Prescriptions</h3>
        <div class="grid stats-grid">
          ${state.records
            .filter((r) => r.type === "prescription" || r.type === "report")
            .map(
              (r) => `
                <article class="card">
                  <h4>${r.title}</h4>
                  <p class="muted">Dr. Mehta • 21 Mar 2026</p>
                  <p class="muted">Summary: Continue hydration and complete 5-day dosage.</p>
                  <div class="tab-row">
                    <button data-prescription="view">View Details</button>
                    <button data-prescription="download">Download</button>
                  </div>
                </article>
              `
            )
            .join("")}
        </div>
        <div class="tab-row"><button class="btn" id="completePrescriptionsBtn">Continue to History</button></div>
      </div>
    `;
  }
  return `
    <div class="grid">
      <h3>History</h3>
      <div class="card">
        <div class="tab-row">
          <input type="date" />
          <select><option>All Doctors</option><option>Dr. Mehta</option><option>Dr. Shah</option></select>
          <button class="btn btn-ghost">Filter</button>
        </div>
        <div class="timeline">
          ${state.appointments
            .map(
              (a) => `
                <div class="timeline-item">
                  <strong>${a.date} • ${a.doctor}</strong>
                  <p class="muted">Status: ${a.status === "completed" ? "Completed" : "Cancelled / Pending"}</p>
                </div>
              `
            )
            .join("")}
        </div>
      </div>
      <div class="tab-row">
        <button class="btn" data-patient-jump="booking">Book Again</button>
        <button class="btn btn-ghost" data-patient-jump="prescriptions">View Last Prescription</button>
      </div>
    </div>
  `;
}

function unlockPatientStep(doneKey) {
  if (doneKey) state.patientCompleted[doneKey] = true;
  state.patientJourneyStep = Math.min(5, state.patientJourneyStep + 1);
  renderPatientDashboard();
  bindScopedActions();
}

function renderPremiumBookingStep() {
  if (state.bookingPremiumStep === 1) return `<div class="grid"><h4>Select Doctor</h4><button class="btn" id="nextBookingPremium" ${state.selectedDoctor ? "" : "disabled"}>Continue</button></div>`;
  if (state.bookingPremiumStep === 2) return `<div class="grid"><h4>Choose Date</h4><input type="date" id="premiumDate" /><button class="btn" id="nextBookingPremium">Continue</button></div>`;
  if (state.bookingPremiumStep === 3) return `<div class="grid"><h4>Select Time Slot</h4><div class="quick-row"><button data-slot="09:00">09:00</button><button data-slot="10:30">10:30</button><button data-slot="14:00">14:00</button></div><button class="btn" id="nextBookingPremium" ${state.selectedSlot ? "" : "disabled"}>Continue</button></div>`;
  return `<div class="grid"><h4>Confirm Details</h4><p class="muted">Doctor, date and slot selected successfully.</p><button class="btn" id="confirmPremiumBookingBtn">Confirm Appointment</button></div>`;
}

function renderReceptionDashboard() {
  pageContainer.innerHTML = `
    <div class="two-col">
      <section class="card">
        <h3>Fast Entry</h3>
        <form id="receptionForm" class="grid">
          <input autofocus required placeholder="Patient Name" />
          <input required placeholder="Phone Number" pattern="[0-9]{10}" />
          <input required type="date" />
          <button class="btn" type="submit">Register Visit</button>
        </form>
      </section>
      <section class="card"><h3>Queue Snapshot</h3><p class="muted">Minimal-click workflow for check-ins and reassignment.</p><div class="skeleton" style="height:160px"></div></section>
    </div>
  `;
}

function renderAppointments() {
  const steps = [1, 2, 3, 4, 5].map((n) => `<span class="step ${state.bookingStep >= n ? "active" : ""}"></span>`).join("");
  pageContainer.innerHTML = `
    <section class="card">
      <h3>Appointment Booking Flow</h3>
      <div class="stepper">${steps}</div>
      ${renderBookingStep()}
    </section>
  `;
}

function renderBookingStep() {
  if (state.bookingStep === 1) return `<div class="grid"><label>Select Department</label><select id="departmentPick"><option>Cardiology</option><option>Neurology</option><option>Pediatrics</option></select><button class="btn" id="nextStep">Continue</button></div>`;
  if (state.bookingStep === 2) return `<div class="grid"><p>Choose Doctor</p><div class="tab-row"><button class="card">Dr. Mehta <span class="chip">Available</span></button><button class="card">Dr. Shah <span class="chip pending">Busy</span></button></div><button class="btn" id="nextStep">Continue</button></div>`;
  if (state.bookingStep === 3) return `<div class="grid"><label>Pick Date</label><input type="date" /><button class="btn" id="nextStep">Continue</button></div>`;
  if (state.bookingStep === 4) return `<div class="grid"><p>Select Time Slot</p><div class="tab-row"><span class="chip">09:00</span><span class="chip">10:30</span><span class="chip">14:00</span></div><button class="btn" id="nextStep">Continue</button></div>`;
  return `<div class="grid"><label>Problem Description</label><textarea id="problemText"></textarea><button class="btn" id="confirmBooking">Confirm Booking</button></div>`;
}

function renderRecords() {
  pageContainer.innerHTML = `
    <section class="card">
      <h3>Records & Files</h3>
      <div class="tab-row"><button class="btn btn-ghost">Reports</button><button class="btn btn-ghost">Prescriptions</button><button class="btn btn-ghost">Scans</button></div>
      <div class="card" id="dropZone">Drag and drop files here</div>
      <div class="grid stats-grid">
        ${state.records.map((r) => `<article class="card"><strong>${r.title}</strong><p class="muted">${r.type.toUpperCase()}</p><progress value="${r.progress}" max="100"></progress></article>`).join("")}
      </div>
    </section>
  `;
}

function renderBilling() {
  pageContainer.innerHTML = `
    <section class="card">
      <h3>Invoice Preview</h3>
      <div class="two-col">
        <div class="card"><label>Patient</label><input value="Rohan Singh" /><label>Amount</label><input value="3400" /><label>Status</label><select><option>Pending</option><option>Paid</option></select></div>
        <div class="card"><h4>Summary</h4><p class="muted">Service Charges and taxes breakdown</p><div class="skeleton" style="height:120px"></div></div>
      </div>
      <div class="tab-row"><button class="btn">Download</button><button class="btn btn-ghost">Print</button></div>
      <div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Patient</th><th>Amount</th><th>Status</th></tr></thead><tbody>${state.bills.map((b) => `<tr><td>${b.invoice}</td><td>${b.patient}</td><td>$${b.amount}</td><td><span class="chip ${b.status === "paid" ? "completed" : "pending"}">${b.status}</span></td></tr>`).join("")}</tbody></table></div>
    </section>
  `;
}

function renderUsers() {
  pageContainer.innerHTML = `
    <section class="card">
      <h3>User Directory</h3>
      <div class="table-wrap"><table><thead><tr><th>Name</th><th>Role</th><th>Status</th></tr></thead><tbody>${state.users.map((u) => `<tr><td>${u.fullName}</td><td>${u.role}</td><td>${u.status}</td></tr>`).join("")}</tbody></table></div>
      <div class="card"><h4>Empty State</h4><p class="muted">No recent inactive users. Try adjusting filters.</p></div>
    </section>
  `;
}

function renderNotificationPanel() {
  notificationPanel.innerHTML = `<h3>Notifications</h3>${state.notifications.map((n) => `<article class="card"><p>${n.text}</p><small class="muted">${n.time}</small></article>`).join("")}`;
}

function bindGlobalActions() {
  document.getElementById("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    state.theme = document.body.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem("hms_theme", state.theme);
  });
  document.getElementById("sidebarToggle").addEventListener("click", () => document.getElementById("sidebar").classList.toggle("collapsed"));
  document.getElementById("filterToggle").addEventListener("click", () => filtersPanel.classList.toggle("hidden"));
  document.getElementById("notifyToggle").addEventListener("click", () => notificationPanel.classList.toggle("open"));
  document.getElementById("profileToggle").addEventListener("click", () => profileDropdown.classList.toggle("hidden"));
  document.getElementById("settingsBtn").addEventListener("click", openSettings);
  document.getElementById("fabButton").addEventListener("click", () => {
    const patientActions = `<div class="grid"><button data-patient-jump='booking'>Book Again</button><button data-patient-jump='prescriptions'>View Last Prescription</button></div>`;
    const defaultActions = `<div class="grid"><button data-jump='appointments'>Book Appointment</button><button data-jump='billing'>Create Invoice</button><button data-jump='records'>Upload Record</button></div>`;
    openModal("Quick Actions", state.role === "patient" ? patientActions : defaultActions);
  });
  document.getElementById("globalSearch").addEventListener("input", (e) => {
    if (e.target.value.length > 2) toast(`Searching for "${e.target.value}"`, "info");
  });
  document.addEventListener("click", (e) => {
    if (e.target.id === "logoutBtn") {
      localStorage.removeItem("hms_token");
      localStorage.removeItem("hms_role");
      location.reload();
    }
    if (e.target.matches("[data-jump]")) {
      state.page = e.target.dataset.jump;
      renderPage();
    }
    if (e.target.matches("[data-patient-jump]")) {
      const stepMap = { booking: 2, prescriptions: 4 };
      state.page = "dashboard";
      state.patientJourneyStep = stepMap[e.target.dataset.patientJump] || 1;
      renderPage();
      closeModal();
    }
    if (e.target.matches("[data-user-action]")) {
      openModal("User Action", `<p>Action: ${e.target.dataset.userAction} on ${e.target.dataset.id}</p><button id="closeModalBtn">Close</button>`);
    }
  });
}

function bindScopedActions() {
  document.querySelectorAll("[data-problem]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.intake.problem = btn.dataset.problem;
      const input = document.getElementById("problemInput");
      if (input) input.value = state.intake.problem;
    })
  );
  const nextIntakeBtn = document.getElementById("nextIntakeBtn");
  if (nextIntakeBtn)
    nextIntakeBtn.addEventListener("click", () => {
      if (state.intakeStep === 1) state.intake.problem = document.getElementById("problemInput")?.value || state.intake.problem || "Fever";
      if (state.intakeStep === 2) {
        state.intake.name = document.getElementById("intakeName")?.value || state.intake.name;
        state.intake.age = document.getElementById("intakeAge")?.value || state.intake.age;
        state.intake.gender = document.getElementById("intakeGender")?.value || state.intake.gender;
      }
      state.intakeStep = Math.min(3, state.intakeStep + 1);
      renderPatientDashboard();
      bindScopedActions();
    });

  document.querySelectorAll("[data-journey-step]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const target = Number(btn.dataset.journeyStep);
      if (target <= state.patientJourneyStep) {
        state.patientJourneyStep = target;
        renderPatientDashboard();
        bindScopedActions();
      }
    })
  );

  const saveProfileBtn = document.getElementById("saveProfileBtn");
  if (saveProfileBtn)
    saveProfileBtn.addEventListener("click", () => {
      state.patientProfile = {
        name: document.getElementById("intakeName")?.value || state.patientProfile.name,
        age: document.getElementById("intakeAge")?.value || state.patientProfile.age,
        gender: document.getElementById("intakeGender")?.value || state.patientProfile.gender,
        contact: document.getElementById("pContact")?.value || state.patientProfile.contact,
        email: document.getElementById("pEmail")?.value || state.patientProfile.email,
      };
      toast("Profile updated", "success");
      state.intakeStep = 1;
      unlockPatientStep("profile");
    });

  const nextStepBtn = document.getElementById("nextStep");
  if (nextStepBtn) nextStepBtn.addEventListener("click", () => {
    state.bookingStep = Math.min(5, state.bookingStep + 1);
    if (state.role === "patient") renderPatientDashboard();
    else renderAppointments();
    bindScopedActions();
  });
  const confirmBooking = document.getElementById("confirmBooking");
  if (confirmBooking) confirmBooking.addEventListener("click", () => {
    openModal("Appointment Confirmed", "<p>Your appointment has been successfully confirmed.</p>");
    state.bookingStep = 1;
    toast("Appointment booked successfully", "success");
    if (state.role === "patient") unlockPatientStep("booking");
  });

  document.querySelectorAll("[data-chat]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const msg = btn.dataset.chat;
      state.patientChat.push({ who: "user", text: msg });
      const response =
        msg === "Book Doctor Appointment"
          ? "I recommend booking a physician. Opening booking step."
          : "Drink fluids, rest well, and monitor symptoms. Consult doctor if symptoms persist.";
      state.patientChat.push({ who: "bot", text: response });
      if (msg === "Book Doctor Appointment") {
        state.patientJourneyStep = Math.max(2, state.patientJourneyStep);
      }
      renderPatientDashboard();
      bindScopedActions();
    })
  );

  const completeChatBtn = document.getElementById("completeChatBtn");
  if (completeChatBtn)
    completeChatBtn.addEventListener("click", () => {
      toast("Consultation complete", "success");
      unlockPatientStep("chat");
    });

  document.querySelectorAll("[data-prescription]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (btn.dataset.prescription === "view") {
        openModal("Prescription Details", "<p>Paracetamol 500mg after meals for 5 days.</p>");
      } else {
        toast("Prescription download started", "success");
      }
    })
  );

  const completePrescriptionsBtn = document.getElementById("completePrescriptionsBtn");
  if (completePrescriptionsBtn)
    completePrescriptionsBtn.addEventListener("click", () => {
      unlockPatientStep("prescriptions");
    });
  document.querySelectorAll("[data-doctor]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.selectedDoctor = btn.dataset.doctor;
      renderPatientDashboard();
      bindScopedActions();
    })
  );
  document.querySelectorAll("[data-slot]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.selectedSlot = btn.dataset.slot;
      renderPatientDashboard();
      bindScopedActions();
    })
  );
  const nextBookingPremium = document.getElementById("nextBookingPremium");
  if (nextBookingPremium)
    nextBookingPremium.addEventListener("click", () => {
      state.bookingPremiumStep = Math.min(4, state.bookingPremiumStep + 1);
      renderPatientDashboard();
      bindScopedActions();
    });
  const confirmPremiumBookingBtn = document.getElementById("confirmPremiumBookingBtn");
  if (confirmPremiumBookingBtn)
    confirmPremiumBookingBtn.addEventListener("click", () => {
      openModal("Booking Confirmed", "<div class='success-check'>✓</div><p>Appointment details confirmed.</p>");
      toast("Proceed to payment", "success");
    });
  document.querySelectorAll("[data-pay]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.paymentMethod = btn.dataset.pay;
      renderPatientDashboard();
      bindScopedActions();
    })
  );
  const completePaymentBtn = document.getElementById("completePaymentBtn");
  if (completePaymentBtn)
    completePaymentBtn.addEventListener("click", () => {
      openModal("Appointment Confirmed", "<div class='success-check'>✓</div><p>Payment successful. Appointment confirmed.</p>");
      state.paymentMethod = "";
      state.bookingPremiumStep = 1;
      unlockPatientStep("booking");
    });
  document.querySelectorAll("[data-patient]").forEach((btn) => btn.addEventListener("click", () => {
    state.selectedPatientId = btn.dataset.patient;
    renderDoctorDashboard();
    bindScopedActions();
  }));
  const saveDoctorNotes = document.getElementById("saveDoctorNotes");
  if (saveDoctorNotes) saveDoctorNotes.addEventListener("click", () => toast("Doctor notes saved", "success"));
  const receptionForm = document.getElementById("receptionForm");
  if (receptionForm) receptionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    toast("Patient check-in completed", "success");
  });
  const dropZone = document.getElementById("dropZone");
  if (dropZone) {
    dropZone.addEventListener("dragover", (e) => e.preventDefault());
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      toast(`Uploaded ${e.dataTransfer.files.length} file(s)`, "success");
    });
  }
}

function toast(message, type) {
  const item = document.createElement("div");
  item.className = "toast";
  item.style.borderLeftColor = type === "success" ? "#13b97f" : type === "error" ? "#e64e69" : "#2a6df4";
  item.textContent = message;
  toastRoot.appendChild(item);
  setTimeout(() => item.remove(), 2600);
}

function openModal(title, content) {
  modalRoot.classList.remove("hidden");
  modalRoot.innerHTML = `<article class="modal"><h3>${title}</h3>${content}<div class="tab-row"><button id="closeModalBtn">Close</button><button id="confirmModalBtn" class="btn">Confirm</button></div></article>`;
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  const confirmBtn = document.getElementById("confirmModalBtn");
  if (confirmBtn) confirmBtn.addEventListener("click", () => {
    toast("Action confirmed", "success");
    closeModal();
  });
}

function closeModal() {
  modalRoot.classList.add("hidden");
  modalRoot.innerHTML = "";
}

function openSettings() {
  settingsPanel.classList.remove("hidden");
  settingsPanel.innerHTML = `
    <h3>Settings</h3>
    <label>Theme</label>
    <select id="themeSelect"><option value="light">Light</option><option value="dark">Dark</option></select>
    <label>Notifications</label>
    <select><option>Enabled</option><option>Disabled</option></select>
    <label>Account Preference</label>
    <select><option>Compact</option><option>Comfortable</option></select>
    <div class="tab-row"><button id="closeSettings">Close</button></div>
  `;
  document.getElementById("themeSelect").value = state.theme;
  document.getElementById("themeSelect").addEventListener("change", (e) => {
    state.theme = e.target.value;
    if (state.theme === "dark") document.body.classList.add("dark");
    else document.body.classList.remove("dark");
    localStorage.setItem("hms_theme", state.theme);
  });
  document.getElementById("closeSettings").addEventListener("click", () => settingsPanel.classList.add("hidden"));
}

init();

/* ==========================================================
   script.js - Interaksi Portofolio Mahasiswa (JavaScript murni)
   Setiap fitur ada di fungsi sendiri; semuanya dipanggil di bagian
   paling bawah file. Nama id dan class di sini harus sama dengan
   yang ada di index.html dan css/style.css.
   ========================================================== */
"use strict";

/* ---------- 1. Tahun otomatis di footer ---------- */
function initYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
}

/* ---------- 2. Menu hamburger (layar kecil) ---------- */
function initMenu() {
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-menu");
  if (!toggle || !menu) return;

  // Buka/tutup menu sekaligus memperbarui atribut aksesibilitas
  function setOpen(open) {
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  }

  toggle.addEventListener("click", () => setOpen(!menu.classList.contains("is-open")));

  // Menu ditutup saat: salah satu menu dipilih, klik di luar navbar, atau tombol Esc ditekan
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".navbar")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus(); // kembalikan fokus keyboard ke tombol hamburger
    }
  });

  // Jika layar melebar (menu tampil sebagai baris), kembalikan status menu ke tertutup
  window.matchMedia("(min-width: 640px)").addEventListener("change", () => setOpen(false));
}

/* ---------- 3. Filter kartu proyek ---------- */
function initFilter() {
  const buttons = document.querySelectorAll(".filter__btn");
  const cards = document.querySelectorAll("#project-grid .card");
  const empty = document.getElementById("projects-empty");
  if (!buttons.length || !cards.length) return;

  // Tampilkan kartu yang kategorinya cocok, sembunyikan sisanya
  function applyFilter(category) {
    let visible = 0;
    cards.forEach((card) => {
      const show = category === "all" || card.dataset.category === category;
      card.hidden = !show;
      if (show) visible++;
    });
    if (empty) empty.hidden = visible > 0; // pesan "belum ada proyek" hanya jika hasil kosong
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      applyFilter(btn.dataset.filter);
    });
  });
}

/* ---------- 4. Animasi memudar saat kartu/timeline terlihat ---------- */
function initReveal() {
  // Jika browser tidak mendukung IntersectionObserver, elemen dibiarkan tampil biasa
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // animasi cukup sekali
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".card, .timeline__item").forEach((el) => {
    el.classList.add("reveal");
    observer.observe(el);
  });
}

/* ---------- 5. Scroll: menu aktif dan tombol kembali ke atas ---------- */
function initScroll() {
  const backToTop = document.getElementById("back-to-top");
  const links = document.querySelectorAll(".nav-link");

  // Bagian-bagian yang punya menu di navbar, urut dari atas ke bawah
  const sections = Array.from(links)
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  function update() {
    // Tombol kembali ke atas muncul setelah scroll 400px
    if (backToTop) backToTop.hidden = window.scrollY < 400;
    if (!sections.length) return;

    // Bagian aktif = bagian terakhir yang bagian atasnya sudah melewati garis 120px dari atas layar
    let current = sections[0];
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= 120) current = section;
    });
    // Di dasar halaman, bagian terakhir dianggap aktif
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      current = sections[sections.length - 1];
    }

    links.forEach((link) => {
      if (link.getAttribute("href") === "#" + current.id) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  // requestAnimationFrame mencegah update berjalan terlalu sering saat scroll
  let waiting = false;
  window.addEventListener(
    "scroll",
    () => {
      if (waiting) return;
      waiting = true;
      requestAnimationFrame(() => {
        update();
        waiting = false;
      });
    },
    { passive: true }
  );
  update();

  // Scroll ke atas; kehalusannya diatur CSS (scroll-behavior) dan mengikuti pengaturan "kurangi gerakan"
  if (backToTop) backToTop.addEventListener("click", () => window.scrollTo({ top: 0 }));
}

/* ---------- 6. Formulir kontak: validasi + mailto ---------- */
function initForm() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  if (!form || !status) return;

  const fields = {
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    message: document.getElementById("message"),
  };
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // pola email sederhana

  // Aturan tiap kolom: mengembalikan pesan galat, atau "" jika isian sudah benar
  const rules = {
    name: (v) => (v ? "" : "Nama belum diisi."),
    email: (v) => {
      if (!v) return "Email belum diisi.";
      return emailPattern.test(v) ? "" : "Format email belum benar. Contoh: nama@email.com";
    },
    message: (v) => (v ? "" : "Pesan belum diisi."),
  };

  // Tampilkan atau hapus pesan galat di bawah kolom
  function showError(key, text) {
    document.getElementById(key + "-error").textContent = text;
    if (text) fields[key].setAttribute("aria-invalid", "true");
    else fields[key].removeAttribute("aria-invalid");
  }

  function validate(key) {
    const text = rules[key](fields[key].value.trim());
    showError(key, text);
    return text === "";
  }

  // Setelah ada galat, periksa ulang saat pengguna mengetik agar pesan hilang begitu isian benar
  Object.keys(fields).forEach((key) => {
    fields[key].addEventListener("input", () => {
      if (fields[key].hasAttribute("aria-invalid")) validate(key);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // cegah halaman memuat ulang
    status.textContent = "";

    // Periksa semua kolom sekaligus, lalu arahkan fokus ke kolom pertama yang salah
    const results = Object.keys(fields).map(validate);
    if (results.includes(false)) {
      const firstInvalid = Object.keys(fields).find((key) => fields[key].hasAttribute("aria-invalid"));
      fields[firstInvalid].focus();
      return;
    }

    // Alamat tujuan diambil dari atribut data-email pada <form> di index.html
    const to = form.dataset.email || "";
    if (!emailPattern.test(to)) {
      status.textContent = "Alamat email tujuan belum diisi. Ganti [ISI EMAIL PROFESIONAL] pada atribut data-email di index.html.";
      return;
    }

    const name = fields.name.value.trim();
    const email = fields.email.value.trim();
    const message = fields.message.value.trim();
    const subject = "Pesan dari " + name;
    const body = message + "\n\nDari: " + name + " (" + email + ")";

    // Membuka aplikasi email dengan pesan yang sudah terisi (belum terkirim sampai pengguna menekan Kirim)
    window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    status.textContent = "Aplikasi email dibuka. Pesan baru terkirim setelah Anda menekan Kirim di sana. Jika tidak terbuka, kirim langsung ke " + to + ".";
  });
}

/* ---------- Jalankan semua fitur ---------- */
initYear();
initMenu();
initFilter();
initReveal();
initScroll();
initForm();
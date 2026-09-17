# Pengujian Black Box — SITRACK

Berikut adalah pengujian Black Box untuk keseluruhan 17 fitur (Use Case) yang ada pada sistem SITRACK. Pengujian untuk fitur pengelolaan (CRUD) mencakup skenario Tambah, Tampil, Ubah, dan Hapus.

---

### Tabel 5.1 Pengujian UC-01: Login

| No | Skenario Uji | *Input* | Output yang Diharapkan | Keterangan |
|:---:|---|---|---|:---:|
| 1 | Login dengan kredensial valid (Role Admin). | Email: `admin@unikom.ac.id`<br>Password: `password123` | Sistem menerima kredensial, memberikan akses, dan mengarahkan pengguna ke halaman Dashboard Admin. | Valid |
| 2 | Login dengan kredensial valid (Role Alumni). | Email: `alumni@mail.com`<br>Password: `password123` | Sistem menerima kredensial, memberikan akses, dan mengarahkan pengguna ke halaman Dashboard Alumni. | Valid |
| 3 | Login dengan kredensial salah atau tidak terdaftar. | Email: `salah@mail.com`<br>Password: `salah123` | Sistem menolak akses dan menampilkan pesan error "Email atau Password salah". | Valid |
| 4 | Mengosongkan form login lalu submit. | Email: *(kosong)*<br>Password: *(kosong)* | Sistem menahan form dan menampilkan pesan peringatan bahwa email dan password wajib diisi. | Valid |

---

### Tabel 5.2 Pengujian UC-02: Dashboard Admin

| No | Skenario Uji | *Input* | Output yang Diharapkan | Keterangan |
|:---:|---|---|---|:---:|
| 1 | Menampilkan Dashboard (Read). | Klik menu "Dashboard" (Admin). | Sistem menampilkan halaman dashboard beserta metrik statistik (total alumni, response rate). | Valid |
| 2 | Akses URL tanpa hak akses super_user. | Buka URL `/admin` dengan akun alumni. | Sistem menolak akses dan melakukan *redirect* kembali ke `/dashboard`. | Valid |

---

### Tabel 5.3 Pengujian UC-03: Manajemen Tracer Study (CRUD)

| No | Skenario Uji | *Input* | Output yang Diharapkan | Keterangan |
|:---:|---|---|---|:---:|
| 1 | Menampilkan daftar respons (Read). | Buka halaman Tracer Study Admin. | Sistem menampilkan tabel daftar alumni yang telah mengisi kuesioner. | Valid |
| 2 | Menambah data respons manual (Create). | Pilih alumni pada form, isi jawaban kuesionernya, lalu klik Simpan. | Sistem menyimpan respons ke *database* dan baris baru muncul di dalam tabel. | Valid |
| 3 | Menambah data dengan kolom wajib kosong (Validasi). | Mengosongkan field Status Pekerjaan pada saat tambah data, lalu Simpan. | Sistem menahan proses dan memunculkan pesan validasi "Kolom ini wajib diisi". | Valid |
| 4 | Mengubah data respons alumni (Update). | Klik Edit pada salah satu baris respons, ubah nominal gaji, lalu Simpan. | Sistem memperbarui data respons di *database* dan memperbarui tampilan pada tabel. | Valid |
| 5 | Menghapus respons alumni (Delete). | Klik tombol Hapus, lalu konfirmasi "Ya". | Sistem menghapus data respons secara permanen dari tabel dan *database*. | Valid |

---

### Tabel 5.4 Pengujian UC-04: Export Data

| No | Skenario Uji | *Input* | Output yang Diharapkan | Keterangan |
|:---:|---|---|---|:---:|
| 1 | Melakukan *export* data tersedia. | Klik tombol "Export Data (Excel)". | Sistem memproses data, membuat file `.xlsx`, dan otomatis mengunduh ke perangkat. | Valid |
| 2 | Melakukan *export* saat tabel kosong. | Klik tombol "Export Data" pada tabel kosong. | Sistem tidak memproses unduhan dan memunculkan notifikasi "Tidak ada data". | Valid |

---

### Tabel 5.5 Pengujian UC-05: Manajemen Konten

| No | Skenario Uji | *Input* | Output yang Diharapkan | Keterangan |
|:---:|---|---|---|:---:|
| 1 | Menavigasi sub-menu konten. | Klik menu "Manajemen Konten". | Sistem menampilkan dropdown pilihan sub-menu (Lowongan, Berita, FAQ, Sertifikasi). | Valid |

---

### Tabel 5.6 Pengujian UC-06: Kelola Lowongan Kerja (CRUD)

| No | Skenario Uji | *Input* | Output yang Diharapkan | Keterangan |
|:---:|---|---|---|:---:|
| 1 | Menampilkan daftar lowongan (Read). | Buka halaman Kelola Lowongan. | Sistem menampilkan tabel lowongan kerja yang tersedia beserta statusnya. | Valid |
| 2 | Menambah data lowongan baru (Create). | Isi seluruh form dengan data lowongan baru lalu Simpan. | Sistem menyimpan data, muncul notifikasi sukses, dan data bertambah di tabel. | Valid |
| 3 | Menambah data dengan kolom wajib kosong (Validasi). | Kosongkan kolom "Judul", lalu Simpan. | Sistem menampilkan peringatan merah "Judul wajib diisi" dan menahan proses simpan. | Valid |
| 4 | Mengubah data lowongan (Update). | Klik Edit, ubah nominal "Gaji", lalu Simpan. | Sistem memperbarui data gaji di database, dan perubahan terlihat langsung pada tabel. | Valid |
| 5 | Menghapus data lowongan (Delete). | Klik tombol Hapus, lalu konfirmasi "Ya". | Sistem menghapus data dari database, notifikasi sukses muncul, data hilang dari tabel. | Valid |

---

### Tabel 5.7 Pengujian UC-07: Kelola Berita (CRUD)

| No | Skenario Uji | *Input* | Output yang Diharapkan | Keterangan |
|:---:|---|---|---|:---:|
| 1 | Menampilkan daftar berita (Read). | Buka halaman Kelola Berita. | Sistem menampilkan tabel daftar berita dan artikel beserta statusnya (Draft/Published). | Valid |
| 2 | Menambah berita baru (Create). | Isi Judul, Konten, Kategori, upload Gambar, klik Simpan. | Sistem mengupload gambar, menyimpan teks ke database, dan menampilkannya di tabel. | Valid |
| 3 | Validasi *upload* gambar salah tipe (Validasi). | Upload gambar format `.pdf`. | Sistem menolak file, menampilkan error "Hanya menerima format gambar". | Valid |
| 4 | Mengubah konten dan status berita (Update). | Klik Edit, ubah status dari Draft ke Published, lalu Simpan. | Sistem menyimpan perubahan dan status di tabel berubah menjadi Published. | Valid |
| 5 | Menghapus data berita (Delete). | Klik Hapus, lalu konfirmasi penghapusan. | Sistem menghapus berita beserta file gambar di *Storage*, data hilang dari tabel. | Valid |

---

### Tabel 5.8 Pengujian UC-08: Kelola Pertanyaan (CRUD)

| No | Skenario Uji | *Input* | Output yang Diharapkan | Keterangan |
|:---:|---|---|---|:---:|
| 1 | Menampilkan daftar pertanyaan (Read). | Buka halaman Kelola Pertanyaan. | Sistem menampilkan tabel pertanyaan yang akan muncul di Tracer Study. | Valid |
| 2 | Menambahkan pertanyaan baru (Create). | Teks: "Gaji Saat Ini?", Tipe: "Select", Opsi: "A, B", Simpan. | Sistem menyimpan JSON pertanyaan dan menambahkannya ke tabel. | Valid |
| 3 | Mengubah pertanyaan (Update). | Klik Edit, tambahkan Opsi "C", Simpan. | Sistem menyimpan perubahan opsi, dan memperbarui tampilan pertanyaan. | Valid |
| 4 | Menonaktifkan pertanyaan (Update/Soft Delete). | Ubah switch "Aktif" menjadi *Off* (Non-aktif). | Sistem mengupdate status ke *inactive*, sehingga tidak tampil di form pengisian kuesioner alumni. | Valid |
| 5 | Menghapus permanen (Delete). | Klik Hapus pada pertanyaan yang tidak terpakai. | Sistem menghapus permanen baris tersebut dari database. | Valid |

---

### Tabel 5.9 Pengujian UC-09: Kelola Sertifikasi (CRUD)

| No | Skenario Uji | *Input* | Output yang Diharapkan | Keterangan |
|:---:|---|---|---|:---:|
| 1 | Menampilkan daftar sertifikasi (Read). | Buka halaman Kelola Sertifikasi. | Sistem menampilkan tabel informasi sertifikasi. | Valid |
| 2 | Menambah sertifikasi baru (Create). | Isi form sertifikasi lengkap dengan URL pendaftaran, Simpan. | Sistem membuat data baru di database (termasuk *auto-slug*) dan menambah baris tabel. | Valid |
| 3 | Mengubah detail sertifikasi (Update). | Klik Edit, ubah Harga Sertifikasi, Simpan. | Sistem memperbarui nominal harga di database dan tampilan tabel ter-update. | Valid |
| 4 | Menghapus data sertifikasi (Delete). | Klik tombol Hapus, konfirmasi penghapusan. | Sistem menghapus data secara permanen dari tabel. | Valid |

---

### Tabel 5.10 Pengujian UC-10: Manajemen Alumni (CRUD)

| No | Skenario Uji | *Input* | Output yang Diharapkan | Keterangan |
|:---:|---|---|---|:---:|
| 1 | Menampilkan & mencari alumni (Read). | Buka halaman Alumni, cari nama "Budi". | Sistem memfilter dan hanya menampilkan baris alumni dengan nama Budi. | Valid |
| 2 | Menambah alumni secara manual (Create). | Isi Email, Nama, dan NIM pada form Tambah, lalu klik Simpan. | Sistem membuat akun baru di *Supabase Auth* dan *database*, baris alumni bertambah di tabel. | Valid |
| 3 | Menambah alumni dengan NIM terdaftar (Validasi). | Input NIM yang sudah digunakan oleh alumni lain, klik Simpan. | Sistem menolak input dan memunculkan peringatan "NIM sudah terdaftar dalam sistem". | Valid |
| 4 | Mengubah data profil alumni (Update). | Klik Edit pada Budi, ubah teks NIM yang salah ketik, lalu Simpan. | Sistem memperbarui data profil pada *database* tanpa memengaruhi akun lainnya. | Valid |
| 5 | Mereset Password alumni (Update). | Klik "Reset Password" pada baris alumni. | Sistem mereset kata sandi lewat API Admin Supabase, password kembali ke *default*. | Valid |
| 6 | Menghapus akun alumni (Delete). | Klik "Hapus Akun", konfirmasi penghapusan. | Sistem menghapus profil serta *auth user* di Supabase Auth, data hilang permanen. | Valid |

---

### Tabel 5.11 Pengujian UC-11: Import Data

| No | Skenario Uji | *Input* | Output yang Diharapkan | Keterangan |
|:---:|---|---|---|:---:|
| 1 | Mengunggah CSV format valid (Create Bulk). | Upload `data_valid.csv`, klik Proses. | Sistem mendaftarkan seluruh akun alumni dan memunculkan ringkasan hasil import. | Valid |
| 2 | Mengunggah file salah tipe (Validasi). | Upload `dokumen.pdf`. | Sistem menolak file dan memunculkan pesan error "Format file tidak didukung". | Valid |
| 3 | Mengunggah CSV dengan duplikat (Validasi). | Upload `data.csv` berisi NIM yang sudah ada di database. | Sistem melewati baris duplikat, hanya memasukkan data baru, dan melapor di ringkasan import. | Valid |

---

### Tabel 5.12 Pengujian UC-12: Dashboard Alumni

| No | Skenario Uji | *Input* | Output yang Diharapkan | Keterangan |
|:---:|---|---|---|:---:|
| 1 | Menampilkan Dashboard (Read). | Akses `/dashboard` setelah login. | Sistem menampilkan ringkasan profil alumni dan *quick actions*. | Valid |
| 2 | Menampilkan notifikasi lengkapi profil (Read). | Akses dengan akun baru yang datanya kosong. | Sistem mendeteksi profil belum lengkap dan memunculkan peringatan kuning di atas halaman. | Valid |

---

### Tabel 5.13 Pengujian UC-13: Tracer Study (CRUD Alumni)

| No | Skenario Uji | *Input* | Output yang Diharapkan | Keterangan |
|:---:|---|---|---|:---:|
| 1 | Menampilkan form kosong (Read). | Buka halaman Tracer Study saat belum pernah mengisi. | Sistem memuat dan menampilkan daftar pertanyaan kuesioner dari database. | Valid |
| 2 | Mengisi form secara penuh (Create). | Isi seluruh pertanyaan lalu klik Submit. | Sistem menyimpan relasi *user* dan *answers* ke database, menampilkan notifikasi sukses. | Valid |
| 3 | Mengosongkan isian wajib (Validasi). | Kosongkan field "Posisi" lalu klik Submit. | Sistem menolak *submit* dan menggarisbawahi field yang kosong dengan warna merah. | Valid |
| 4 | Memperbarui isian form (Update). | Buka ulang form (data lama muncul), ubah Gaji, lalu Submit. | Sistem memperbarui respons (metode *upsert*), tidak menambah baris duplikat. | Valid |

---

### Tabel 5.14 Pengujian UC-14: Rekomendasi Lowongan Kerja

| No | Skenario Uji | *Input* | Output yang Diharapkan | Keterangan |
|:---:|---|---|---|:---:|
| 1 | Mendapat rekomendasi (Read/Algoritma). | Akses halaman "Rekomendasi" (Profil Alumni lengkap). | Sistem memproses dokumen profil dan lowongan dengan CBF, TF-IDF, serta Cosine Similarity, lalu menampilkan daftar lowongan yang urut berdasarkan skor relevansi tertinggi. | Valid |
| 2 | Peringatan profil kosong (Validasi). | Akses halaman "Rekomendasi" (Profil/Skill kosong). | Sistem memunculkan teks "Mohon lengkapi profil dan skill Anda terlebih dahulu". | Valid |

---

### Tabel 5.15 Pengujian UC-15: Jaringan Alumni

| No | Skenario Uji | *Input* | Output yang Diharapkan | Keterangan |
|:---:|---|---|---|:---:|
| 1 | Menampilkan daftar seluruh alumni (Read). | Buka halaman Jaringan Alumni. | Sistem memuat *grid card* berisi nama, pekerjaan, dan kontak publik alumni lain. | Valid |
| 2 | Mencari rekan alumni (Read/Search). | Ketik "Informatika" di kotak pencarian. | Sistem menyaring *list* secara *real-time* dan hanya menampilkan lulusan prodi tersebut. | Valid |

---

### Tabel 5.16 Pengujian UC-16: Profile Alumni (CRUD Profil)

| No | Skenario Uji | *Input* | Output yang Diharapkan | Keterangan |
|:---:|---|---|---|:---:|
| 1 | Menampilkan biodata dan riwayat (Read). | Buka menu Profile. | Sistem mengambil data tabel `profiles` dan `track_records`, lalu menampilkannya. | Valid |
| 2 | Mengubah biodata dan menambah skill (Update). | Ubah isian *Bio*, tambah tag *Skill*, lalu Simpan. | Sistem memperbarui *row* pengguna di tabel `profiles`, perubahan tersimpan. | Valid |
| 3 | Menambah Riwayat Pekerjaan baru (Create). | Isi form Perusahaan & Posisi baru, lalu Tambah. | Sistem meng-insert data ke tabel `track_records` dan menampilkannya di halaman profil. | Valid |
| 4 | Menghapus Riwayat Pekerjaan (Delete). | Klik tombol Hapus pada salah satu kotak riwayat kerja. | Sistem menghapus riwayat tersebut dari database dan dari tampilan layar. | Valid |

---

### Tabel 5.17 Pengujian UC-17: Generate CV

| No | Skenario Uji | *Input* | Output yang Diharapkan | Keterangan |
|:---:|---|---|---|:---:|
| 1 | Generate CV dengan profil lengkap (Read/Export). | Klik tombol "Generate CV". | Sistem memetakan data profil ke format dokumen PDF dan memicu *download*. | Valid |
| 2 | Generate CV profil tidak lengkap (Validasi). | Klik "Generate CV" namun kolom nama kosong. | Sistem menolak aksi dan memberi peringatan "Mohon lengkapi data dasar sebelum men-generate CV". | Valid |

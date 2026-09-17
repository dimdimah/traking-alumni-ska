# Dokumen User Acceptance Testing (UAT) - SITRACK

Dokumen ini berisi skenario pengujian *User Acceptance Testing* (UAT) untuk memastikan fitur-fitur pada **SITRACK (Sistem Informasi Track Record Alumni)** berfungsi sesuai dengan kebutuhan bisnis.

| No | Deskripsi | Penjelasan pengujian | Skenario pengujian | Hasil pengujian yang diharapkan | Status |
|:---|:---|:---|:---|:---|:---|
| **A** | **Autentikasi & Otorisasi** | | | | |
| A1 | Login Alumni Berhasil | Menguji apakah alumni dapat login menggunakan email kampus. | 1. Buka halaman login.<br>2. Masukkan email `@amikomsolo.ac.id` yang valid.<br>3. Masukkan password yang benar.<br>4. Klik "Login". | Pengguna berhasil login dan diarahkan ke Dashboard Alumni. | [ ] |
| A2 | Login Email Non-Kampus | Menguji validasi domain email saat login. | 1. Buka halaman login.<br>2. Masukkan email selain `@amikomsolo.ac.id`.<br>3. Masukkan password.<br>4. Klik "Login". | Sistem menolak akses dan menampilkan pesan error validasi domain email. | [ ] |
| A3 | Login Admin Berhasil | Menguji akses login untuk role `super_user`. | 1. Buka halaman login.<br>2. Masukkan kredensial admin yang valid.<br>3. Klik "Login". | Admin berhasil login dan diarahkan ke Dashboard Admin. | [ ] |
| **B** | **Modul Kuesioner (Sistem Alumni)** | | | | |
| B1 | Pengisian Kuesioner Baru | Menguji fitur alumni mengisi kuesioner pertama kali. | 1. Login sebagai Alumni.<br>2. Buka menu Kuesioner.<br>3. Isi semua field wajib (termasuk `company` & `position` jika status Bekerja).<br>4. Klik "Submit". | Data kuesioner berhasil disimpan ke database tanpa error. | [ ] |
| B2 | Validasi Field Wajib | Menguji aturan validasi untuk status pekerjaan "Bekerja" atau "Wirausaha". | 1. Pilih status pekerjaan "Bekerja".<br>2. Kosongkan field nama perusahaan (`company`).<br>3. Klik "Submit". | Sistem menahan pengiriman dan menampilkan peringatan bahwa perusahaan wajib diisi. | [ ] |
| B3 | Update Kuesioner (Upsert) | Menguji apakah sistem menimpa data saat alumni mengisi ulang. | 1. Alumni yang pernah mengisi kuesioner melakukan pengisian ulang.<br>2. Klik "Submit". | Data kuesioner lama diperbarui dengan yang baru, alumni tetap hanya memiliki 1 data response. | [ ] |
| **C** | **Modul Track Record (Riwayat Kerja)** | | | | |
| C1 | Tambah Riwayat Kerja | Menguji fitur penambahan riwayat kerja alumni. | 1. Buka menu Riwayat Kerja.<br>2. Klik "Tambah", isi detail.<br>3. Centang `is_current` (Pekerjaan saat ini).<br>4. Klik "Simpan". | Riwayat kerja baru berhasil ditambahkan pada daftar riwayat alumni. | [ ] |
| C2 | Edit Riwayat Kerja | Menguji fitur perubahan *track record* yang sudah ada. | 1. Pilih riwayat kerja yang sudah ada.<br>2. Ubah data posisi/perusahaan.<br>3. Klik "Simpan". | Data berhasil diperbarui dan tampil pada daftar. | [ ] |
| **D** | **Modul Career Center & Rekomendasi** | | | | |
| D1 | Tampil Lowongan Aktif | Menguji apakah alumni hanya melihat lowongan kerja yang berstatus aktif. | 1. Login sebagai Alumni.<br>2. Buka menu Career Center. | Sistem hanya menampilkan daftar lowongan dengan status `is_active = true`. | [ ] |
| D2 | Rekomendasi Lowongan | Menguji algoritma *Smart Matching* (TF-IDF). | 1. Buka halaman Dashboard/Career Center.<br>2. Periksa bagian "Rekomendasi Lowongan". | Sistem menampilkan rekomendasi lowongan relevan berdasarkan *skills*, lokasi, dan tipe pekerjaan alumni. | [ ] |
| D3 | Manajemen Lowongan (Admin) | Menguji fungsi admin menambah dan mengaktifkan lowongan kerja. | 1. Login sebagai Admin.<br>2. Klik "Tambah Lowongan" di manajemen karir.<br>3. Isi data dan set aktif. | Lowongan baru tersimpan dan otomatis muncul di portal alumni. | [ ] |
| **E** | **Manajemen Admin (Dashboard & Laporan)** | | | | |
| E1 | Import Alumni Massal | Menguji fitur import akun dari file CSV oleh Admin. | 1. Buka menu Manajemen User.<br>2. Upload file CSV format alumni.<br>3. Klik "Import". | Sistem memproses file dan membuatkan akun alumni secara massal. | [ ] |
| E2 | Export Data Laporan | Menguji *export* laporan kuesioner (Sistem Alumni) ke format Excel/CSV. | 1. Buka halaman Statistik/Laporan.<br>2. Klik tombol "Export Data". | File berformat Excel/CSV berhasil diunduh dengan data sesuai filter yang dipilih. | [ ] |
| E3 | Reset Password Alumni | Menguji fitur admin melakukan reset password user. | 1. Pilih akun alumni pada Manajemen User.<br>2. Klik "Reset Password" dan masukkan password baru valid. | Password berhasil diganti, alumni dapat login menggunakan password yang baru. | [ ] |
| **F** | **Keamanan Akses** | | | | |
| F1 | Akses URL Admin oleh User | Menguji *Middleware/Guard* mencegah user biasa mengakses halaman admin. | 1. Login sebagai Alumni.<br>2. Akses paksa URL `/admin` via *address bar*. | Sistem menolak akses dan *redirect* kembali ke dashboard alumni. | [ ] |
